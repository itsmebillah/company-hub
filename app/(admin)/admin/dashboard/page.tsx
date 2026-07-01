import {
  Activity,
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
  RecentActivity,
  SummaryPanel,
  SystemStatus,
} from "@/features/admin-dashboard/components";
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

const kpis = [
  {
    title: "Employees",
    value: "0",
    trend: "Ready for employee data",
    icon: Users,
    tone: "blue" as const,
  },
  {
    title: "Resources",
    value: "0",
    trend: "Catalog prepared",
    icon: FolderKanban,
    tone: "green" as const,
  },
  {
    title: "Announcements",
    value: "0",
    trend: "Publishing queue clear",
    icon: Bell,
    tone: "amber" as const,
  },
  {
    title: "Active Users",
    value: "0",
    trend: "Session metrics pending",
    icon: Activity,
    tone: "violet" as const,
  },
];

const systemStatus = [
  {
    label: "Database",
    description: "Supabase schema foundation",
    status: "configured" as const,
    icon: Database,
  },
  {
    label: "Authentication",
    description: "Employee ID sign-in flow",
    status: "configured" as const,
    icon: ShieldCheck,
  },
  {
    label: "Storage",
    description: "Ready for media assets",
    status: "ready" as const,
    icon: UploadCloud,
  },
  {
    label: "API",
    description: "Application routes available",
    status: "ready" as const,
    icon: Server,
  },
];

export default function AdminDashboardPage() {
  return (
    <section className="mx-auto max-w-screen-2xl space-y-6">
      <DashboardHeader
        companyName="Company Hub"
        userName="Admin"
        currentDate={currentDate}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-base font-semibold">Key Metrics</h2>
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
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
            <RecentActivity />
            <SystemStatus items={systemStatus} />
          </div>
        </div>

        <SummaryPanel currentDate={currentDate} version={appConfig.version} />
      </div>
    </section>
  );
}
