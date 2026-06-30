import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAllowedManagerRole } from "@/features/employees/constants/employee-rules";
import type {
  EmployeeDetails,
  EmployeeFormValues,
  EmployeeListFilters,
  EmployeeListItem,
  EmployeeListResult,
  EmployeeManagerOption,
  EmployeeRoleName,
  EmployeeRoleOption,
  EmployeeStatus,
} from "@/features/employees/types/employee.types";

const COMPANY_NAME = "Company Hub";
const INTERNAL_AUTH_EMAIL_DOMAIN = "companyhub.local";
const DEFAULT_PAGE_SIZE = 10;

function generateInternalAuthEmail(employeeId: string) {
  return `${employeeId.trim().toUpperCase()}@${INTERNAL_AUTH_EMAIL_DOMAIN}`;
}

function normalizeOptional(value: string) {
  const nextValue = value.trim();

  return nextValue.length > 0 ? nextValue : null;
}

function isPhoneValid(phone: string) {
  return /^\+?[0-9\s-]{7,20}$/.test(phone.trim());
}

function assertStatus(status: string): asserts status is EmployeeStatus {
  if (!["active", "inactive", "archived"].includes(status)) {
    throw new Error("Invalid employee status.");
  }
}

async function getCompanyId() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("name", COMPANY_NAME)
    .single();

  if (error || !data) {
    throw new Error("Company was not found.");
  }

  return data.id;
}

export async function getEmployeeRoles(): Promise<EmployeeRoleOption[]> {
  const supabase = createSupabaseAdminClient();
  const companyId = await getCompanyId();
  const { data, error } = await supabase
    .from("roles")
    .select("id, name, display_order")
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error("Unable to load roles.");
  }

  return data.map((role) => ({
    id: role.id,
    name: role.name as EmployeeRoleName,
    displayOrder: role.display_order,
  }));
}

export async function getEmployeeManagerOptions(): Promise<EmployeeManagerOption[]> {
  const supabase = createSupabaseAdminClient();
  const companyId = await getCompanyId();
  const [roles, employeesResult] = await Promise.all([
    getEmployeeRoles(),
    supabase
      .from("employees")
      .select("id, employee_id, name, role_id")
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("name", { ascending: true }),
  ]);

  if (employeesResult.error) {
    throw new Error("Unable to load reporting managers.");
  }

  const roleById = new Map(roles.map((role) => [role.id, role]));

  return employeesResult.data.flatMap((employee) => {
    const role = roleById.get(employee.role_id);

    if (!role) {
      return [];
    }

    return {
      id: employee.id,
      employeeId: employee.employee_id,
      name: employee.name,
      roleId: employee.role_id,
      roleName: role.name,
    };
  });
}

