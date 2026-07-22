import type { ReactNode } from "react";

import { AppFooter } from "@/components/common/app-footer";
import { AppHeader } from "@/components/common/app-header";
import { MobileBottomNav } from "@/components/common/mobile-bottom-nav";
import { PageContainer } from "@/components/common/page-container";
import { AttendanceSettingsService } from "@/features/attendance/services/attendance-settings.service";
import { CurrentEmployeeContextService } from "@/features/auth/services/current-employee-context.service";
import { getCompanySettings } from "@/features/company-settings/services/company-settings.service";
import { PermissionOnboarding } from "@/features/device-onboarding/components/permission-onboarding";
import { NotificationService } from "@/features/notifications/services/notification.service";
import { OfflineStatusIndicator } from "@/features/offline/components/offline-status-indicator";
import { OfflineSyncProvider } from "@/features/offline/components/offline-sync-provider";
import { PwaInstallCard } from "@/features/pwa/components/pwa-install-card";
import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";

type AppLayoutProps = {
  children: ReactNode;
};

export async function AppLayout({ children }: AppLayoutProps) {
  const [
    notificationSummary,
    employeeContext,
    attendanceSettings,
    companySettings,
    features,
  ] = await Promise.all([
    NotificationService.getCurrentUserSummary(),
    CurrentEmployeeContextService.getCurrentEmployeeContext(),
    AttendanceSettingsService.getSettings(),
    getCompanySettings(),
    FeatureAccessService.getCurrentCompanyStates(),
  ]);
  const enabledFeatures = new Set(
    features
      .filter((feature) => feature.effectiveState === "enabled")
      .map((feature) => feature.key),
  );
  const enabledFeatureKeys = [...enabledFeatures];
  const notificationScope =
    employeeContext?.status === "active"
      ? {
          type: "employee" as const,
          employeeId: employeeContext.id,
          companyId: employeeContext.companyId,
        }
      : undefined;

  return (
    <div className="app-shell flex min-h-svh flex-col">
      <AppHeader
        showProfile
        notificationSummary={notificationSummary}
        notificationScope={notificationScope}
        enabledFeatures={enabledFeatureKeys}
      />
      <PageContainer className="flex-1 py-5 pb-28 sm:py-6 md:pb-8 lg:py-8">
        <main className="app-page">{children}</main>
      </PageContainer>
      <AppFooter />
      <MobileBottomNav enabledFeatures={enabledFeatureKeys} />
      <OfflineSyncProvider />
      <OfflineStatusIndicator />
      {employeeContext?.companyId ? (
        <>
          <PermissionOnboarding
            companyId={employeeContext.companyId}
            version={
              companySettings.securityPreferences.permissionOnboardingVersion
            }
            requireCamera={
              enabledFeatures.has("attendance") && attendanceSettings.requireSelfie
            }
          />
          <PwaInstallCard
            companyId={employeeContext.companyId}
            onboardingVersion={
              companySettings.securityPreferences.permissionOnboardingVersion
            }
          />
        </>
      ) : null}
    </div>
  );
}
