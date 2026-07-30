import "server-only";

import { getAllowedManagerRole } from "@/features/employees/constants/employee-rules";
import { requireCurrentCompanyId } from "@/features/auth/services/current-company-context.service";
import type { EmployeeRoleName } from "@/features/employees/types/employee.types";
import type {
  BulkReassignInput,
  ChangeManagerInput,
  HierarchyEmployee,
} from "@/features/hierarchy/types/hierarchy.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function getCompanyId() {
  return requireCurrentCompanyId();
}

export async function getHierarchyEmployees(): Promise<HierarchyEmployee[]> {
  const supabase = createSupabaseAdminClient();
  const companyId = await getCompanyId();
  const [rolesResult, employeesResult] = await Promise.all([
    supabase
      .from("roles")
      .select("id, name, display_order")
      .eq("company_id", companyId)
      .order("display_order", { ascending: true }),
    supabase
      .from("employees")
      .select("id, employee_id, name, role_id, manager_id, status")
      .eq("company_id", companyId)
      .order("name", { ascending: true }),
  ]);

  if (rolesResult.error || employeesResult.error) {
    throw new Error("Unable to load hierarchy.");
  }

  const roleById = new Map(
    rolesResult.data.map((role) => [role.id, role.name as EmployeeRoleName]),
  );

  return employeesResult.data.map((employee) => ({
    id: employee.id,
    employeeId: employee.employee_id,
    name: employee.name,
    roleId: employee.role_id,
    roleName: roleById.get(employee.role_id) ?? "SR",
    managerId: employee.manager_id,
    status: employee.status,
  }));
}

function wouldCreateCircularHierarchy(
  employeeId: string,
  managerId: string,
  employees: HierarchyEmployee[],
) {
  const employeeById = new Map(
    employees.map((employee) => [employee.id, employee]),
  );
  let current = employeeById.get(managerId);

  while (current) {
    if (current.id === employeeId) {
      return true;
    }

    current = current.managerId
      ? employeeById.get(current.managerId)
      : undefined;
  }

  return false;
}

export async function validateManagerChange(input: ChangeManagerInput) {
  const employees = await getHierarchyEmployees();
  const employee = employees.find((item) => item.id === input.employeeId);

  if (!employee) {
    throw new Error("Employee was not found.");
  }

  const requiredManagerRole = getAllowedManagerRole(employee.roleName);

  if (requiredManagerRole === null) {
    if (input.managerId) {
      throw new Error(`${employee.roleName} cannot have a manager.`);
    }

    return { employee, manager: null };
  }

  if (requiredManagerRole && !input.managerId) {
    throw new Error(
      `${employee.roleName} must report to ${requiredManagerRole}.`,
    );
  }

  if (!input.managerId) {
    return { employee, manager: null };
  }

  if (input.employeeId === input.managerId) {
    throw new Error("Employee cannot report to themselves.");
  }

  const manager = employees.find((item) => item.id === input.managerId);

  if (!manager) {
    throw new Error("Manager was not found.");
  }

  if (requiredManagerRole && manager.roleName !== requiredManagerRole) {
    throw new Error(
      `${employee.roleName} must report to ${requiredManagerRole}.`,
    );
  }

  if (
    wouldCreateCircularHierarchy(input.employeeId, input.managerId, employees)
  ) {
    throw new Error("Circular hierarchy is not allowed.");
  }

  return { employee, manager };
}

export async function changeEmployeeManager(input: ChangeManagerInput) {
  await validateManagerChange(input);

  const supabase = createSupabaseAdminClient();
  const companyId = await getCompanyId();
  const { error } = await supabase
    .from("employees")
    .update({ manager_id: input.managerId || null })
    .eq("id", input.employeeId)
    .eq("company_id", companyId);

  if (error) {
    throw new Error("Unable to update manager.");
  }
}

export async function bulkReassignEmployees(input: BulkReassignInput) {
  const employees = await getHierarchyEmployees();
  const selectedEmployees = employees.filter((employee) =>
    input.employeeIds.includes(employee.id),
  );

  if (selectedEmployees.length === 0) {
    throw new Error("Select at least one employee.");
  }

  if (
    selectedEmployees.some(
      (employee) => !["TSO", "SR"].includes(employee.roleName),
    )
  ) {
    throw new Error("Bulk reassign supports TSO and SR employees only.");
  }

  for (const employee of selectedEmployees) {
    await validateManagerChange({
      employeeId: employee.id,
      managerId: input.managerId,
    });
  }

  const supabase = createSupabaseAdminClient();
  const companyId = await getCompanyId();
  const { error } = await supabase
    .from("employees")
    .update({ manager_id: input.managerId })
    .in("id", input.employeeIds)
    .eq("company_id", companyId);

  if (error) {
    throw new Error("Unable to bulk reassign employees.");
  }
}
