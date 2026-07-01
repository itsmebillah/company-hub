import type { Database } from "@/lib/supabase/types";

export type DashboardHealthStatus = "healthy" | "error";

export type DashboardEmployee = {
  id: string;
  employeeId: string;
  name: string;
  roleName: string;
  status: Database["public"]["Enums"]["record_status"];
  joiningDate: string | null;
};

export type DashboardData = {
  companyName: string;
  loggedInUserName: string;
  counts: {
    employees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    archivedEmployees: number;
    resources: number;
    announcements: number;
  };
  recentEmployees: DashboardEmployee[];
  health: {
    authentication: DashboardHealthStatus;
    database: DashboardHealthStatus;
    storage: DashboardHealthStatus;
    environment: DashboardHealthStatus;
  };
};
