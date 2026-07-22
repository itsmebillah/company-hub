import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getAuthEmailForEmployee,
  resolveEmployeeAuthIdentity,
} from "@/features/auth/services/auth.service";
import type { PasswordResetInput } from "@/features/auth/types/auth.types";
import { toSupabaseEmployeePassword } from "@/features/auth/utils/employee-password";
import { PlatformAuditService } from "@/features/platform-control/services/platform-audit.service";

export async function resetEmployeePasswordToInitial(employeeId: string) {
  const employee = await resolveEmployeeAuthIdentity(employeeId);

  if (employee.status !== "active" || !employee.authUserId) {
    throw new Error("Employee account is not available for password reset.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(
    employee.authUserId,
    { password: toSupabaseEmployeePassword(employee.employeeId) },
  );

  if (error) {
    throw new Error("Unable to reset employee password.");
  }

  await PlatformAuditService.log({
    category: "security",
    action: "password_reset",
    entityType: "employee",
    entityId: employee.id,
    description: "An administrator reset an employee password.",
    companyId: employee.companyId,
  });
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
