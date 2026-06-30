import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthEmailForEmployee } from "@/features/auth/services/auth.service";
import type { LoginCredentials } from "@/features/auth/types/auth.types";

export async function loginWithEmployeeId(credentials: LoginCredentials) {
  const email = await getAuthEmailForEmployee(credentials.employeeId);
  const supabase = await createSupabaseServerClient({
    rememberSession: credentials.rememberMe,
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: credentials.password,
  });

  if (error) {
    throw new Error("Invalid employee ID or password.");
  }

  return data;
}