export async function listEmployees(
  filters: EmployeeListFilters,
): Promise<EmployeeListResult> {
  const supabase = createSupabaseAdminClient();
  const companyId = await getCompanyId();
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.max(filters.pageSize ?? DEFAULT_PAGE_SIZE, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = filters.search?.trim();

  let query = supabase
    .from("employees")
    .select(
      "id, employee_id, name, phone, email, date_of_birth, role_id, manager_id, status, joining_date",
      { count: "exact" },
    )
    .eq("company_id", companyId);

  if (search) {
    query = query.or(
      `employee_id.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.roleId) {
    query = query.eq("role_id", filters.roleId);
  }

  if (filters.managerId) {
    query = query.eq("manager_id", filters.managerId);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error("Unable to load employees.");
  }

  const [roles, managers] = await Promise.all([
    getEmployeeRoles(),
    getEmployeeManagerOptions(),
  ]);
  const roleById = new Map(roles.map((role) => [role.id, role.name]));
  const managerById = new Map(managers.map((manager) => [manager.id, manager]));
  const total = count ?? 0;

  return {
    employees: data.map((employee): EmployeeListItem => ({
      id: employee.id,
      employeeId: employee.employee_id,
      name: employee.name,
      phone: employee.phone,
      email: employee.email,
      dateOfBirth: employee.date_of_birth,
      roleId: employee.role_id,
      roleName: roleById.get(employee.role_id) ?? "Unknown",
      managerId: employee.manager_id,
      managerName: employee.manager_id
        ? managerById.get(employee.manager_id)?.name ?? null
        : null,
      status: employee.status,
      joiningDate: employee.joining_date,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function getEmployeeDetails(id: string): Promise<EmployeeDetails | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, employee_id, name, phone, email, date_of_birth, joining_date, company_id, role_id, manager_id, status, created_at, updated_at",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const [roles, managers] = await Promise.all([
    getEmployeeRoles(),
    getEmployeeManagerOptions(),
  ]);
  const roleById = new Map(roles.map((role) => [role.id, role.name]));
  const managerById = new Map(managers.map((manager) => [manager.id, manager]));

  return {
    id: data.id,
    employeeId: data.employee_id,
    name: data.name,
    phone: data.phone,
    email: data.email,
    roleName: roleById.get(data.role_id) ?? "Unknown",
    managerName: data.manager_id
      ? managerById.get(data.manager_id)?.name ?? null
      : null,
    status: data.status,
    joiningDate: data.joining_date,
    dateOfBirth: data.date_of_birth,
    companyId: data.company_id,
    roleId: data.role_id,
    managerId: data.manager_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

async function validateEmployeeInput(values: EmployeeFormValues, currentId?: string) {
  const roles = await getEmployeeRoles();
  const role = roles.find((item) => item.id === values.roleId);

  if (!values.employeeId.trim()) {
    throw new Error("Employee ID is required.");
  }

  if (!values.name.trim()) {
    throw new Error("Full name is required.");
  }

  if (!values.phone.trim()) {
    throw new Error("Phone is required.");
  }

  if (!isPhoneValid(values.phone)) {
    throw new Error("Phone number is invalid.");
  }

  if (!values.dateOfBirth) {
    throw new Error("Date of birth is required.");
  }

  if (!values.joiningDate) {
    throw new Error("Joining date is required.");
  }

  if (!role) {
    throw new Error("Role is required.");
  }

  assertStatus(values.status);

  const allowedManagerRole = getAllowedManagerRole(role.name);

  if (!allowedManagerRole && values.managerId) {
    throw new Error(`${role.name} cannot report to another employee.`);
  }

  if (allowedManagerRole && !values.managerId) {
    throw new Error(`${role.name} must report to ${allowedManagerRole}.`);
  }

  if (allowedManagerRole && values.managerId) {
    const manager = (await getEmployeeManagerOptions()).find(
      (item) => item.id === values.managerId,
    );

    if (!manager || manager.roleName !== allowedManagerRole) {
      throw new Error(`${role.name} must report to ${allowedManagerRole}.`);
    }
  }

  const supabase = createSupabaseAdminClient();
  const normalizedEmployeeId = values.employeeId.trim().toUpperCase();
  const duplicateQuery = supabase
    .from("employees")
    .select("id")
    .eq("employee_id", normalizedEmployeeId)
    .limit(1);

  const { data: duplicates, error } = currentId
    ? await duplicateQuery.neq("id", currentId)
    : await duplicateQuery;

  if (error) {
    throw new Error("Unable to validate Employee ID.");
  }

  if (duplicates.length > 0) {
    throw new Error("Employee ID already exists.");
  }
}

export async function createEmployee(values: EmployeeFormValues) {
  await validateEmployeeInput(values);

  const supabase = createSupabaseAdminClient();
  const companyId = await getCompanyId();
  const employeeId = values.employeeId.trim().toUpperCase();
  const { data, error } = await supabase
    .from("employees")
    .insert({
      employee_id: employeeId,
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: normalizeOptional(values.email),
      date_of_birth: values.dateOfBirth,
      joining_date: values.joiningDate,
      company_id: companyId,
      role_id: values.roleId,
      manager_id: normalizeOptional(values.managerId),
      internal_auth_email: generateInternalAuthEmail(employeeId),
      status: values.status,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Unable to create employee.");
  }

  return data.id;
}

export async function updateEmployee(id: string, values: EmployeeFormValues) {
  await validateEmployeeInput(values, id);

  const supabase = createSupabaseAdminClient();
  const employeeId = values.employeeId.trim().toUpperCase();
  const { error } = await supabase
    .from("employees")
    .update({
      employee_id: employeeId,
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: normalizeOptional(values.email),
      date_of_birth: values.dateOfBirth,
      joining_date: values.joiningDate,
      role_id: values.roleId,
      manager_id: normalizeOptional(values.managerId),
      internal_auth_email: generateInternalAuthEmail(employeeId),
      status: values.status,
    })
    .eq("id", id);

  if (error) {
    throw new Error("Unable to update employee.");
  }
}

export async function setEmployeeStatus(id: string, status: Extract<EmployeeStatus, "active" | "inactive">) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("employees").update({ status }).eq("id", id);

  if (error) {
    throw new Error("Unable to update employee status.");
  }
}
