import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthEmailForEmployee } from "@/features/auth/services/auth.service";
import type { PasswordResetInput } from "@/features/auth/types/auth.types";

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
