import {
  Bell,
  Database,
  FolderKanban,
  Megaphone,
  ShieldCheck,
  Settings,
  Server,
  UploadCloud,
  Users,
} from "lucide-react";

import {
  DashboardHeader,
  KPICard,
  QuickActionCard,
  RecentAnnouncements,
  RecentEmployees,
  RecentResources,
  SummaryPanel,
  SystemStatus,
} from "@/features/admin-dashboard/components";
import { DashboardService } from "@/features/admin-dashboard/services/dashboard.service";
import { appConfig } from "@/lib/config/app";

export const dynamic = "force-dynamic";

const currentDate = new Intl.DateTimeFormat("en", {
  dateStyle: "full",
}).format(new Date());

const quickActions = [
  {
    title: "Manage Employees",
    description: "Review employee records, roles, and reporting structure.",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Manage Resources",
    description: "Organize links, documents, and internal tools.",
    href: "/admin/resources",
    icon: FolderKanban,
  },
  {
    title: "Announcements",
    description: "Publish company updates for employee visibility.",
    href: "/admin/announcements",
    icon: Megaphone,
  },
  {
    title: "Company Settings",
    description: "Maintain company profile and platform preferences.",
    href: "/admin/company",
    icon: Settings,
  },
];

export default async function AdminDashboardPage() {
  const dashboard = await DashboardService.getAdminDashboardData();
  const kpis = [
    {
      title: "Employees",
      value: String(dashboard.counts.employees),
      trend: `${dashboard.counts.activeEmployees} active employees`,
      icon: Users,
      tone: "blue" as const,
    },
    {
      title: "Active Employees",
      value: String(dashboard.counts.activeEmployees),
      trend: "Currently active records",
      icon: Users,
      tone: "green" as const,
    },
    {
      title: "Inactive Employees",
      value: String(dashboard.counts.inactiveEmployees),
      trend: `${dashboard.counts.archivedEmployees} archived employees`,
      icon: Users,
      tone: "amber" as const,
    },
    {
      title: "Resources",
      value: String(dashboard.counts.resources),
      trend: "Available resource links",
      icon: FolderKanban,
      tone: "violet" as const,
    },
    {
      title: "Categories",
      value: String(dashboard.counts.categories),
      trend: "Resource groups",
      icon: FolderKanban,
      tone: "blue" as const,
    },
    {
      title: "Announcements",
      value: String(dashboard.counts.announcements),
      trend: "Published and archived records",
      icon: Bell,
      tone: "amber" as const,
    },
  ];
  const systemStatus = [
    {
      label: "Authentication",
      description: "Supabase Auth service",
      status: dashboard.health.authentication,
      icon: ShieldCheck,
    },
    {
      label: "Database",
      description: "Supabase PostgreSQL",
      status: dashboard.health.database,
      icon: Database,
    },
    {
      label: "Storage",
      description: "Asset storage readiness",
      status: dashboard.health.storage,
      icon: UploadCloud,
    },
    {
      label: "Environment",
      description: appConfig.environment,
      status: dashboard.health.environment,
      icon: Server,
    },
  ];

  return (
    <section className="mx-auto max-w-screen-2xl space-y-6">
      <DashboardHeader
        companyName={dashboard.companyName}
        companyLogo={dashboard.companyLogo}
        userName={dashboard.loggedInUserName}
        currentDate={currentDate}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-base font-semibold">Key Metrics</h2>
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {kpis.map((kpi) => (
                <KPICard key={kpi.title} {...kpi} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {quickActions.map((action) => (
                <QuickActionCard key={action.href} {...action} />
              ))}
            </div>
          </section>

          <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
            <RecentEmployees employees={dashboard.recentEmployees} />
            <SystemStatus items={systemStatus} />
          </div>

          <div className="grid gap-4 2xl:grid-cols-2">
            <RecentAnnouncements
              announcements={dashboard.recentAnnouncements}
            />
            <RecentResources resources={dashboard.recentResources} />
          </div>
        </div>

        <SummaryPanel
          currentDate={currentDate}
          version={appConfig.version}
          activeEmployees={dashboard.counts.activeEmployees}
          inactiveEmployees={dashboard.counts.inactiveEmployees}
          archivedEmployees={dashboard.counts.archivedEmployees}
          announcements={dashboard.counts.announcements}
        />
      </div>
    </section>
  );
}
