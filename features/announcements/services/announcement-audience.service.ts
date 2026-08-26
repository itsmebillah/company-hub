export function isAnnouncementVisibleToEmployee(
  targetAudience: "company" | "roles" | "employees" | string | null,
  audience: { roleIds: string[]; employeeIds: string[] },
  employee: { id: string; role_id: string },
) {
  if (targetAudience === "roles") {
    return audience.roleIds.includes(employee.role_id);
  }
  if (targetAudience === "employees") {
    return audience.employeeIds.includes(employee.id);
  }
  return targetAudience === "company" || !targetAudience;
}
