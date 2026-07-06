import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  CreateNotificationInput,
  NotificationItem,
  NotificationRecipient,
} from "@/features/notifications/types/notification.types";
import type { Database } from "@/lib/supabase/types";

type NotificationInsert =
  Database["public"]["Tables"]["notifications"]["Insert"];

function toItem(row: {
  id: string;
  type: Database["public"]["Enums"]["notification_type"];
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    actionUrl: row.action_url,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export const NotificationRepository = {
  async listForEmployee(employeeId: string, companyId: string, limit = 5) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, message, action_url, is_read, created_at")
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[NotificationRepository] Unable to load notifications.", error);
      throw new Error("Unable to load notifications.");
    }

    return data.map(toItem);
  },

  async listForCompany(companyId: string, limit = 5) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, message, action_url, is_read, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error(
        "[NotificationRepository] Unable to load company notifications.",
        error,
      );
      throw new Error("Unable to load notifications.");
    }

    return data.map(toItem);
  },

  async countUnreadForEmployee(employeeId: string, companyId: string) {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .eq("is_read", false);

    if (error) {
      console.error(
        "[NotificationRepository] Unable to count unread notifications.",
        error,
      );
      throw new Error("Unable to load notifications.");
    }

    return count ?? 0;
  },

  async countUnreadForCompany(companyId: string) {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("is_read", false);

    if (error) {
      console.error(
        "[NotificationRepository] Unable to count company notifications.",
        error,
      );
      throw new Error("Unable to load notifications.");
    }

    return count ?? 0;
  },

  async create(input: CreateNotificationInput) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("notifications").insert({
      company_id: input.companyId,
      employee_id: input.employeeId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      action_url: input.actionUrl ?? null,
      created_by: input.createdBy ?? null,
    });

    if (error) {
      console.error("[NotificationRepository] Unable to create notification.", error);
      throw new Error("Unable to create notification.");
    }
  },

  async createForRecipients(
    input: Omit<CreateNotificationInput, "employeeId">,
    recipients: NotificationRecipient[],
  ) {
    if (recipients.length === 0) {
      return;
    }

    const rows: NotificationInsert[] = recipients.map((recipient) => ({
      company_id: input.companyId,
      employee_id: recipient.id,
      type: input.type,
      title: input.title,
      message: input.message,
      action_url: input.actionUrl ?? null,
      created_by: input.createdBy ?? null,
    }));

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("notifications").insert(rows);

    if (error) {
      console.error(
        "[NotificationRepository] Unable to create recipient notifications.",
        error,
      );
      throw new Error("Unable to create notifications.");
    }
  },

  async markReadForEmployee(id: string, employeeId: string, companyId: string) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("employee_id", employeeId);

    if (error) {
      console.error("[NotificationRepository] Unable to mark notification read.", error);
      throw new Error("Unable to update notification.");
    }
  },
};
