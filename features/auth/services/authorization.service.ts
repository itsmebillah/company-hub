import "server-only";

import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";
import { PlatformAuditService } from "@/features/platform-control/services/platform-audit.service";
import type { FeatureKey } from "@/features/platform-control/types/platform.types";
import { ROLE_NAMES } from "@/lib/auth/permissions";

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

export async function isCompanyAdmin() {
  const profile = await requireRole([ROLE_NAMES.companyAdmin]);

  return Boolean(profile);
}

export async function requireCompanyAdmin(featureKey?: FeatureKey) {
  const profile = await requireRole([ROLE_NAMES.companyAdmin]);

  if (!profile) {
    await PlatformAuditService.log({
      category: "security",
      action: "permission_denied",
      entityType: "authorization",
      status: "denied",
      description: "Company Admin permission was denied.",
    });
    throw new Error("Company Admin access is required.");
  }

  if (featureKey) {
    await FeatureAccessService.requireForCurrentCompany(featureKey);
  }

  return profile;
}
