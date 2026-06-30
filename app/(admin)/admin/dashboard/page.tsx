import {
  Bell,
  Building2,
  FolderKanban,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";

import {
  ActivityCard,
  DashboardHeader,
  QuickActionCard,
  StatCard,
  SystemStatusCard,
} from "@/features/admin-dashboard/components";

const currentDate = new Intl.DateTimeFormat("en", {
  dateStyle: "full",
}).format(new Date());

const quickActions = [
  {
    title: "Manage Employees",
    description: "Open employee records and management tools.",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Manage Resources",
    description: "Prepare company resource management.",
    href: "/admin/resources",
    icon: FolderKanban,
  },
  {
    title: "Announcements",
    description: "Prepare company announcement management.",
    href: "/admin/announcements",
    icon: Megaphone,
  },
  {
    title: "Company Settings",
    description: "Open company configuration area.",
    href: "/admin/settings",
    icon: Settings,
  },
];

const stats = [
  { title: "Employees", value: "--", icon: Users },
  { title: "Resources", value: "--", icon: FolderKanban },
  { title: "Announcements", value: "--", icon: Bell },
  { title: "Active Users", value: "--", icon: Building2 },
];

export default function AdminDashboardPage() {
  return (
    <section className="space-y-6">
      <DashboardHeader
        companyName="Company Hub"
        userName="Admin"
        currentDate={currentDate}
      />

      <div>
        <h2 className="mb-3 text-base font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <QuickActionCard key={action.href} {...action} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold">Statistics</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <ActivityCard />
        <SystemStatusCard />
      </div>
    </section>
  );
}
