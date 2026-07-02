import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentAuthUser } from "@/features/auth/services/auth.service";
import type { AuthSessionProfile } from "@/features/auth/types/auth.types";

export async function getCurrentSessionProfile(): Promise<AuthSessionProfile | null> {
  const user = await getCurrentAuthUser();

  if (!user) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data: employee, error } = await supabase
    .from("employees")
    .select("employee_id, name, company_id, role_id, status")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !employee) {
    return null;
  }

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("name")
    .eq("company_id", employee.company_id)
    .eq("id", employee.role_id)
    .eq("status", "active")
    .maybeSingle();

  if (roleError || !role) {
    return null;
  }

  return {
    employeeId: employee.employee_id,
    name: employee.name,
    companyId: employee.company_id,
    roleId: employee.role_id,
    roleName: role.name,
    status: employee.status,
  };
}

export async function hasActiveSession() {
  const profile = await getCurrentSessionProfile();

  return profile?.status === "active";
}
