import {
  CompactMetricGrid,
  DashboardHeader,
  QuickActionGrid,
  RecentActivity,
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

export const dynamic = "force-dynamic";

const EMPTY_CELEBRATIONS = {
  birthdays: [],
  workAnniversaries: [],
};

export default async function AdminDashboardPage() {
  const [dashboard, celebrations] = await Promise.all([
    DashboardService.getAdminDashboardData(),
    CelebrationService.getAdminDashboardCelebrations().catch((error) => {
      console.error(
        "[AdminDashboardPage] Unable to load company celebrations.",
        error,
      );

      return EMPTY_CELEBRATIONS;
    }),
  ]);
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

      <AnnouncementTicker announcements={dashboard.liveAnnouncements} />
      <AdminCelebrationOverview celebrations={celebrations} />

      <QuickResourceLinks categories={dashboard.quickResourceCategories} />

      <CompactMetricGrid title="Company Snapshot" items={companySnapshot} />
      <CompactMetricGrid
        title="Pending Work"
        items={pendingItems}
        variant="pending"
      />
      <QuickActionGrid />

      <RecentActivity items={dashboard.recentActivity} />
    </section>
  );
}
