import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EmployeeAuthIdentity } from "@/features/auth/types/auth.types";

const EMPLOYEE_AUTH_COLUMNS =
  "id, employee_id, auth_user_id, internal_auth_email, status, company_id, role_id";

export async function resolveEmployeeAuthIdentity(
  employeeId: string,
): Promise<EmployeeAuthIdentity> {
  const supabase = createSupabaseAdminClient();
  const normalizedEmployeeId = employeeId.trim();

  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_AUTH_COLUMNS)
    .ilike("employee_id", normalizedEmployeeId)
    .single();

  if (error || !data) {
    throw new Error("Employee account was not found.");
  }

  return {
    id: data.id,
    employeeId: data.employee_id,
    authUserId: data.auth_user_id,
    internalAuthEmail: data.internal_auth_email,
    status: data.status,
    companyId: data.company_id,
    roleId: data.role_id,
  };
}

export async function getAuthEmailForEmployee(employeeId: string) {
  const employee = await resolveEmployeeAuthIdentity(employeeId);

  if (employee.status !== "active") {
    throw new Error("Employee account is not active.");
  }

  if (!employee.authUserId) {
    throw new Error("Employee account is not linked to authentication.");
  }

  if (!employee.internalAuthEmail) {
    throw new Error("Authentication account could not be resolved.");
  }

  return employee.internalAuthEmail;
}

export async function getCurrentAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}
