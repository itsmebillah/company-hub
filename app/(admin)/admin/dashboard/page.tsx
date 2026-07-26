import {
  CompactMetricGrid,
  DashboardHeader,
  QuickActionGrid,
} from "@/features/admin-dashboard/components";
import {
  getCompanySnapshotItems,
  getPendingWorkItems,
} from "@/features/admin-dashboard/constants/mobile-dashboard-config";
import { DashboardService } from "@/features/admin-dashboard/services/dashboard.service";
import { AdminCelebrationOverview } from "@/features/celebrations/components";
import { CelebrationService } from "@/features/celebrations/services/celebration.service";
import {
  AnnouncementTicker,
  QuickResourceLinks,
} from "@/features/employee-resources/components";
import { formatAppDate } from "@/lib/datetime";
import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";

export const dynamic = "force-dynamic";

const EMPTY_CELEBRATIONS = {
  birthdays: [],
  workAnniversaries: [],
};

export default async function AdminDashboardPage() {
  const [dashboard, celebrations, features] = await Promise.all([
    DashboardService.getAdminDashboardData(),
    CelebrationService.getAdminDashboardCelebrations().catch((error) => {
      console.error(
        "[AdminDashboardPage] Unable to load company celebrations.",
        error,
      );

      return EMPTY_CELEBRATIONS;
    }),
    FeatureAccessService.getCurrentCompanyStates(),
  ]);
  const enabledFeatures = new Set(
    features
      .filter((feature) => feature.effectiveState === "enabled")
      .map((feature) => feature.key),
  );
  const currentDate = formatAppDate(new Date());
  const companySnapshot = getCompanySnapshotItems(dashboard.counts);
  const pendingItems = getPendingWorkItems(dashboard.counts);

  return (
    <section className="mx-auto max-w-screen-2xl space-y-4 overflow-x-hidden pb-4 sm:space-y-5">
      <DashboardHeader
        companyName={dashboard.companyName}
        companyLogo={dashboard.companyLogo}
        userName={dashboard.loggedInUserName}
        employeeId={dashboard.loggedInUserEmployeeId}
        roleName={dashboard.loggedInUserRoleName}
        photoUrl={dashboard.loggedInUserPhotoUrl}
        currentDate={currentDate}
      />

      {enabledFeatures.has("announcements") ? (
        <AnnouncementTicker announcements={dashboard.liveAnnouncements} />
      ) : null}
      {enabledFeatures.has("calendar") ? (
        <AdminCelebrationOverview celebrations={celebrations} />
      ) : null}

      {enabledFeatures.has("quick_links") ? (
        <QuickResourceLinks categories={dashboard.quickResourceCategories} />
      ) : null}

      {enabledFeatures.has("attendance") ||
      enabledFeatures.has("leave") ||
      enabledFeatures.has("notifications") ? (
        <CompactMetricGrid
          title="Company Snapshot"
          items={companySnapshot.filter((item) =>
            item.title === "Alerts"
              ? enabledFeatures.has("notifications")
              : item.title === "Leave" || item.title === "Pending"
                ? enabledFeatures.has("leave")
                : enabledFeatures.has("attendance"),
          )}
        />
      ) : null}
      {enabledFeatures.has("attendance") ||
      enabledFeatures.has("leave") ||
      enabledFeatures.has("notifications") ? (
        <CompactMetricGrid
          title="Pending Work"
          items={pendingItems.filter((item) =>
            item.title.includes("Leave")
              ? enabledFeatures.has("leave")
              : item.title.includes("Notification")
                ? enabledFeatures.has("notifications")
                : enabledFeatures.has("attendance"),
          )}
          variant="pending"
        />
      ) : null}
      <QuickActionGrid enabledFeatures={enabledFeatures} />
    </section>
  );
}
