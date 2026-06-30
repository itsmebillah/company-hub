import type { EmployeeUiStatus } from "@/features/employees/ui/employee-management.types";
import { cn } from "@/lib/utils";

const statusStyles: Record<EmployeeUiStatus, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  inactive: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  archived: "border-muted bg-muted text-muted-foreground",
};

export function EmployeeStatusBadge({ status }: { status: EmployeeUiStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium capitalize",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}
