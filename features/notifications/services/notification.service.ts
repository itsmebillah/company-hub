import "server-only";

import { redirect } from "next/navigation";

import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { CurrentEmployeeContextService } from "@/features/auth/services/current-employee-context.service";
import { NotificationRepository } from "@/features/notifications/repositories/notification.repository";
import { FcmDeliveryService } from "@/features/notifications/services/fcm-delivery.service";
import type {
  CreateNotificationInput,
  NotificationRecipient,
  NotificationSummary,
  NotificationTrackingEvent,
} from "@/features/notifications/types/notification.types";
import { ROLE_NAMES } from "@/lib/auth/permissions";

async function getCurrentNotificationContext() {
  const [employee, profile] = await Promise.all([
    CurrentEmployeeContextService.getCurrentEmployeeContext(),
    getCurrentSessionProfile(),
  ]);

  if (!employee || employee.status !== "active" || !profile) {
    return null;
  }

  return {
    employeeId: employee.id,
    companyId: employee.companyId,
    roleName: profile.roleName,
  };
}

async function getActiveCompanyEmployees(
  companyId: string,
): Promise<NotificationRecipient[]> {
  return NotificationRepository.listActiveRecipientsForCompany(companyId);
}

export const NotificationService = {
  async getCurrentUserSummary(): Promise<NotificationSummary> {
    const context = await getCurrentNotificationContext();

    if (!context) {
      return { unreadCount: 0, latest: [] };
    }

    try {
      const [latest, unreadCount] = await Promise.all([
        NotificationRepository.listForEmployee(
          context.employeeId,
          context.companyId,
        ),
        NotificationRepository.countUnreadForEmployee(
          context.employeeId,
          context.companyId,
        ),
      ]);

      return { latest, unreadCount };
    } catch (error) {
      console.error(
        "[NotificationService] Unable to load current user notification summary.",
        error,
      );

      return { unreadCount: 0, latest: [] };
    }
  },

  async getCurrentAdminSummary(): Promise<NotificationSummary> {
    const context = await getCurrentNotificationContext();

    if (!context) {
      return { unreadCount: 0, latest: [] };
    }

    try {
      const [latest, unreadCount] = await Promise.all([
        NotificationRepository.listForCompany(context.companyId),
        NotificationRepository.countUnreadForCompany(context.companyId),
      ]);

      return { latest, unreadCount };
    } catch (error) {
      console.error(
        "[NotificationService] Unable to load current admin notification summary.",
        error,
      );

      return { unreadCount: 0, latest: [] };
    }
  },

  async markCurrentUserNotificationRead(id: string) {
    const context = await getCurrentNotificationContext();

    if (!context) {
      redirect("/login");
    }

    await NotificationRepository.markOpenedForEmployee(
      id,
      context.employeeId,
      context.companyId,
    );
  },

  async markCurrentUserNotificationsRead() {
    const context = await getCurrentNotificationContext();

    if (!context) {
      redirect("/login");
    }

    if (context.roleName === ROLE_NAMES.companyAdmin) {
      await NotificationRepository.markAllReadForCompany(context.companyId);
      return;
    }

    await NotificationRepository.markAllReadForEmployee(
      context.employeeId,
      context.companyId,
    );
  },

  async trackCurrentUserNotification(
    id: string,
    event: NotificationTrackingEvent,
  ) {
    const context = await getCurrentNotificationContext();

    if (!context) {
      return false;
    }

    if (event === "opened") {
      await NotificationRepository.markOpenedForEmployee(
        id,
        context.employeeId,
        context.companyId,
      );
      return true;
    }

    await NotificationRepository.markDeliveredForEmployee(
      id,
      context.employeeId,
      context.companyId,
    );
    return true;
  },

  async create(input: CreateNotificationInput) {
    const id = await NotificationRepository.create(input);
    if (input.employeeId) { FcmDeliveryService.enqueue(id, input.employeeId, input.companyId).catch(() => undefined); }
  },

  async createForActiveCompanyEmployees(
    input: Omit<CreateNotificationInput, "employeeId">,
  ) {
    const recipients = await getActiveCompanyEmployees(input.companyId);

    const rows = await NotificationRepository.createForRecipients(input, recipients);
    for (const row of rows ?? []) {
      if (row.employee_id) FcmDeliveryService.enqueue(row.id, row.employee_id, row.company_id).catch(() => undefined);
    }
  },

  async createForRecipients(
    input: Omit<CreateNotificationInput, "employeeId">,
    recipients: NotificationRecipient[],
  ) {
    const uniqueRecipients = Array.from(
      new Map(recipients.map((recipient) => [recipient.id, recipient])).values(),
    );

    const rows = await NotificationRepository.createForRecipients(input, uniqueRecipients);
    for (const row of rows ?? []) {
      if (row.employee_id) FcmDeliveryService.enqueue(row.id, row.employee_id, row.company_id).catch(() => undefined);
    }
  },
};
