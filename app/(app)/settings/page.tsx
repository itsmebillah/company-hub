import { redirect } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { getAdminEquivalentPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { getCompanySettings } from "@/features/company-settings/services/company-settings.service";
import { PwaInstallSettingsCard } from "@/features/pwa/components/pwa-install-settings-card";
import { ROLE_NAMES } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [sessionProfile, companySettings] = await Promise.all([
    getCurrentSessionProfile(),
    getCompanySettings(),
  ]);

  if (
    sessionProfile?.status === "active" &&
    sessionProfile.roleName === ROLE_NAMES.admin
  ) {
    redirect(getAdminEquivalentPath("/settings"));
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Workspace Preferences"
        title="Settings"
        description="This area is prepared for employee-facing preferences and personal workspace controls."
      />
      <div className="app-card p-6">
        <p className="text-sm leading-6 text-muted-foreground">
          Personal settings are intentionally staged here so the employee
          workspace keeps a consistent structure while broader preference
          controls continue to evolve.
        </p>
      </div>
      {sessionProfile?.companyId ? (
        <PwaInstallSettingsCard
          companyId={sessionProfile.companyId}
          onboardingVersion={
            companySettings.securityPreferences.permissionOnboardingVersion
          }
        />
      ) : null}
    </section>
  );
}
