import type { EmployeeWorkMode } from "@/features/employees/types/employee.types";

export type EmployeeWorkModeConfig = {
  value: EmployeeWorkMode;
  label: string;
  icon: string;
  description: string;
  badgeClassName: string;
};

export const EMPLOYEE_WORK_MODE_CONFIG: Record<
  EmployeeWorkMode,
  EmployeeWorkModeConfig
> = {
  office: {
    value: "office",
    label: "Office",
    icon: "🏢",
    description: "Office-based employee",
    badgeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  },
  field: {
    value: "field",
    label: "Field",
    icon: "🚗",
    description: "Field employee",
    badgeClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  hybrid: {
    value: "hybrid",
    label: "Hybrid",
    icon: "🔄",
    description: "Office & Field",
    badgeClassName:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
  },
};

export const EMPLOYEE_WORK_MODE_OPTIONS = Object.values(
  EMPLOYEE_WORK_MODE_CONFIG,
);

export function getEmployeeWorkModeConfig(workMode: EmployeeWorkMode) {
  return EMPLOYEE_WORK_MODE_CONFIG[workMode];
}

export function getEmployeeWorkModeLabel(workMode: EmployeeWorkMode) {
  return getEmployeeWorkModeConfig(workMode).label;
}
