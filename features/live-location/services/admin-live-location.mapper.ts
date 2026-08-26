import type {
  AdminLiveLocation,
  AdminLiveLocationFreshness,
} from "@/features/live-location/types/admin-live-location.types";

type CurrentLocationRow = {
  employee_id: string;
  observed_at: string;
  received_at: string;
  updated_at: string;
  accuracy_meters: number;
  latitude: number;
  longitude: number;
};

type EmployeeRow = {
  id: string;
  employee_id: string;
  name: string;
  role_id: string;
  company_id: string;
};

type RoleRow = { id: string; name: string; company_id: string };

export type AdminLiveLocationQueryResult = {
  locations: CurrentLocationRow[];
  employees: EmployeeRow[];
  roles: RoleRow[];
};

export function getLocationFreshness(
  observedAt: string,
  now = new Date(),
): AdminLiveLocationFreshness {
  const ageMinutes = Math.max(
    0,
    (now.getTime() - new Date(observedAt).getTime()) / 60_000,
  );
  if (ageMinutes <= 5) return "fresh";
  if (ageMinutes <= 30) return "recent";
  return "stale";
}

export function mapAdminLiveLocations(
  result: AdminLiveLocationQueryResult,
  now = new Date(),
): AdminLiveLocation[] {
  const employees = new Map(
    result.employees.map((employee) => [employee.id, employee]),
  );
  const roles = new Map(result.roles.map((role) => [role.id, role]));
  return result.locations
    .flatMap((location) => {
      const employee = employees.get(location.employee_id);
      if (!employee) return [];
      return [
        {
          employeeId: employee.id,
          employeeCode: employee.employee_id,
          employeeName: employee.name,
          roleName: roles.get(employee.role_id)?.name ?? null,
          observedAt: location.observed_at,
          receivedAt: location.received_at,
          updatedAt: location.updated_at,
          freshness: getLocationFreshness(location.observed_at, now),
          accuracyMeters: location.accuracy_meters,
          latitude: location.latitude,
          longitude: location.longitude,
        },
      ];
    })
    .sort((left, right) => right.observedAt.localeCompare(left.observedAt));
}
