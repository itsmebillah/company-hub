"use server";

import { redirect } from "next/navigation";

import {
  getLogoutRedirectPath,
  logout,
} from "@/features/auth/services/logout.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { PlatformAuditService } from "@/features/platform-control/services/platform-audit.service";

export async function logoutAction() {
  const profile = await getCurrentSessionProfile();
  await PlatformAuditService.log({
    category: "login",
    action: "logout_succeeded",
    entityType: "auth_session",
    description: "User signed out.",
    companyId: profile?.companyId,
    platformAdminId: profile?.platformAdminId,
  });
  await logout();
  redirect(getLogoutRedirectPath());
}
