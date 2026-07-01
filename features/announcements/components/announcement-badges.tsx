import type {
  AnnouncementPriority,
  AnnouncementStatus,
} from "@/features/announcements/types/announcement.types";
import { getPriorityLabel } from "@/features/announcements/constants/announcement-options";
import { cn } from "@/lib/utils";

const priorityStyles: Record<AnnouncementPriority, string> = {
  low: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800",
  normal:
    "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900",
  high: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  urgent:
    "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
};

const statusStyles: Record<AnnouncementStatus, string> = {
  active:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  inactive:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  archived:
    "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800",
};

export function AnnouncementPriorityBadge({
  priority,
}: {
  priority: AnnouncementPriority;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        priorityStyles[priority],
      )}
    >
      {getPriorityLabel(priority)}
    </span>
  );
}

export function AnnouncementStatusBadge({
  status,
}: {
  status: AnnouncementStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}
