import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AUTH_REDIRECTS } from "@/features/auth/constants/auth-redirects";

export async function logout() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("Unable to log out.");
  }
}

export function getLogoutRedirectPath() {
  return AUTH_REDIRECTS.afterLogout;
}
