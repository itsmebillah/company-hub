import type { NotificationPriority } from "@/features/notifications/types/notification.types";

export const NOTIFICATION_PRIORITY_OPTIONS: Array<{
  value: NotificationPriority;
  label: string;
  description: string;
}> = [
  {
    value: "normal",
    label: "Normal",
    description: "Uses the current in-app notification behavior.",
  },
  {
    value: "high",
    label: "High",
    description: "Shows a browser notification with default vibration.",
  },
  {
    value: "urgent",
    label: "Urgent",
    description: "Keeps the browser notification visible until interaction when supported.",
  },
];

export function isNotificationPriority(value: string): value is NotificationPriority {
  return NOTIFICATION_PRIORITY_OPTIONS.some((option) => option.value === value);
}
