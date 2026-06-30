import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveEmployeeAuthIdentity } from "@/features/auth/services/auth.service";
import type { RegistrationInput } from "@/features/auth/types/auth.types";

export async function registerExistingEmployee(input: RegistrationInput) {
  const employee = await resolveEmployeeAuthIdentity(input.employeeId);

  if (employee.status !== "active") {
    throw new Error("Employee account is not active.");
  }

  if (employee.authUserId) {
    throw new Error("Employee account is already registered.");
  }

  if (!employee.internalAuthEmail) {
    throw new Error("Employee account is missing an internal auth email.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: employee.internalAuthEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      employee_id: employee.employeeId,
      employee_record_id: employee.id,
      company_id: employee.companyId,
    },
  });

  if (error || !data.user) {
    throw new Error("Unable to create authentication account.");
  }

  const { error: updateError } = await supabase
    .from("employees")
    .update({ auth_user_id: data.user.id })
    .eq("id", employee.id);

  if (updateError) {
    throw new Error("Unable to link authentication account to employee.");
  }

  return {
    employeeId: employee.employeeId,
    authUserId: data.user.id,
  };
}
