"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileNavigationV2 } from "@/components/common/mobile-navigation-v2";
import type { AuthSessionProfile } from "@/features/auth/types/auth.types";
import { PermissionOnboarding } from "@/features/device-onboarding/components/permission-onboarding";
import type {
  NotificationSummary,
  RealtimeNotificationScope,
} from "@/features/notifications/types/notification.types";
import { OfflineStatusIndicator } from "@/features/offline/components/offline-status-indicator";
import { OfflineSyncProvider } from "@/features/offline/components/offline-sync-provider";
import { PwaInstallCard } from "@/features/pwa/components/pwa-install-card";
import type { SchemaVersionStatus } from "@/features/schema-version/services/schema-version.service";
import { adminNavigationItems } from "@/lib/navigation/admin-navigation";
import type { FeatureKey } from "@/features/platform-control/types/platform.types";
import {
  CompanyBrandingProvider,
  type CompanyBranding,
} from "@/features/company-settings/components/company-branding-provider";
import { getPublicStorageUrl } from "@/lib/media";

type AdminShellProps = {
  children: ReactNode;
  profile: AuthSessionProfile;
  notificationSummary: NotificationSummary;
  notificationScope: RealtimeNotificationScope;
  onboardingVersion: number;
  requireCameraOnboarding: boolean;
  schemaStatus: SchemaVersionStatus;
  enabledFeatures: FeatureKey[];
  branding: CompanyBranding;
};

export function AdminShell({
  children,
  profile,
  notificationSummary,
  notificationScope,
  onboardingVersion,
  requireCameraOnboarding,
  schemaStatus,
  enabledFeatures,
  branding,
}: AdminShellProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const enabledFeatureSet = new Set(enabledFeatures);
  const navigationItems = adminNavigationItems.filter(
    (item) =>
      (!item.featureKey || enabledFeatureSet.has(item.featureKey)) &&
      (!item.featureKeys ||
        item.featureKeys.some((featureKey) =>
          enabledFeatureSet.has(featureKey),
        )),
  );
  const shouldShowSchemaBanner =
    schemaStatus.state === "pending" ||
    (schemaStatus.state === "unknown" && process.env.NODE_ENV !== "production");
  return (
    <CompanyBrandingProvider
      branding={{
        ...branding,
        logo:
          getPublicStorageUrl("company-assets", branding.logo) ?? branding.logo,
        favicon:
          getPublicStorageUrl("company-assets", branding.favicon) ??
          branding.favicon,
      }}
    >
      <div className="app-shell min-h-svh overflow-x-hidden">
        <div className="flex min-h-svh max-w-full">
          <AdminSidebar
            pathname={pathname}
            isCollapsed={isSidebarCollapsed}
            onCollapsedChange={setIsSidebarCollapsed}
            items={navigationItems}
          />
          <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
            <AdminHeader
              profile={profile}
              notificationSummary={notificationSummary}
              notificationScope={notificationScope}
              pathname={pathname}
              notificationsEnabled={enabledFeatureSet.has("notifications")}
            />
            <main className="flex-1 overflow-x-hidden px-4 pt-4 pb-28 sm:px-6 lg:px-8">
              <div className="min-w-0 space-y-5">
                {shouldShowSchemaBanner ? (
                  <section className="app-card border-amber-300/70 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/35 dark:text-amber-100">
                    <p className="font-semibold">
                      {schemaStatus.message ?? "Database schema is outdated."}
                    </p>
                    {schemaStatus.pendingMigrations.length > 0 ? (
                      <p className="mt-1 text-amber-900 dark:text-amber-200">
                        Pending migrations:{" "}
                        {schemaStatus.pendingMigrations.join(", ")}
                      </p>
                    ) : null}
                  </section>
                ) : null}
                <div className="app-page">{children}</div>
              </div>
            </main>
          </div>
        </div>
        <MobileNavigationV2
          role="company_admin"
          enabledFeatures={enabledFeatures}
          updatesBadge={
            enabledFeatureSet.has("notifications")
              ? notificationSummary.unreadCount
              : 0
          }
        />
        <PermissionOnboarding
          companyId={profile.companyId}
          version={onboardingVersion}
          requireCamera={requireCameraOnboarding}
        />
        <OfflineSyncProvider />
        <OfflineStatusIndicator />
        <PwaInstallCard
          companyId={profile.companyId}
          onboardingVersion={onboardingVersion}
        />
      </div>
    </CompanyBrandingProvider>
  );
}
