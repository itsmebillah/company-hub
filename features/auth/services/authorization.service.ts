import "server-only";

import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { PlatformAuditService } from "@/features/platform-control/services/platform-audit.service";

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

export async function requireAdmin() {
  const profile = await requireRole(["Admin"]);

  if (!profile) {
    await PlatformAuditService.log({
      category: "security",
      action: "permission_denied",
      entityType: "authorization",
      status: "denied",
      description: "Administrator permission was denied.",
    });
    throw new Error("Administrator access is required.");
  }

  return profile;
}
