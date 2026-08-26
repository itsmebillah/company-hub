import "server-only";

import { requireCompanyAdmin } from "@/features/auth/services/authorization.service";
import { mapAdminLiveLocations } from "@/features/live-location/services/admin-live-location.mapper";
import type { AdminLiveLocationQueryResult } from "@/features/live-location/services/admin-live-location.mapper";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
type AdminLiveLocationDependencies = {
  requireAdmin: () => Promise<{ companyId: string }>;
  query: (companyId: string) => Promise<AdminLiveLocationQueryResult>;
  now?: () => Date;
};

async function queryAdminLiveLocations(
  companyId: string,
): Promise<AdminLiveLocationQueryResult> {
  const supabase = createSupabaseAdminClient();
  const locationsResult = await supabase
    .from("employee_current_locations")
    .select(
      "employee_id, observed_at, received_at, updated_at, accuracy_meters, latitude, longitude",
    )
    .eq("company_id", companyId)
    .order("observed_at", { ascending: false });
  if (locationsResult.error)
    throw new Error("Unable to load current employee locations.");

  const employeeIds = locationsResult.data.map(
    (location) => location.employee_id,
  );
  if (employeeIds.length === 0)
    return { locations: [], employees: [], roles: [] };

  const employeesResult = await supabase
    .from("employees")
    .select("id, employee_id, name, role_id, company_id")
    .eq("company_id", companyId)
    .in("id", employeeIds);
  if (employeesResult.error)
    throw new Error("Unable to load location employees.");

  const roleIds = [
    ...new Set(employeesResult.data.map((employee) => employee.role_id)),
  ];
  const rolesResult = roleIds.length
    ? await supabase
        .from("roles")
        .select("id, name, company_id")
        .eq("company_id", companyId)
        .in("id", roleIds)
    : { data: [], error: null };
  if (rolesResult.error) throw new Error("Unable to load employee roles.");

  return {
    locations: locationsResult.data,
    employees: employeesResult.data,
    roles: rolesResult.data,
  };
}

const defaultDependencies: AdminLiveLocationDependencies = {
  requireAdmin: () => requireCompanyAdmin("attendance"),
  query: queryAdminLiveLocations,
};

export const AdminLiveLocationService = {
  async getLocations(
    dependencies: AdminLiveLocationDependencies = defaultDependencies,
  ) {
    const { companyId } = await dependencies.requireAdmin();
    const result = await dependencies.query(companyId);
    return mapAdminLiveLocations(result, dependencies.now?.() ?? new Date());
  },
};
