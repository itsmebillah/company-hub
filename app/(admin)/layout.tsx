import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin";
import { AttendanceSettingsService } from "@/features/attendance/services/attendance-settings.service";
import { getPostLoginRedirectPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { getCompanySettings } from "@/features/company-settings/services/company-settings.service";
import { NotificationService } from "@/features/notifications/services/notification.service";
import { SchemaVersionService } from "@/features/schema-version/services/schema-version.service";
import { ROLE_NAMES } from "@/lib/auth/permissions";
import { PlatformAuditService } from "@/features/platform-control/services/platform-audit.service";
import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";

export default async function AdminRouteGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const profile = await getCurrentSessionProfile();

  if (!profile || profile.status !== "active") {
    redirect("/login");
  }

  if (profile.roleName !== ROLE_NAMES.companyAdmin) {
    await PlatformAuditService.log({
      category: "security",
      action: "permission_denied",
      entityType: "admin_route",
      status: "denied",
      description:
        "A non-Company Admin user attempted to access a Company Admin route.",
      companyId: profile.companyId,
    });
    redirect(getPostLoginRedirectPath(profile.roleName));
  }

  const [
    notificationSummary,
    schemaStatus,
    attendanceSettings,
    companySettings,
    features,
  ] = await Promise.all([
    NotificationService.getCurrentAdminSummary(),
    SchemaVersionService.getStatus(),
    AttendanceSettingsService.getSettings(),
    getCompanySettings(),
    FeatureAccessService.getCurrentCompanyStates(),
  ]);
  const enabledFeatures = new Set(
    features
      .filter((feature) => feature.effectiveState === "enabled")
      .map((feature) => feature.key),
  );

  return (
    <AdminShell
      profile={profile}
      notificationSummary={notificationSummary}
      notificationScope={{
        type: "company",
        companyId: profile.companyId,
      }}
      onboardingVersion={
        companySettings.securityPreferences.permissionOnboardingVersion
      }
      requireCameraOnboarding={attendanceSettings.requireSelfie}
      schemaStatus={schemaStatus}
      enabledFeatures={[...enabledFeatures]}
      branding={{
        companyName: companySettings.companyName,
        shortName: companySettings.shortName,
        logo: companySettings.logo,
        favicon: companySettings.favicon,
        primaryColor: companySettings.primaryColor,
        secondaryColor: companySettings.secondaryColor,
        theme: companySettings.theme,
      }}
    >
      {children}
    </AdminShell>
  );
}
