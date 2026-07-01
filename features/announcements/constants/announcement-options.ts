import type { AnnouncementPriority } from "@/features/announcements/types/announcement.types";

export const ANNOUNCEMENT_PRIORITIES: Array<{
  value: AnnouncementPriority;
  label: string;
}> = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function getPriorityLabel(priority: AnnouncementPriority) {
  return (
    ANNOUNCEMENT_PRIORITIES.find((item) => item.value === priority)?.label ??
    priority
  );
}

export function getPriorityRank(priority: AnnouncementPriority) {
  const ranks: Record<AnnouncementPriority, number> = {
    urgent: 0,
    high: 1,
    normal: 2,
    low: 3,
  };

  return ranks[priority];
}
