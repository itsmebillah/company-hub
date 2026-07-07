import "server-only";

import { unstable_cache } from "next/cache";

import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { getCompanySettings } from "@/features/company-settings/services/company-settings.service";
import { NotificationRepository } from "@/features/notifications/repositories/notification.repository";
import { AttendanceService } from "@/features/attendance/services/attendance.service";
import { getSupabaseAdminEnv, getSupabaseEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  DashboardChartPoint,
  DashboardData,
  DashboardPieSlice,
  DashboardRecentActivityItem,
  DashboardSystemStatus,
} from "@/features/admin-dashboard/types/dashboard.types";

const EXECUTIVE_MODULES = [
  "Employees",
  "Attendance",
  "Leave",
  "Resources",
  "Announcements",
  "Notifications",
  "Company Settings",
] as const;

const EMPLOYEE_STATUS_COLORS = {
  active: "#2563eb",
  inactive: "#f59e0b",
  archived: "#94a3b8",
} as const;

function getEnvironmentHealth(): DashboardSystemStatus {
  try {
    getSupabaseEnv();
    getSupabaseAdminEnv();
    return "healthy";
  } catch {
    return "error";
  }
}

function getOverallStatus(
  health: DashboardData["health"],
): DashboardSystemStatus {
  const statuses = Object.values(health);

  if (statuses.includes("error")) {
    return "error";
  }

  if (statuses.includes("warning")) {
    return "warning";
  }

  return "healthy";
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatActivityTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getRecentDateLabels(days: number) {
  const today = startOfDay(new Date());

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));

    return date.toISOString().slice(0, 10);
  });
}

function toActivityTitle(module: string, action: string) {
  const nextModule = module.replace(/_/g, " ");
  const nextAction = action.replace(/_/g, " ");

  return `${nextModule.charAt(0).toUpperCase()}${nextModule.slice(1)} ${nextAction}`;
}

function getEmptyDashboard(): DashboardData {
  const health = {
    authentication: "error" as const,
    database: "error" as const,
    storage: "warning" as const,
    environment: getEnvironmentHealth(),
  };

  return {
    companyName: "Company Hub",
    companyLogo: null,
    loggedInUserName: "Admin",
    totalModules: EXECUTIVE_MODULES.length,
    overallSystemStatus: getOverallStatus(health),
    counts: {
      employees: 0,
      activeEmployees: 0,
      inactiveEmployees: 0,
      todaysAttendance: 0,
      presentToday: 0,
      lateToday: 0,
      absentToday: 0,
      pendingLeaveRequests: 0,
      approvedLeaveRequests: 0,
      rejectedLeaveRequests: 0,
      activeResources: 0,
      activeAnnouncements: 0,
      unreadNotifications: 0,
    },
    charts: {
      attendanceTrend: [],
      leaveStatusBreakdown: [],
      employeeStatusDistribution: [
        { label: "Active", value: 0, color: EMPLOYEE_STATUS_COLORS.active },
        { label: "Inactive", value: 0, color: EMPLOYEE_STATUS_COLORS.inactive },
        { label: "Archived", value: 0, color: EMPLOYEE_STATUS_COLORS.archived },
      ],
      activityTrend: [],
    },
    recentActivity: [],
    health,
  };
}

async function getActiveCompanyId() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load company information.");
  }

  return data?.id ?? null;
}

