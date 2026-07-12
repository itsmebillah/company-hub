import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  CreateNotificationInput,
  NotificationDeliveryStatus,
  NotificationItem,
  NotificationRecipient,
} from "@/features/notifications/types/notification.types";
import type { Database } from "@/lib/supabase/types";

type NotificationInsert =
  Database["public"]["Tables"]["notifications"]["Insert"];

type NotificationTrackingRow = {
  id: string;
  delivered_at: string | null;
  opened_at: string | null;
  delivery_status: NotificationDeliveryStatus;
  is_read: boolean;
};

function toItem(row: {
  id: string;
  type: Database["public"]["Enums"]["notification_type"];
  priority: Database["public"]["Enums"]["notification_priority"];
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  browser_enabled: boolean;
  realtime_enabled: boolean;
  native_enabled: boolean;
  delivery_status: Database["public"]["Enums"]["notification_delivery_status"];
  delivered_at: string | null;
  opened_at: string | null;
  created_at: string;
}): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    priority: row.priority,
    title: row.title,
    message: row.message,
    actionUrl: row.action_url,
    isRead: row.is_read,
    browserEnabled: row.browser_enabled,
    realtimeEnabled: row.realtime_enabled,
    nativeEnabled: row.native_enabled,
    deliveryStatus: row.delivery_status,
    deliveredAt: row.delivered_at,
    openedAt: row.opened_at,
    createdAt: row.created_at,
  };
}

export const NotificationRepository = {
  async listActiveRecipientsForCompany(
    companyId: string,
  ): Promise<NotificationRecipient[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("employees")
      .select("id")
      .eq("company_id", companyId)
      .eq("status", "active");

    if (error) {
      console.error("[NotificationRepository] Unable to load recipients.", error);
      throw new Error("Unable to create notifications.");
    }

    return data;
  },

  async listForEmployee(employeeId: string, companyId: string, limit = 5) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, type, priority, title, message, action_url, is_read, browser_enabled, realtime_enabled, native_enabled, delivery_status, delivered_at, opened_at, created_at",
      )
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
      .select(
        "id, type, priority, title, message, action_url, is_read, browser_enabled, realtime_enabled, native_enabled, delivery_status, delivered_at, opened_at, created_at",
      )
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
      priority: input.priority ?? "normal",
      title: input.title,
      message: input.message,
      action_url: input.actionUrl ?? null,
      browser_enabled: input.browserEnabled ?? true,
      realtime_enabled: input.realtimeEnabled ?? true,
      native_enabled: input.nativeEnabled ?? true,
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
      priority: input.priority ?? "normal",
      title: input.title,
      message: input.message,
      action_url: input.actionUrl ?? null,
      browser_enabled: input.browserEnabled ?? true,
      realtime_enabled: input.realtimeEnabled ?? true,
      native_enabled: input.nativeEnabled ?? true,
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

  async markAllReadForEmployee(employeeId: string, companyId: string) {
    const now = new Date().toISOString();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        delivery_status: "opened",
        delivered_at: now,
        opened_at: now,
      })
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .eq("is_read", false);

    if (error) {
      console.error(
        "[NotificationRepository] Unable to mark notifications read.",
        error,
      );
      throw new Error("Unable to update notifications.");
    }
  },

  async markAllReadForCompany(companyId: string) {
    const now = new Date().toISOString();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        delivery_status: "opened",
        delivered_at: now,
        opened_at: now,
      })
      .eq("company_id", companyId)
      .eq("is_read", false);

    if (error) {
      console.error(
        "[NotificationRepository] Unable to mark company notifications read.",
        error,
      );
      throw new Error("Unable to update notifications.");
    }
  },

  async getTrackingStateForEmployee(
    id: string,
    employeeId: string,
    companyId: string,
  ): Promise<NotificationTrackingRow | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, delivered_at, opened_at, delivery_status, is_read")
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (error) {
      console.error(
        "[NotificationRepository] Unable to load notification tracking state.",
        error,
      );
      throw new Error("Unable to update notification.");
    }

    return data;
  },

  async markDeliveredForEmployee(id: string, employeeId: string, companyId: string) {
    const current = await this.getTrackingStateForEmployee(id, employeeId, companyId);

    if (!current || current.delivery_status === "opened") {
      return;
    }

    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({
        delivery_status: "delivered",
        delivered_at: current.delivered_at ?? now,
      })
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .neq("delivery_status", "opened");

    if (error) {
      console.error(
        "[NotificationRepository] Unable to mark notification delivered.",
        error,
      );
      throw new Error("Unable to update notification.");
    }
  },

  async markOpenedForEmployee(id: string, employeeId: string, companyId: string) {
    const current = await this.getTrackingStateForEmployee(id, employeeId, companyId);

    if (!current) {
      return;
    }

    if (current.delivery_status === "opened" && current.is_read) {
      return;
    }

    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        delivery_status: "opened",
        delivered_at: current.delivered_at ?? now,
        opened_at: current.opened_at ?? now,
      })
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("employee_id", employeeId);

    if (error) {
      console.error(
        "[NotificationRepository] Unable to mark notification opened.",
        error,
      );
      throw new Error("Unable to update notification.");
    }
  },
};
