import type { LeaveRequestStatus } from "@/features/leave/types/leave.types";
import { cn } from "@/lib/utils";

const statusStyles: Record<LeaveRequestStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  cancelled: "border-muted bg-muted text-muted-foreground",
};

export function LeaveStatusBadge({ status }: { status: LeaveRequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}
