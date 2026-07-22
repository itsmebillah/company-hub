import "server-only";

import { logActivity } from "@/features/activity/utils/activity-log";
import { requireCurrentCompanyId } from "@/features/auth/services/current-company-context.service";
import { toSupabaseEmployeePassword } from "@/features/auth/utils/employee-password";
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
  EmployeeWorkMode,
} from "@/features/employees/types/employee.types";

const INTERNAL_AUTH_EMAIL_DOMAIN = "companyhub.local";
const DEFAULT_PAGE_SIZE = 10;

const emptyEmployeeListResult = (
  filters: EmployeeListFilters,
): EmployeeListResult => {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.max(filters.pageSize ?? DEFAULT_PAGE_SIZE, 1);

  return {
    employees: [],
    total: 0,
    page,
    pageSize,
    totalPages: 1,
  };
};

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

function assertWorkMode(workMode: string): asserts workMode is EmployeeWorkMode {
  if (!["office", "field", "hybrid"].includes(workMode)) {
    throw new Error("Invalid employee work mode.");
  }
}

function isAuthEmailConflict(message: string | undefined) {
  return Boolean(
    message?.toLowerCase().includes("already") ||
      message?.toLowerCase().includes("registered"),
  );
}

function logEmployeeServiceError(context: string, error: unknown) {
  console.error(`[EmployeeService] ${context}`, error);
}

async function getActiveCompanyId() {
  try {
    return await requireCurrentCompanyId();
  } catch (error) {
    logEmployeeServiceError("Unable to load current company.", error);
    return null;
  }
}

async function requireActiveCompanyId() {
  const companyId = await getActiveCompanyId();

  if (!companyId) {
    throw new Error("Company was not found.");
  }

  return companyId;
}

