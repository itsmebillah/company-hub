import type { AttendanceStatus } from "@/features/attendance/types/attendance.types";
import { getAttendanceStatusLabel } from "@/features/attendance/constants/attendance-options";
import { cn } from "@/lib/utils";

type AttendanceStatusBadgeProps = {
  status: AttendanceStatus;
};

const statusStyles: Record<AttendanceStatus, string> = {
  present: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  absent: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  late: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  half_day: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  holiday: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  leave: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  weekend: "border-muted bg-muted text-muted-foreground",
};

export function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        statusStyles[status],
      )}
    >
      {getAttendanceStatusLabel(status)}
    </span>
  );
}
