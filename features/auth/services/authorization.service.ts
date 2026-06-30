import "server-only";

import { getCurrentSessionProfile } from "@/features/auth/services/session.service";

export async function requireRole(allowedRoles: readonly string[]) {
  const profile = await getCurrentSessionProfile();

  if (!profile || profile.status !== "active") {
    return null;
  }

  if (!allowedRoles.includes(profile.roleName)) {
    return null;
  }

  return profile;
}

export async function isAdmin() {
  const profile = await requireRole(["Admin"]);

  return Boolean(profile);
}