export async function getEmployeeRoles(): Promise<EmployeeRoleOption[]> {
  const supabase = createSupabaseAdminClient();
  const companyId = await getActiveCompanyId();

  if (!companyId) {
    return [];
  }

  const { data, error } = await supabase
    .from("roles")
    .select("id, name, display_order")
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("display_order", { ascending: true });

  if (error) {
    logEmployeeServiceError("Unable to load roles.", error);
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
  const companyId = await getActiveCompanyId();

  if (!companyId) {
    return [];
  }

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
    logEmployeeServiceError(
      "Unable to load reporting managers.",
      employeesResult.error,
    );
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
  const companyId = await getActiveCompanyId();

  if (!companyId) {
    return emptyEmployeeListResult(filters);
  }

  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.max(filters.pageSize ?? DEFAULT_PAGE_SIZE, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = filters.search?.trim();

  let query = supabase
    .from("employees")
    .select(
      "id, employee_id, name, phone, email, photo_url, date_of_birth, role_id, manager_id, work_mode, status, joining_date",
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

  if (filters.workMode && filters.workMode !== "all") {
    query = query.eq("work_mode", filters.workMode);
  }

  const sort = filters.sort ?? "newest";

  if (sort === "employee_id") {
    query = query.order("employee_id", { ascending: true });
  } else if (sort === "name") {
    query = query.order("name", { ascending: true });
  } else if (sort === "work_mode") {
    query = query.order("work_mode", { ascending: true }).order("name", {
      ascending: true,
    });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    logEmployeeServiceError("Unable to load employees.", error);
    throw new Error("Unable to load employees.");
  }

  const [roles, managers] = await Promise.all([
    getEmployeeRoles(),
    getEmployeeManagerOptions(),
  ]);
  const employeeIds = data.map((employee) => employee.id);
  const directReportCountById = new Map(employeeIds.map((id) => [id, 0]));

  if (employeeIds.length > 0) {
    const { data: directReports, error: directReportsError } = await supabase
      .from("employees")
      .select("manager_id")
      .eq("company_id", companyId)
      .in("manager_id", employeeIds);

    if (directReportsError) {
      logEmployeeServiceError(
        "Unable to load employee reporting summary.",
        directReportsError,
      );
      throw new Error("Unable to load employee reporting summary.");
    }

    directReports.forEach((directReport) => {
      if (!directReport.manager_id) {
        return;
      }

      directReportCountById.set(
        directReport.manager_id,
        (directReportCountById.get(directReport.manager_id) ?? 0) + 1,
      );
    });
  }

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
      photoUrl: employee.photo_url,
      dateOfBirth: employee.date_of_birth,
      roleId: employee.role_id,
      roleName: roleById.get(employee.role_id) ?? "Unknown",
      managerId: employee.manager_id,
      managerName: employee.manager_id
        ? managerById.get(employee.manager_id)?.name ?? null
        : null,
      workMode: employee.work_mode,
      directReportsCount: directReportCountById.get(employee.id) ?? 0,
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
  const companyId = await requireCurrentCompanyId();
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, employee_id, name, phone, email, photo_url, date_of_birth, joining_date, company_id, role_id, manager_id, work_mode, status, created_at, updated_at",
    )
    .eq("id", id)
    .eq("company_id", companyId)
    .single();

  if (error || !data) {
    return null;
  }

  const [roles, managers] = await Promise.all([
    getEmployeeRoles(),
    getEmployeeManagerOptions(),
  ]);
  const { count: directReportsCount, error: directReportsError } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("manager_id", id)
    .eq("company_id", companyId);

  if (directReportsError) {
    logEmployeeServiceError(
      "Unable to load employee reporting summary.",
      directReportsError,
    );
    throw new Error("Unable to load employee reporting summary.");
  }

  const roleById = new Map(roles.map((role) => [role.id, role.name]));
  const managerById = new Map(managers.map((manager) => [manager.id, manager]));

  return {
    id: data.id,
    employeeId: data.employee_id,
    name: data.name,
    phone: data.phone,
    email: data.email,
    photoUrl: data.photo_url,
    roleName: roleById.get(data.role_id) ?? "Unknown",
    managerName: data.manager_id
      ? managerById.get(data.manager_id)?.name ?? null
      : null,
    directReportsCount: directReportsCount ?? 0,
    status: data.status,
    joiningDate: data.joining_date,
    dateOfBirth: data.date_of_birth,
    companyId: data.company_id,
    roleId: data.role_id,
    managerId: data.manager_id,
    workMode: data.work_mode,
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
  assertWorkMode(values.workMode);

  const allowedManagerRole = getAllowedManagerRole(role.name);
  const managerOptions = await getEmployeeManagerOptions();

  if (currentId && values.managerId === currentId) {
    throw new Error("Employee cannot report to themselves.");
  }

  if (allowedManagerRole === null && values.managerId) {
    throw new Error(`${role.name} cannot report to another employee.`);
  }

  if (allowedManagerRole && !values.managerId) {
    throw new Error(`${role.name} must report to ${allowedManagerRole}.`);
  }

  if (allowedManagerRole && values.managerId) {
    const manager = managerOptions.find((item) => item.id === values.managerId);

    if (!manager || manager.roleName !== allowedManagerRole) {
      throw new Error(`${role.name} must report to ${allowedManagerRole}.`);
    }
  }

  if (allowedManagerRole === undefined && values.managerId) {
    const manager = managerOptions.find((item) => item.id === values.managerId);

    if (!manager) {
      throw new Error("Reporting manager is invalid.");
    }
  }

  const supabase = createSupabaseAdminClient();
  const normalizedEmployeeId = values.employeeId.trim().toUpperCase();
  const duplicateQuery = supabase
    .from("employees")
    .select("id")
    .ilike("employee_id", normalizedEmployeeId)
    .limit(1);

  const { data: duplicates, error } = currentId
    ? await duplicateQuery.neq("id", currentId)
    : await duplicateQuery;

  if (error) {
    logEmployeeServiceError("Unable to validate Employee ID.", error);
    throw new Error("Unable to validate Employee ID.");
  }

  if (duplicates.length > 0) {
    throw new Error("Employee ID already exists.");
  }
}

export async function createEmployee(values: EmployeeFormValues) {
  await validateEmployeeInput(values);

  const supabase = createSupabaseAdminClient();
  const companyId = await requireActiveCompanyId();
  const employeeId = values.employeeId.trim().toUpperCase();
  const internalAuthEmail = generateInternalAuthEmail(employeeId);
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email: internalAuthEmail,
      password: toSupabaseEmployeePassword(employeeId),
      email_confirm: true,
      user_metadata: {
        employee_id: employeeId,
        company_id: companyId,
      },
    });

  if (authError || !authUser.user) {
    if (isAuthEmailConflict(authError?.message)) {
      throw new Error("Employee ID already exists.");
    }

    throw new Error("Unable to create employee login.");
  }

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
      work_mode: values.workMode,
      auth_user_id: authUser.user.id,
      internal_auth_email: internalAuthEmail,
      status: values.status,
    })
    .select("id")
    .single();

  if (error || !data) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw new Error("Unable to create employee.");
  }

  await logActivity({
    companyId,
    module: "employee",
    action: "created",
    entityType: "employees",
    entityId: data.id,
    description: `Created employee ${employeeId}`,
    metadata: {
      employeeId,
      roleId: values.roleId,
      status: values.status,
    },
  });

  return {
    id: data.id,
    employeeId,
  };
}

export async function updateEmployee(id: string, values: EmployeeFormValues) {
  const supabase = createSupabaseAdminClient();
  const companyId = await requireCurrentCompanyId();
  const { data: existingEmployee, error: existingEmployeeError } = await supabase
    .from("employees")
    .select("employee_id, company_id")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();

  if (existingEmployeeError || !existingEmployee) {
    throw new Error("Employee was not found.");
  }

  await validateEmployeeInput(
    {
      ...values,
      employeeId: existingEmployee.employee_id,
    },
    id,
  );

  const { error } = await supabase
    .from("employees")
    .update({
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: normalizeOptional(values.email),
      date_of_birth: values.dateOfBirth,
      joining_date: values.joiningDate,
      role_id: values.roleId,
      manager_id: normalizeOptional(values.managerId),
      work_mode: values.workMode,
      status: values.status,
    })
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) {
    throw new Error("Unable to update employee.");
  }

  await logActivity({
    companyId,
    module: "employee",
    action: "updated",
    entityType: "employees",
    entityId: id,
    description: `Updated employee ${existingEmployee.employee_id}`,
    metadata: {
      employeeId: existingEmployee.employee_id,
      roleId: values.roleId,
      status: values.status,
    },
  });
}

export async function setEmployeeStatus(id: string, status: Extract<EmployeeStatus, "active" | "inactive">) {
  const supabase = createSupabaseAdminClient();
  const companyId = await requireCurrentCompanyId();
  const { error } = await supabase
    .from("employees")
    .update({ status })
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) {
    throw new Error("Unable to update employee status.");
  }
}
