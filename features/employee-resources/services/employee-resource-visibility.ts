export type EmployeeResourcePermission = {
  resource_id: string;
  permission_type: "public" | "role" | "employee";
  role_id: string | null;
  employee_id: string | null;
};

export function isAllowedResource(
  resourceId: string,
  permissions: EmployeeResourcePermission[],
  employee: { id: string; role_id: string },
) {
  return permissions.some((permission) => {
    if (permission.resource_id !== resourceId) return false;
    if (permission.permission_type === "public") return true;
    if (permission.permission_type === "role") {
      return permission.role_id === employee.role_id;
    }
    return permission.employee_id === employee.id;
  });
}
