import type { EmployeeWorkMode } from "@/features/employees/types/employee.types";
import { getEmployeeWorkModeConfig } from "@/features/employees/constants/employee-work-mode.config";
import { cn } from "@/lib/utils";

type EmployeeWorkModeBadgeProps = {
  workMode: EmployeeWorkMode;
  className?: string;
};

export function EmployeeWorkModeBadge({
  workMode,
  className,
}: EmployeeWorkModeBadgeProps) {
  const config = getEmployeeWorkModeConfig(workMode);

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold",
        config.badgeClassName,
        className,
      )}
      title={config.description}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}
