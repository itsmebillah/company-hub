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
    .select("employee_id, name, photo_url, company_id, role_id, status")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !employee) {
    if (error) {
      console.error("[SessionService] Unable to resolve employee session.", {
        code: error.code,
      });
    }
    return null;
  }

  const [
    { data: role, error: roleError },
    { data: platformAdmin, error: platformAdminError },
  ] = await Promise.all([
    supabase
      .from("roles")
      .select("name")
      .eq("company_id", employee.company_id)
      .eq("id", employee.role_id)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("platform_admins")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (roleError || !role) {
    if (roleError) {
      console.error("[SessionService] Unable to resolve employee role.", {
        code: roleError.code,
      });
    }
    return null;
  }

  if (platformAdminError) {
    console.error("[SessionService] Unable to resolve System Admin status.", {
      code: platformAdminError.code,
    });
  }

  return {
    employeeId: employee.employee_id,
    name: employee.name,
    photoUrl: employee.photo_url ?? null,
    companyId: employee.company_id,
    roleId: employee.role_id,
    roleName: role.name,
    status: employee.status,
    isSystemAdmin: Boolean(platformAdmin),
    platformAdminId: platformAdmin?.id ?? null,
  };
}

export async function hasActiveSession() {
  const profile = await getCurrentSessionProfile();

  return profile?.status === "active";
}
