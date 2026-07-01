import type { EmployeeRoleName } from "@/features/employees/types/employee.types";

export const SYSTEM_ROLE_ORDER = [
  "Admin",
  "Sales Head",
  "RSM",
  "TSO",
  "SR",
] as const;

export type SystemRoleName = (typeof SYSTEM_ROLE_ORDER)[number];

const REPORTS_TO_ROLE: Record<SystemRoleName, EmployeeRoleName | null> = {
  Admin: null,
  "Sales Head": null,
  RSM: "Sales Head",
  TSO: "RSM",
  SR: "TSO",
};

export function isSystemRoleName(roleName: string): roleName is SystemRoleName {
  return SYSTEM_ROLE_ORDER.includes(roleName as SystemRoleName);
}

export function getAllowedManagerRole(roleName: EmployeeRoleName) {
  if (!isSystemRoleName(roleName)) {
    return undefined;
  }

  return REPORTS_TO_ROLE[roleName];
}
