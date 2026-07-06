import type { Database } from "@/lib/supabase/types";

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

export type DashboardData = {
  companyName: string;
  companyLogo: string | null;
  loggedInUserName: string;
  counts: {
    employees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    archivedEmployees: number;
    resources: number;
    categories: number;
    announcements: number;
    presentToday: number;
    lateToday: number;
    checkedInToday: number;
    notCheckedInToday: number;
  };
  recentEmployees: DashboardEmployee[];
  recentAnnouncements: DashboardAnnouncement[];
  recentResources: DashboardResource[];
  health: {
    authentication: DashboardSystemStatus;
    database: DashboardSystemStatus;
    storage: DashboardSystemStatus;
    environment: DashboardSystemStatus;
  };
};
