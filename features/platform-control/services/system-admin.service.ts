import "server-only";

import { getCurrentAuthUser } from "@/features/auth/services/auth.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SystemAdminContext = {
  id: string;
  authUserId: string;
  displayName: string;
};

export async function getCurrentSystemAdmin(): Promise<SystemAdminContext | null> {
  const user = await getCurrentAuthUser();

  if (!user) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("platform_admins")
    .select("id, auth_user_id, display_name, status")
    .eq("auth_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error(
      "[SystemAdminService] Unable to resolve System Admin.",
      error,
    );
    return null;
  }

  return data
    ? {
        id: data.id,
        authUserId: data.auth_user_id,
        displayName: data.display_name,
      }
    : null;
}

export async function requireSystemAdmin() {
  const admin = await getCurrentSystemAdmin();

  if (!admin) {
    throw new Error("System Admin access is required.");
  }

  return admin;
}
