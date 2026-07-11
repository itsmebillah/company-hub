import type { Database } from "@/lib/supabase/types";

export type NotificationType = Database["public"]["Enums"]["notification_type"];

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
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
  title: string;
  message: string;
  actionUrl?: string | null;
  createdBy?: string | null;
};

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
