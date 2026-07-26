import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getAuthEmailForEmployee,
} from "@/features/auth/services/auth.service";
import type { PasswordResetInput } from "@/features/auth/types/auth.types";
import { toSupabaseEmployeePassword } from "@/features/auth/utils/employee-password";
import { requireCompanyAdmin } from "@/features/auth/services/authorization.service";

export async function resetCompanyEmployeePasswordToInitial(
  employeeRowId: string,
  confirmation: string,
) {
  const actor = await requireCompanyAdmin("employee_directory");
  const supabase = createSupabaseAdminClient();
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id, employee_id, auth_user_id, status")
    .eq("id", employeeRowId)
    .eq("company_id", actor.companyId)
    .maybeSingle();

  if (employeeError || !employee?.auth_user_id) {
    throw new Error("Employee account is not available for password reset.");
  }

  if (confirmation.trim() !== employee.employee_id) {
    throw new Error("Type the exact Employee ID to confirm the reset.");
  }

  const { error } = await supabase.auth.admin.updateUserById(
    employee.auth_user_id,
    { password: toSupabaseEmployeePassword(employee.employee_id) },
  );

  if (error) {
    throw new Error("Unable to reset employee password.");
  }

}

export async function requestPasswordReset(input: PasswordResetInput) {
  const email = await getAuthEmailForEmployee(input.employeeId);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: input.redirectTo,
    },
  });

  if (error) {
    throw new Error("Unable to start password reset.");
  }

  return data;
}
