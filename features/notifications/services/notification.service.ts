import "server-only";

import { redirect } from "next/navigation";

import { getCurrentAuthUser } from "@/features/auth/services/auth.service";
import { NotificationRepository } from "@/features/notifications/repositories/notification.repository";
import type {
  CreateNotificationInput,
  NotificationRecipient,
  NotificationSummary,
} from "@/features/notifications/types/notification.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function getCurrentNotificationContext() {
  const user = await getCurrentAuthUser();

  if (!user) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, company_id, role_id, status")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !employee || employee.status !== "active") {
    return null;
  }

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("name")
    .eq("company_id", employee.company_id)
    .eq("id", employee.role_id)
    .maybeSingle();

  if (roleError) {
    console.error("[NotificationService] Unable to load role.", roleError);
  }

  return {
    employeeId: employee.id,
    companyId: employee.company_id,
    roleName: role?.name ?? "Employee",
  };
}

async function getActiveCompanyEmployees(
  companyId: string,
): Promise<NotificationRecipient[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "active");

  if (error) {
    console.error("[NotificationService] Unable to load recipients.", error);
    throw new Error("Unable to create notifications.");
  }

  return data;
}

export const NotificationService = {
  async getCurrentUserSummary(): Promise<NotificationSummary> {
    const context = await getCurrentNotificationContext();

    if (!context) {
      return { unreadCount: 0, latest: [] };
    }

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
  },

  async getCurrentAdminSummary(): Promise<NotificationSummary> {
    const context = await getCurrentNotificationContext();

    if (!context) {
      return { unreadCount: 0, latest: [] };
    }

    const [latest, unreadCount] = await Promise.all([
      NotificationRepository.listForCompany(context.companyId),
      NotificationRepository.countUnreadForCompany(context.companyId),
    ]);

    return { latest, unreadCount };
  },

  async markCurrentUserNotificationRead(id: string) {
    const context = await getCurrentNotificationContext();

    if (!context) {
      redirect("/login");
    }

    await NotificationRepository.markReadForEmployee(
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

    if (context.roleName === "Admin") {
      await NotificationRepository.markAllReadForCompany(context.companyId);
      return;
    }

    await NotificationRepository.markAllReadForEmployee(
      context.employeeId,
      context.companyId,
    );
  },

  async create(input: CreateNotificationInput) {
    await NotificationRepository.create(input);
  },

  async createForActiveCompanyEmployees(
    input: Omit<CreateNotificationInput, "employeeId">,
  ) {
    const recipients = await getActiveCompanyEmployees(input.companyId);

    await NotificationRepository.createForRecipients(input, recipients);
  },

  async createForRecipients(
    input: Omit<CreateNotificationInput, "employeeId">,
    recipients: NotificationRecipient[],
  ) {
    const uniqueRecipients = Array.from(
      new Map(recipients.map((recipient) => [recipient.id, recipient])).values(),
    );

    await NotificationRepository.createForRecipients(input, uniqueRecipients);
  },
};
