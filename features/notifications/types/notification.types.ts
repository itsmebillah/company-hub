import type { Database } from "@/lib/supabase/types";

export type NotificationType = Database["public"]["Enums"]["notification_type"];
export type NotificationPriority =
  Database["public"]["Enums"]["notification_priority"];
export type NotificationDeliveryStatus =
  Database["public"]["Enums"]["notification_delivery_status"];

export type NotificationItem = {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  browserEnabled: boolean;
  realtimeEnabled: boolean;
  nativeEnabled: boolean;
  deliveryStatus: NotificationDeliveryStatus;
  deliveredAt: string | null;
  openedAt: string | null;
  createdAt: string;
};

export type NotificationSummary = {
  unreadCount: number;
  latest: NotificationItem[];
};

export type CreateNotificationInput = {
  companyId: string;
  employeeId?: string | null;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string | null;
  browserEnabled?: boolean;
  realtimeEnabled?: boolean;
  nativeEnabled?: boolean;
  createdBy?: string | null;
};

export type NotificationTrackingEvent = "delivered" | "opened";

export type NotificationRecipient = {
  id: string;
};

export type RealtimeNotificationScope =
  | {
      type: "employee";
      employeeId: string;
      companyId: string;
    }
  | {
      type: "company";
      companyId: string;
    };
