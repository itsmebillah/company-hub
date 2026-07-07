import "server-only";

import { getCurrentAuthUser } from "@/features/auth/services/auth.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CurrentEmployeeContext = {
  id: string;
  employeeId: string;
  name: string;
  companyId: string;
  roleId: string;
  status: "active" | "inactive" | "archived";
};

export async function getCurrentEmployeeContext(): Promise<CurrentEmployeeContext | null> {
  const user = await getCurrentAuthUser();

  if (!user) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_id, name, company_id, role_id, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[CurrentEmployeeContext] Unable to load employee.", error);
    throw new Error("Unable to load employee context.");
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    employeeId: data.employee_id,
    name: data.name,
    companyId: data.company_id,
    roleId: data.role_id,
    status: data.status,
  };
}

export async function requireCurrentEmployeeContext() {
  const employee = await getCurrentEmployeeContext();

  if (!employee || employee.status !== "active") {
    throw new Error("Active employee context was not found.");
  }

  return employee;
}

export async function requireCurrentCompanyId() {
  return (await requireCurrentEmployeeContext()).companyId;
}
