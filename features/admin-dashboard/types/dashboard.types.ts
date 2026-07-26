import type { Database } from "@/lib/supabase/types";
import type { AnnouncementListItem } from "@/features/announcements/types/announcement.types";
import type { EmployeePortalCategory } from "@/features/employee-resources/types/employee-resource.types";

export type DashboardHealthStatus = "healthy" | "error";
export type DashboardSystemStatus = "healthy" | "warning" | "error";

export type DashboardEmployee = {
  id: string;
  employeeId: string;
  name: string;
  roleName: string;
  status: Database["public"]["Enums"]["record_status"];
  joiningDate: string | null;
};

export type DashboardAnnouncement = {
  id: string;
  title: string;
  priority: Database["public"]["Enums"]["announcement_priority"];
  publishDate: string | null;
};

export type DashboardResource = {
  id: string;
  title: string;
  categoryName: string;
  resourceType: Database["public"]["Enums"]["resource_type"];
};

export type DashboardChartPoint = {
  label: string;
  value: number;
};

export type DashboardPieSlice = {
  label: string;
  value: number;
  color: string;
};

export type DashboardData = {
  companyName: string;
  companyLogo: string | null;
  loggedInUserName: string;
  loggedInUserEmployeeId: string;
  loggedInUserPhotoUrl: string | null;
  loggedInUserRoleName: string;
  totalModules: number;
  overallSystemStatus: DashboardSystemStatus;
  counts: {
    employees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    todaysAttendance: number;
    presentToday: number;
    lateToday: number;
    absentToday: number;
    employeesOnLeaveToday: number;
    pendingLeaveRequests: number;
    approvedLeaveRequests: number;
    rejectedLeaveRequests: number;
    activeResources: number;
    activeAnnouncements: number;
    unreadNotifications: number;
  };
  charts: {
    attendanceTrend: DashboardChartPoint[];
    leaveStatusBreakdown: DashboardChartPoint[];
    employeeStatusDistribution: DashboardPieSlice[];
  };
  liveAnnouncements: AnnouncementListItem[];
  quickResourceCategories: EmployeePortalCategory[];
  health: {
    authentication: DashboardSystemStatus;
    database: DashboardSystemStatus;
    storage: DashboardSystemStatus;
    environment: DashboardSystemStatus;
  };
};
