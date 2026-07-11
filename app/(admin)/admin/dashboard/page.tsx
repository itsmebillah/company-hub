import {
  AreaChart,
  BarChart,
  DashboardHeader,
  ExecutiveOverview,
  KPICard,
  LineChart,
  PieChart,
  QuickActionCard,
  RecentActivity,
  SystemStatus,
} from "@/features/admin-dashboard/components";
import { AnnouncementTicker, QuickResourceLinks } from "@/features/employee-resources/components";
import { DashboardService } from "@/features/admin-dashboard/services/dashboard.service";
import { appConfig } from "@/lib/config/app";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Database,
  FileClock,
  FolderKanban,
  Megaphone,
  Server,
  UploadCloud,
  UserCheck,
  UserMinus,
  UserX,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

const quickActions = [
  {
    title: "Create Employee",
    description: "Open the employee workspace and add a new company user.",
    href: "/admin/users/new",
    icon: Users,
  },
  {
    title: "Create Announcement",
    description: "Publish a new company-wide update from the announcements module.",
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
    description: "Review and process pending leave requests from the queue.",
    href: "/admin/leave/requests",
    icon: FileClock,
  },
  {
    title: "Manage Attendance",
    description: "Open attendance operations for today's workforce activity.",
    href: "/admin/attendance",
    icon: CalendarClock,
  },
] as const;

export default async function AdminDashboardPage() {
  const dashboard = await DashboardService.getAdminDashboardData();
  const currentDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
  }).format(new Date());
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
      trend: "Ready for current company operations",
      icon: UserCheck,
      tone: "green" as const,
    },
    {
      title: "Inactive Employees",
      value: String(dashboard.counts.inactiveEmployees),
      trend: "Employee records currently inactive",
      icon: UserMinus,
      tone: "amber" as const,
    },
    {
      title: "Today's Attendance",
      value: String(dashboard.counts.todaysAttendance),
      trend: "Attendance records created today",
      icon: CalendarClock,
      tone: "blue" as const,
    },
    {
      title: "Present",
      value: String(dashboard.counts.presentToday),
      trend: "Checked in on time",
      icon: CheckCircle2,
      tone: "green" as const,
    },
    {
      title: "Late",
      value: String(dashboard.counts.lateToday),
      trend: "Employees with late arrival status",
      icon: CalendarClock,
      tone: "amber" as const,
    },
    {
      title: "Absent",
      value: String(dashboard.counts.absentToday),
      trend: "Active employees without a check-in",
      icon: UserX,
      tone: "violet" as const,
    },
    {
      title: "Pending Leave Requests",
      value: String(dashboard.counts.pendingLeaveRequests),
      trend: "Requests awaiting a decision",
      icon: FileClock,
      tone: "amber" as const,
    },
    {
      title: "Approved Leave",
      value: String(dashboard.counts.approvedLeaveRequests),
      trend: "Approved leave requests on record",
      icon: CheckCircle2,
      tone: "green" as const,
    },
    {
      title: "Rejected Leave",
      value: String(dashboard.counts.rejectedLeaveRequests),
      trend: "Rejected leave requests on record",
      icon: UserX,
      tone: "violet" as const,
    },
    {
      title: "Active Resources",
      value: String(dashboard.counts.activeResources),
      trend: "Approved resources currently active",
      icon: FolderKanban,
      tone: "blue" as const,
    },
    {
      title: "Active Announcements",
      value: String(dashboard.counts.activeAnnouncements),
      trend: "Announcement records marked active",
      icon: Megaphone,
      tone: "amber" as const,
    },
    {
      title: "Unread Notifications",
      value: String(dashboard.counts.unreadNotifications),
      trend: "Unread company notifications",
      icon: Bell,
      tone: "violet" as const,
    },
  ];
  const systemStatus = [
    {
      label: "Authentication",
      description: "Supabase Auth session health",
      status: dashboard.health.authentication,
      icon: UserCheck,
    },
    {
      label: "Database",
      description: "Supabase PostgreSQL availability",
      status: dashboard.health.database,
      icon: Database,
    },
    {
      label: "Storage",
      description: "Storage readiness requires live runtime verification",
      status: dashboard.health.storage,
      icon: UploadCloud,
    },
    {
      label: "Environment",
      description: appConfig.environment ?? "unknown",
      status: dashboard.health.environment,
      icon: Server,
    },
  ];

  return (
    <section className="mx-auto max-w-screen-2xl space-y-6 overflow-x-hidden">
      <DashboardHeader
        companyName={dashboard.companyName}
        companyLogo={dashboard.companyLogo}
        userName={dashboard.loggedInUserName}
        currentDate={currentDate}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-base font-semibold">Executive KPI</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {kpis.map((kpi) => (
                <KPICard key={kpi.title} {...kpi} />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold">Live Employee View</h2>
            <AnnouncementTicker announcements={dashboard.liveAnnouncements} />
            <QuickResourceLinks categories={dashboard.quickResourceCategories} />
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">Company Snapshot</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Active Announcements</p>
                <p className="mt-2 text-2xl font-semibold">
                  {dashboard.counts.activeAnnouncements}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Active Resources</p>
                <p className="mt-2 text-2xl font-semibold">
                  {dashboard.counts.activeResources}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Unread Notifications</p>
                <p className="mt-2 text-2xl font-semibold">
                  {dashboard.counts.unreadNotifications}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Today&apos;s Attendance</p>
                <p className="mt-2 text-2xl font-semibold">
                  {dashboard.counts.todaysAttendance}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <p className="mt-2 text-2xl font-semibold">
                  {dashboard.counts.pendingLeaveRequests}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Recent Activity</p>
                <p className="mt-2 text-2xl font-semibold">
                  {dashboard.recentActivity.length}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {quickActions.map((action) => (
                <QuickActionCard key={action.href} {...action} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">Analytics</h2>
            <div className="grid gap-4 2xl:grid-cols-2">
              <LineChart
                title="Attendance Trend"
                description="Daily attendance record volume for the last seven days."
                data={dashboard.charts.attendanceTrend}
              />
              <AreaChart
                title="Operational Activity"
                description="Recent changes captured across employees, attendance, leave, resources, and announcements."
                data={dashboard.charts.activityTrend}
              />
              <BarChart
                title="Leave Breakdown"
                description="Current leave request status totals from the leave module."
                data={dashboard.charts.leaveStatusBreakdown}
              />
              <PieChart
                title="Employee Status Mix"
                description="Current distribution of employee records by status."
                data={dashboard.charts.employeeStatusDistribution}
              />
            </div>
          </section>

          <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
            <RecentActivity items={dashboard.recentActivity} />
            <SystemStatus items={systemStatus} />
          </div>
        </div>

        <div className="space-y-4">
          <ExecutiveOverview
            companyName={dashboard.companyName}
            companyLogo={dashboard.companyLogo}
            currentDate={currentDate}
            totalModules={dashboard.totalModules}
            systemStatus={dashboard.overallSystemStatus}
          />
        </div>
      </div>
    </section>
  );
}
