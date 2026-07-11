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
import {
  AnnouncementTicker,
  QuickResourceLinks,
} from "@/features/employee-resources/components";
import { formatAppDate } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const dashboard = await DashboardService.getAdminDashboardData();
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
