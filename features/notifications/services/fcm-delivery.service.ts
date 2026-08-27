import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NotificationRepository } from "@/features/notifications/repositories/notification.repository";
import { sendNotificationToEmployee } from "@/features/notifications/services/fcm-sender.service";

export const FcmDeliveryService = {
  async enqueue(notificationId: string, employeeId: string, companyId: string) {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("notification_fcm_delivery_outbox").upsert({ notification_id: notificationId, employee_id: employeeId, company_id: companyId, status: "pending", next_attempt_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "notification_id,employee_id", ignoreDuplicates: true });
    if (error) throw new Error("Unable to queue notification delivery.");
    void this.process(notificationId, employeeId, companyId);
  },

  async processPending(limit = 20) {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.from("notification_fcm_delivery_outbox").select("notification_id, employee_id, company_id").eq("status", "pending").lte("next_attempt_at", new Date().toISOString()).order("next_attempt_at", { ascending: true }).limit(limit);
    if (error) throw new Error("Unable to load notification delivery work.");
    for (const row of data ?? []) await this.process(row.notification_id, row.employee_id, row.company_id);
    return { processed: data?.length ?? 0 };
  },  async process(notificationId: string, employeeId: string, companyId: string) {
    const admin = createSupabaseAdminClient();
    const { data: claimed, error: claimError } = await admin.from("notification_fcm_delivery_outbox").update({ status: "processing", attempt_count: 1, updated_at: new Date().toISOString() }).eq("notification_id", notificationId).eq("employee_id", employeeId).eq("company_id", companyId).eq("status", "pending").select("id").maybeSingle();
    if (claimError || !claimed) return;
    try {
      const notification = await NotificationRepository.getForEmployee(notificationId, employeeId, companyId);
      if (!notification) throw new Error("notification_not_found");
      const result = await sendNotificationToEmployee(notification, employeeId, companyId);
      await admin.from("notification_fcm_delivery_outbox").update({ status: "completed", last_error_code: null, updated_at: new Date().toISOString() }).eq("id", claimed.id);
      if (result.transientFailure) throw new Error("fcm_transient_failure");
    } catch (error) {
      const transient = error instanceof Error && error.message === "fcm_transient_failure";
      await admin.from("notification_fcm_delivery_outbox").update({ status: transient ? "pending" : "failed", last_error_code: transient ? "transient_failure" : "delivery_failed", next_attempt_at: new Date(Date.now() + 60_000).toISOString(), updated_at: new Date().toISOString() }).eq("id", claimed.id);
    }
  },
};