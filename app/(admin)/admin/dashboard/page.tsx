import {
  DashboardHeader,
  QuickActionCard,
  RecentActivity,
} from "@/features/admin-dashboard/components";
import { DashboardService } from "@/features/admin-dashboard/services/dashboard.service";
import {
  AnnouncementTicker,
  QuickResourceLinks,
} from "@/features/employee-resources/components";
import { formatAppDate } from "@/lib/datetime";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileBarChart,
  FileClock,
  FileSpreadsheet,
  FolderPlus,
  Megaphone,
  Settings,
  Users,
  UsersRound,
  UserX,
  Building2,
} from "lucide-react";

export const dynamic = "force-dynamic";

const quickActions = [
  {
    title: "Create Employee",
    href: "/admin/users/new",
    icon: Users,
    tone: "blue" as const,
  },
  {
    title: "Create Notice",
    href: "/admin/announcements",
    icon: Megaphone,
    tone: "orange" as const,
  },
  {
    title: "Create Resource",
    href: "/admin/resources",
    icon: FolderPlus,
    tone: "green" as const,
  },
  {
    title: "Manage Roles",
    href: "/admin/roles",
    icon: UsersRound,
    tone: "purple" as const,
  },
  {
    title: "Company",
    href: "/admin/company",
    icon: Building2,
    tone: "slate" as const,
  },
  {
    title: "Reports",
    href: "/admin/attendance/reports",
    icon: FileBarChart,
    tone: "red" as const,
  },
  {
    title: "Import",
    href: "/admin/users/import",
    icon: FileSpreadsheet,
    tone: "green" as const,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    tone: "slate" as const,
  },
];

export default async function AdminDashboardPage() {
  const dashboard = await DashboardService.getAdminDashboardData();
  const currentDate = formatAppDate(new Date());
  const companySnapshot = [
    {
      title: "Present",
      value: dashboard.counts.presentToday,
      icon: CheckCircle2,
      tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    {
      title: "Absent",
      value: dashboard.counts.absentToday,
      icon: UserX,
      tone: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300",
    },
    {
      title: "Leave",
      value: dashboard.counts.employeesOnLeaveToday,
      icon: CalendarClock,
      tone: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300",
    },
    {
      title: "Late",
      value: dashboard.counts.lateToday,
      icon: CalendarClock,
      tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300",
    },
    {
      title: "Pending",
      value: dashboard.counts.pendingLeaveRequests,
      icon: FileClock,
      tone: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300",
    },
    {
      title: "Alerts",
      value: dashboard.counts.unreadNotifications,
      icon: Bell,
      tone: "text-slate-700 bg-slate-100 dark:bg-slate-900/70 dark:text-slate-300",
    },
  ];
  const pendingItems = [
    {
      title: "Pending Leave",
      value: dashboard.counts.pendingLeaveRequests,
      icon: FileClock,
      tone: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    },
    {
      title: "Attendance Gaps",
      value: dashboard.counts.absentToday,
      icon: ClipboardCheck,
      tone: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    },
    {
      title: "Unread Notifications",
      value: dashboard.counts.unreadNotifications,
      icon: Bell,
      tone: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    },
  ];

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

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold sm:text-base">
          Company Snapshot
        </h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {companySnapshot.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex min-h-[5.4rem] items-center gap-2.5 rounded-[1.25rem] border bg-card/95 p-3 shadow-[var(--shadow-soft)]"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-muted-foreground">
                    {item.title}
                  </p>
                  <p className="text-xl font-semibold leading-tight">
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold sm:text-base">Pending Work</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {pendingItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex min-h-[4.3rem] items-center justify-between gap-3 rounded-[1.25rem] border bg-card/95 px-3 py-2.5 shadow-[var(--shadow-soft)]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}
                  >
                    <Icon className="size-[1.125rem]" aria-hidden="true" />
                  </span>
                  <p className="line-clamp-2 text-sm font-medium leading-4">
                    {item.title}
                  </p>
                </div>
                <span className="shrink-0 text-xl font-semibold">
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold sm:text-base">
          Admin Actions
        </h2>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 xl:grid-cols-8">
          {quickActions.map((action) => (
            <QuickActionCard key={action.href} {...action} />
          ))}
        </div>
      </section>

      <RecentActivity items={dashboard.recentActivity} />
    </section>
  );
}