const getCachedExecutiveSummary = unstable_cache(
  async (companyId: string) => {
    const supabase = createSupabaseAdminClient();
    const recentDates = getRecentDateLabels(7);
    const earliestDate = recentDates[0];
    const recentActivityStart = new Date(`${earliestDate}T00:00:00.000Z`).toISOString();

    const [
      employeeStatusesResult,
      resourceStatusesResult,
      announcementStatusesResult,
      leaveStatusesResult,
      attendanceTrendResult,
      recentActivityResult,
      activityTrendResult,
      adminNotifications,
      attendanceOverview,
    ] = await Promise.all([
      supabase.from("employees").select("status").eq("company_id", companyId),
      supabase.from("resources").select("status").eq("company_id", companyId),
      supabase.from("announcements").select("status").eq("company_id", companyId),
      supabase.from("leave_requests").select("status").eq("company_id", companyId),
      supabase
        .from("attendance_records")
        .select("attendance_date")
        .eq("company_id", companyId)
        .gte("attendance_date", earliestDate)
        .order("attendance_date", { ascending: true }),
      supabase
        .from("activity_logs")
        .select("id, module, action, description, created_at")
        .eq("company_id", companyId)
        .in("module", ["employee", "announcement", "resources", "leave", "attendance"])
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("activity_logs")
        .select("created_at")
        .eq("company_id", companyId)
        .in("module", ["employee", "announcement", "resources", "leave", "attendance"])
        .gte("created_at", recentActivityStart),
      NotificationRepository.countUnreadForCompany(companyId),
      AttendanceService.getAdminOverview(),
    ]);

    if (
      employeeStatusesResult.error ||
      resourceStatusesResult.error ||
      announcementStatusesResult.error ||
      leaveStatusesResult.error ||
      attendanceTrendResult.error ||
      recentActivityResult.error ||
      activityTrendResult.error
    ) {
      throw new Error("Unable to load executive dashboard data.");
    }

    const employeeCounts = {
      total: employeeStatusesResult.data.length,
      active: employeeStatusesResult.data.filter((item) => item.status === "active").length,
      inactive: employeeStatusesResult.data.filter((item) => item.status === "inactive").length,
      archived: employeeStatusesResult.data.filter((item) => item.status === "archived").length,
    };
    const leaveCounts = {
      pending: leaveStatusesResult.data.filter((item) => item.status === "pending").length,
      approved: leaveStatusesResult.data.filter((item) => item.status === "approved").length,
      rejected: leaveStatusesResult.data.filter((item) => item.status === "rejected").length,
    };
    const activeResources = resourceStatusesResult.data.filter(
      (item) => item.status === "active",
    ).length;
    const activeAnnouncements = announcementStatusesResult.data.filter(
      (item) => item.status === "active",
    ).length;

    const attendanceCountByDate = new Map(recentDates.map((label) => [label, 0]));
    attendanceTrendResult.data.forEach((record) => {
      attendanceCountByDate.set(
        record.attendance_date,
        (attendanceCountByDate.get(record.attendance_date) ?? 0) + 1,
      );
    });

    const activityCountByDate = new Map(recentDates.map((label) => [label, 0]));
    activityTrendResult.data.forEach((record) => {
      const date = record.created_at.slice(0, 10);
      activityCountByDate.set(date, (activityCountByDate.get(date) ?? 0) + 1);
    });

    const recentActivity: DashboardRecentActivityItem[] = recentActivityResult.data.map(
      (item) => ({
        id: item.id,
        title: toActivityTitle(item.module, item.action),
        description: item.description,
        time: formatActivityTime(item.created_at),
        module: item.module,
        action: item.action,
      }),
    );

    return {
      counts: {
        employees: employeeCounts.total,
        activeEmployees: employeeCounts.active,
        inactiveEmployees: employeeCounts.inactive,
        todaysAttendance: attendanceOverview.totalRecordsToday,
        presentToday: attendanceOverview.presentToday,
        lateToday: attendanceOverview.lateToday,
        absentToday: Math.max(employeeCounts.active - attendanceOverview.checkedInToday, 0),
        pendingLeaveRequests: leaveCounts.pending,
        approvedLeaveRequests: leaveCounts.approved,
        rejectedLeaveRequests: leaveCounts.rejected,
        activeResources,
        activeAnnouncements,
        unreadNotifications: adminNotifications,
      },
      charts: {
        attendanceTrend: recentDates.map(
          (date): DashboardChartPoint => ({
            label: formatChartDate(date),
            value: attendanceCountByDate.get(date) ?? 0,
          }),
        ),
        leaveStatusBreakdown: [
          { label: "Pending", value: leaveCounts.pending },
          { label: "Approved", value: leaveCounts.approved },
          { label: "Rejected", value: leaveCounts.rejected },
        ],
        employeeStatusDistribution: [
          {
            label: "Active",
            value: employeeCounts.active,
            color: EMPLOYEE_STATUS_COLORS.active,
          },
          {
            label: "Inactive",
            value: employeeCounts.inactive,
            color: EMPLOYEE_STATUS_COLORS.inactive,
          },
          {
            label: "Archived",
            value: employeeCounts.archived,
            color: EMPLOYEE_STATUS_COLORS.archived,
          },
        ] satisfies DashboardPieSlice[],
        activityTrend: recentDates.map(
          (date): DashboardChartPoint => ({
            label: formatChartDate(date),
            value: activityCountByDate.get(date) ?? 0,
          }),
        ),
      },
      recentActivity,
    };
  },
  ["executive-dashboard-summary"],
  { revalidate: 300 },
);

export async function getAdminDashboardData(): Promise<DashboardData> {
  try {
    const [settings, session, fallbackCompanyId] = await Promise.all([
      getCompanySettings(),
      getCurrentSessionProfile(),
      getActiveCompanyId(),
    ]);
    const companyId = session?.companyId ?? fallbackCompanyId;

    if (!companyId) {
      return getEmptyDashboard();
    }

    const summary = await getCachedExecutiveSummary(companyId);
    const health: DashboardData["health"] = {
      authentication: session?.status === "active" ? "healthy" : "warning",
      database: "healthy" as const,
      storage: "warning" as const,
      environment: getEnvironmentHealth(),
    };

    return {
      companyName: settings.companyName,
      companyLogo: settings.logo || null,
      loggedInUserName: session?.name ?? "Admin",
      totalModules: EXECUTIVE_MODULES.length,
      overallSystemStatus: getOverallStatus(health),
      counts: summary.counts,
      charts: summary.charts,
      recentActivity: summary.recentActivity,
      health,
    };
  } catch {
    return getEmptyDashboard();
  }
}

export const DashboardService = {
  getAdminDashboardData,
};
