import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/env";
import type {
  DashboardData,
  DashboardHealthStatus,
} from "@/features/admin-dashboard/types/dashboard.types";

async function getActiveCompany() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("Company was not found.");
  }

  return data;
}

async function getCount(
  table: "employees" | "resources" | "announcements",
  companyId: string,
  status?: "active" | "inactive" | "archived",
) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (status) {
    query = query.eq("status", status);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Unable to load ${table} count.`);
  }

  return count ?? 0;
}

async function getCompanyName(companyId: string, fallbackName: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("company_settings")
    .select("company_name")
    .eq("company_id", companyId)
    .maybeSingle();

  return data?.company_name ?? fallbackName;
}

async function getRecentEmployees(
  companyId: string,
): Promise<DashboardData["recentEmployees"]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_id, name, role_id, status, joining_date")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error("Unable to load recent employees.");
  }

  const roleIds = Array.from(new Set(data.map((employee) => employee.role_id)));
  const { data: roles, error: rolesError } =
    roleIds.length > 0
      ? await supabase.from("roles").select("id, name").in("id", roleIds)
      : { data: [], error: null };

  if (rolesError) {
    throw new Error("Unable to load employee roles.");
  }

  const roleById = new Map(roles.map((role) => [role.id, role.name]));

  return data.map((employee) => ({
    id: employee.id,
    employeeId: employee.employee_id,
    name: employee.name,
    roleName: roleById.get(employee.role_id) ?? "Unknown",
    status: employee.status,
    joiningDate: employee.joining_date,
  }));
}

function getEnvironmentHealth(): DashboardHealthStatus {
  try {
    getSupabaseEnv();
    return "healthy";
  } catch {
    return "error";
  }
}

export async function getAdminDashboardData(): Promise<DashboardData> {
  try {
    const company = await getActiveCompany();
    const [
      companyName,
      employees,
      activeEmployees,
      inactiveEmployees,
      archivedEmployees,
      resources,
      announcements,
      recentEmployees,
    ] = await Promise.all([
      getCompanyName(company.id, company.name),
      getCount("employees", company.id),
      getCount("employees", company.id, "active"),
      getCount("employees", company.id, "inactive"),
      getCount("employees", company.id, "archived"),
      getCount("resources", company.id),
      getCount("announcements", company.id),
      getRecentEmployees(company.id),
    ]);

    return {
      companyName,
      loggedInUserName: "Admin",
      counts: {
        employees,
        activeEmployees,
        inactiveEmployees,
        archivedEmployees,
        resources,
        announcements,
      },
      recentEmployees,
      health: {
        authentication: "healthy",
        database: "healthy",
        storage: "healthy",
        environment: getEnvironmentHealth(),
      },
    };
  } catch {
    return {
      companyName: "Company Hub",
      loggedInUserName: "Admin",
      counts: {
        employees: 0,
        activeEmployees: 0,
        inactiveEmployees: 0,
        archivedEmployees: 0,
        resources: 0,
        announcements: 0,
      },
      recentEmployees: [],
      health: {
        authentication: "error",
        database: "error",
        storage: "error",
        environment: getEnvironmentHealth(),
      },
    };
  }
}
