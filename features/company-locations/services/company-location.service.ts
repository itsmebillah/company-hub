import "server-only";

import { logActivity } from "@/features/activity/utils/activity-log";
import { requireCurrentCompanyId } from "@/features/auth/services/current-company-context.service";
import type {
  CompanyLocationFormValues,
  CompanyLocationListItem,
  CompanyLocationsPageData,
  CompanyLocationType,
} from "@/features/company-locations/types/company-location.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const LOCATION_TYPES: CompanyLocationType[] = [
  "head_office",
  "branch",
  "warehouse",
  "factory",
  "depot",
  "client_site",
];

function normalizeOptional(value: string) {
  const nextValue = value.trim();

  return nextValue.length > 0 ? nextValue : null;
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function assertLocationType(value: string): asserts value is CompanyLocationType {
  if (!LOCATION_TYPES.includes(value as CompanyLocationType)) {
    throw new Error("Location type is invalid.");
  }
}

function validateLocation(values: CompanyLocationFormValues) {
  const latitude = Number(values.latitude);
  const longitude = Number(values.longitude);
  const radiusMeters = Number(values.radiusMeters);

  if (!values.name.trim()) {
    throw new Error("Location name is required.");
  }

  if (!values.code.trim()) {
    throw new Error("Location code is required.");
  }

  assertLocationType(values.locationType);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error("Latitude is invalid.");
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("Longitude is invalid.");
  }

  if (!Number.isInteger(radiusMeters) || radiusMeters <= 0) {
    throw new Error("Allowed radius must be a positive whole number.");
  }

  if (values.status !== "active" && values.status !== "inactive") {
    throw new Error("Location status is invalid.");
  }
}

async function getActiveCompanyId() {
  try {
    return await requireCurrentCompanyId();
  } catch (error) {
    console.error("[CompanyLocationService] Unable to load company.", error);
    throw new Error("Unable to load company information.");
  }
}

