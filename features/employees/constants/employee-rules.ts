import type { EmployeeRoleName } from "@/features/employees/types/employee.types";

const REPORTS_TO_ROLE: Record<EmployeeRoleName, EmployeeRoleName | null> = {
  Admin: null,
  "Sales Head": null,
  RSM: "Sales Head",
  TSO: "RSM",
  SR: "TSO",
};

export function getAllowedManagerRole(roleName: EmployeeRoleName) {
  return REPORTS_TO_ROLE[roleName];
}
