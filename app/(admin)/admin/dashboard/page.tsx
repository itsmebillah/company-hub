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
  FileClock,
  FolderKanban,
  Megaphone,
  Users,
  UserX,
} from "lucide-react";

export const dynamic = "force-dynamic";

const quickActions = [
  {
    title: "Create Employee",
    description: "Open employee management and add a new team member.",
    href: "/admin/users/new",
    icon: Users,
  },
  {
    title: "Create Announcement",
    description: "Publish a new company-wide update from announcements.",
    href: "/admin/announcements",
    icon: Megaphone,
  },
  {
    title: "Create Resource",
    description: "Add a new approved resource, link, or internal tool.",
    href: "/admin/resources",
    icon: FolderKanban,
  },
  {
    title: "Approve Leave",
    description: "Review pending leave requests that need action.",
    href: "/admin/leave/requests",
    icon: FileClock,
  },
  {
    title: "Manage Attendance",
    description: "Open today's attendance workspace and policies.",
    href: "/admin/attendance",
    icon: CalendarClock,
  },
];

export default async function AdminDashboardPage() {
  const dashboard = await DashboardService.getAdminDashboardData();
  const currentDate = formatAppDate(new Date());
  const companySnapshot = [
    {
      title: "Present Today",
      value: dashboard.counts.presentToday,
      description: "Employees who successfully checked in.",
      icon: CheckCircle2,
      tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    {
      title: "On Leave",
      value: dashboard.counts.employeesOnLeaveToday,
      description: "Approved leave records covering today.",
      icon: CalendarClock,
      tone: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300",
    },
    {
      title: "Absent",
      value: dashboard.counts.absentToday,
      description: "Active employees still missing a check-in today.",
      icon: UserX,
      tone: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300",
    },
    {
      title: "Late",
      value: dashboard.counts.lateToday,
      description: "Attendance records marked late after validation.",
      icon: CalendarClock,
      tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300",
    },
    {
      title: "Pending Approvals",
      value: dashboard.counts.pendingLeaveRequests,
      description: "Leave requests currently waiting for admin review.",
      icon: FileClock,
      tone: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300",
    },
    {
      title: "Unread Notifications",
      value: dashboard.counts.unreadNotifications,
      description: "Notifications that still need attention.",
      icon: Bell,
      tone: "text-slate-700 bg-slate-100 dark:bg-slate-900/70 dark:text-slate-300",
    },
  ];

  return (
    <section className="mx-auto max-w-screen-2xl space-y-7 overflow-x-hidden">
      <DashboardHeader
        companyName={dashboard.companyName}
        companyLogo={dashboard.companyLogo}
        userName={dashboard.loggedInUserName}
        employeeId={dashboard.loggedInUserEmployeeId}
        roleName={dashboard.loggedInUserRoleName}
        photoUrl={dashboard.loggedInUserPhotoUrl}
        currentDate={currentDate}
      />

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-6">
          <section className="space-y-4">
            <div>
              <p className="app-page-eyebrow">Shared Feed</p>
              <h2 className="text-base font-semibold">Live Company Feed</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Reusing the employee announcement and resource experience so admins
                can watch the same live communication surface employees see.
              </p>
            </div>
            <AnnouncementTicker announcements={dashboard.liveAnnouncements} />
            <QuickResourceLinks categories={dashboard.quickResourceCategories} />
          </section>

          <section className="space-y-4">
            <div>
              <p className="app-page-eyebrow">Operational Summary</p>
              <h2 className="text-base font-semibold">Company Snapshot</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Today&apos;s operational summary across attendance, leave, and notifications.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {companySnapshot.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="app-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">{item.title}</p>
                        <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                      </div>
                      <span
                        className={`flex size-11 items-center justify-center rounded-xl ${item.tone}`}
                      >
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <RecentActivity items={dashboard.recentActivity} />
        </div>

        <aside className="space-y-6">
          <section className="app-card p-5">
            <div>
              <p className="app-page-eyebrow">Workspace Context</p>
              <h2 className="text-base font-semibold">Admin Overview</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Quick context for company management and navigation.
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ["Company", dashboard.companyName],
                ["Employee ID", dashboard.loggedInUserEmployeeId],
                ["Date", currentDate],
                ["Total Modules", String(dashboard.totalModules)],
                ["System Status", dashboard.overallSystemStatus],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-background/75 px-4 py-3"
                >
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="break-words text-right text-sm font-medium capitalize">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="app-page-eyebrow">Navigation Shortcuts</p>
              <h2 className="text-base font-semibold">Quick Actions</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Jump into the most common admin workflows without leaving the dashboard.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
              {quickActions.map((action) => (
                <QuickActionCard key={action.href} {...action} />
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