async function syncAssignments(
  companyId: string,
  locationId: string,
  employeeIds: string[],
) {
  const supabase = createSupabaseAdminClient();
  const uniqueEmployeeIds = Array.from(new Set(employeeIds));
  const [locationResult, existingResult, validEmployeesResult] = await Promise.all([
    supabase
      .from("company_locations")
      .select("id")
      .eq("id", locationId)
      .eq("company_id", companyId)
      .maybeSingle(),
    supabase
      .from("employee_location_access")
      .select("id, employee_id")
      .eq("location_id", locationId),
    uniqueEmployeeIds.length > 0
      ? supabase
          .from("employees")
          .select("id")
          .eq("company_id", companyId)
          .in("id", uniqueEmployeeIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (!locationResult.data || locationResult.error) {
    throw new Error("Unable to save employee assignments.");
  }

  if (existingResult.error || validEmployeesResult.error) {
    console.error(
      "[CompanyLocationService] Unable to load location assignments.",
      existingResult.error ?? validEmployeesResult.error,
    );
    throw new Error("Unable to save employee assignments.");
  }

  const validEmployeeIds = new Set(
    (validEmployeesResult.data ?? []).map((employee) => employee.id),
  );
  const scopedEmployeeIds = uniqueEmployeeIds.filter((employeeId) =>
    validEmployeeIds.has(employeeId),
  );

  const existing = existingResult.data;
  const existingEmployeeIds = existing.map((item) => item.employee_id);
  const removedIds = existing
    .filter((item) => !scopedEmployeeIds.includes(item.employee_id))
    .map((item) => item.id);
  const addedIds = scopedEmployeeIds.filter(
    (employeeId) => !existingEmployeeIds.includes(employeeId),
  );
  const reactivatedIds = existing
    .filter((item) => scopedEmployeeIds.includes(item.employee_id))
    .map((item) => item.id);

  if (removedIds.length > 0) {
    const removed = await supabase
      .from("employee_location_access")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .in("id", removedIds);

    if (removed.error) {
      throw new Error("Unable to save employee assignments.");
    }
  }

  if (reactivatedIds.length > 0) {
    const reactivated = await supabase
      .from("employee_location_access")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .in("id", reactivatedIds);

    if (reactivated.error) {
      throw new Error("Unable to save employee assignments.");
    }
  }

  if (addedIds.length > 0) {
    const inserted = await supabase.from("employee_location_access").insert(
      addedIds.map((employeeId) => ({
        employee_id: employeeId,
        location_id: locationId,
        status: "active",
      })),
    );

    if (inserted.error) {
      throw new Error("Unable to save employee assignments.");
    }
  }
}

export async function getCompanyLocationsPageData(): Promise<CompanyLocationsPageData> {
  const supabase = createSupabaseAdminClient();
  const companyId = await getActiveCompanyId();
  const [locationsResult, employeesResult] = await Promise.all([
    supabase
      .from("company_locations")
      .select(
        "id, company_id, name, code, location_type, latitude, longitude, radius_meters, address, status, is_default",
      )
      .eq("company_id", companyId)
      .neq("status", "archived")
      .order("name", { ascending: true }),
    supabase
      .from("employees")
      .select("id, employee_id, name")
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("name", { ascending: true }),
  ]);

  if (locationsResult.error || employeesResult.error) {
    console.error("[CompanyLocationService] Unable to load locations.", {
      locationsError: locationsResult.error,
      employeesError: employeesResult.error,
    });
    throw new Error("Unable to load company locations.");
  }

  const locationIds = locationsResult.data.map((location) => location.id);
  const assignmentsResult =
    locationIds.length > 0
      ? await supabase
          .from("employee_location_access")
          .select("employee_id, location_id, status")
          .eq("status", "active")
          .in("location_id", locationIds)
      : { data: [], error: null };

  if (assignmentsResult.error) {
    console.error("[CompanyLocationService] Unable to load location assignments.", {
      assignmentsError: assignmentsResult.error,
    });
    throw new Error("Unable to load company locations.");
  }

  const assignedByLocation = new Map<string, string[]>();

  assignmentsResult.data.forEach((assignment) => {
    assignedByLocation.set(assignment.location_id, [
      ...(assignedByLocation.get(assignment.location_id) ?? []),
      assignment.employee_id,
    ]);
  });

  return {
    locations: locationsResult.data.map(
      (location): CompanyLocationListItem => ({
        id: location.id,
        companyId: location.company_id,
        name: location.name,
        code: location.code,
        locationType: location.location_type,
        latitude: location.latitude,
        longitude: location.longitude,
        radiusMeters: location.radius_meters,
        address: location.address,
        status: location.status,
        isDefault: location.is_default,
        assignedEmployeeIds: assignedByLocation.get(location.id) ?? [],
      }),
    ),
    employees: employeesResult.data.map((employee) => ({
      id: employee.id,
      employeeId: employee.employee_id,
      name: employee.name,
    })),
  };
}

export async function createCompanyLocation(values: CompanyLocationFormValues) {
  validateLocation(values);

  const supabase = createSupabaseAdminClient();
  const companyId = await getActiveCompanyId();

  if (values.isDefault) {
    await supabase
      .from("company_locations")
      .update({ is_default: false })
      .eq("company_id", companyId);
  }

  const { data, error } = await supabase
    .from("company_locations")
    .insert({
      company_id: companyId,
      name: values.name.trim(),
      code: normalizeCode(values.code),
      location_type: values.locationType,
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      radius_meters: Number(values.radiusMeters),
      address: normalizeOptional(values.address),
      status: values.status,
      is_default: values.isDefault,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[CompanyLocationService] Unable to create location.", error);
    throw new Error("Unable to create location.");
  }

  await syncAssignments(companyId, data.id, values.assignedEmployeeIds);
  await logActivity({
    companyId,
    module: "future",
    action: "created",
    entityType: "company_locations",
    entityId: data.id,
    description: `Created location ${values.name.trim()}`,
  });
}

export async function updateCompanyLocation(
  id: string,
  values: CompanyLocationFormValues,
) {
  validateLocation(values);

  const supabase = createSupabaseAdminClient();
  const companyId = await getActiveCompanyId();

  if (values.isDefault) {
    await supabase
      .from("company_locations")
      .update({ is_default: false })
      .eq("company_id", companyId)
      .neq("id", id);
  }

  const { error } = await supabase
    .from("company_locations")
    .update({
      name: values.name.trim(),
      code: normalizeCode(values.code),
      location_type: values.locationType,
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      radius_meters: Number(values.radiusMeters),
      address: normalizeOptional(values.address),
      status: values.status,
      is_default: values.isDefault,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) {
    console.error("[CompanyLocationService] Unable to update location.", error);
    throw new Error("Unable to update location.");
  }

  await syncAssignments(companyId, id, values.assignedEmployeeIds);
  await logActivity({
    companyId,
    module: "future",
    action: "updated",
    entityType: "company_locations",
    entityId: id,
    description: `Updated location ${values.name.trim()}`,
  });
}

export async function archiveCompanyLocation(id: string) {
  const supabase = createSupabaseAdminClient();
  const companyId = await getActiveCompanyId();
  const { error } = await supabase
    .from("company_locations")
    .update({
      status: "archived",
      is_default: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) {
    console.error("[CompanyLocationService] Unable to archive location.", error);
    throw new Error("Unable to archive location.");
  }

  await logActivity({
    companyId,
    module: "future",
    action: "archived",
    entityType: "company_locations",
    entityId: id,
    description: "Archived company location",
  });
}

export async function setDefaultCompanyLocation(id: string) {
  const supabase = createSupabaseAdminClient();
  const companyId = await getActiveCompanyId();
  const { error: clearError } = await supabase
    .from("company_locations")
    .update({ is_default: false })
    .eq("company_id", companyId);

  if (clearError) {
    throw new Error("Unable to set default location.");
  }

  const { error } = await supabase
    .from("company_locations")
    .update({ is_default: true, status: "active" })
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) {
    throw new Error("Unable to set default location.");
  }
}
