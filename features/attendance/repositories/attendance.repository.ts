import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AttendanceEmployeeOption,
  AttendanceDetailRecord,
  AttendanceListFilters,
  AttendanceListItem,
  AttendanceRecord,
  AttendanceGpsInput,
  AttendanceStatus,
  CompanyLocation,
} from "@/features/attendance/types/attendance.types";

const attendanceRecordSelect =
  "id, company_id, employee_id, attendance_date, check_in, check_out, status, working_minutes, late_minutes, notes, check_in_latitude, check_in_longitude, check_in_accuracy_meters, check_in_address, check_in_location_source, check_in_selfie_path, check_in_device_browser, check_in_device_platform, check_in_location_id, check_in_distance_meters, check_out_latitude, check_out_longitude, check_out_accuracy_meters, check_out_address, check_out_location_source, check_out_selfie_path, check_out_device_browser, check_out_device_platform, check_out_location_id, check_out_distance_meters, created_at, updated_at";

function toRecord(row: {
  id: string;
  company_id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  working_minutes: number;
  late_minutes: number;
  notes: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_accuracy_meters: number | null;
  check_in_address: string | null;
  check_in_location_source: AttendanceRecord["checkInLocationSource"];
  check_in_selfie_path: string | null;
  check_in_device_browser: string | null;
  check_in_device_platform: string | null;
  check_in_location_id: string | null;
  check_in_distance_meters: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  check_out_accuracy_meters: number | null;
  check_out_address: string | null;
  check_out_location_source: AttendanceRecord["checkOutLocationSource"];
  check_out_selfie_path: string | null;
  check_out_device_browser: string | null;
  check_out_device_platform: string | null;
  check_out_location_id: string | null;
  check_out_distance_meters: number | null;
  created_at: string;
  updated_at: string;
}): AttendanceRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    employeeId: row.employee_id,
    attendanceDate: row.attendance_date,
    checkIn: row.check_in,
    checkOut: row.check_out,
    status: row.status,
    workingMinutes: row.working_minutes,
    lateMinutes: row.late_minutes,
    notes: row.notes,
    checkInLatitude: row.check_in_latitude,
    checkInLongitude: row.check_in_longitude,
    checkInAccuracyMeters: row.check_in_accuracy_meters,
    checkInAddress: row.check_in_address,
    checkInLocationSource: row.check_in_location_source,
    checkInSelfiePath: row.check_in_selfie_path,
    checkInDeviceBrowser: row.check_in_device_browser,
    checkInDevicePlatform: row.check_in_device_platform,
    checkInLocationId: row.check_in_location_id,
    checkInDistanceMeters: row.check_in_distance_meters,
    checkOutLatitude: row.check_out_latitude,
    checkOutLongitude: row.check_out_longitude,
    checkOutAccuracyMeters: row.check_out_accuracy_meters,
    checkOutAddress: row.check_out_address,
    checkOutLocationSource: row.check_out_location_source,
    checkOutSelfiePath: row.check_out_selfie_path,
    checkOutDeviceBrowser: row.check_out_device_browser,
    checkOutDevicePlatform: row.check_out_device_platform,
    checkOutLocationId: row.check_out_location_id,
    checkOutDistanceMeters: row.check_out_distance_meters,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type AttendanceRecordRow = Parameters<typeof toRecord>[0];

type AttendanceRecordWithEmployeeRow = AttendanceRecordRow & {
  employees:
    | {
        employee_id: string;
        name: string;
      }
    | Array<{
        employee_id: string;
      name: string;
    }>;
  check_in_location:
    | {
        name: string;
      }
    | Array<{
        name: string;
      }>
    | null;
  check_out_location:
    | {
        name: string;
      }
    | Array<{
        name: string;
      }>
    | null;
};

type AssignedCompanyLocationAccessRow = {
  company_locations:
    | {
        id: string;
        company_id: string;
        name: string;
        code: string;
        location_type: CompanyLocation["locationType"];
        latitude: number;
        longitude: number;
        radius_meters: number;
        address: string | null;
        status: CompanyLocation["status"];
        is_default: boolean;
      }
    | Array<{
        id: string;
        company_id: string;
        name: string;
        code: string;
        location_type: CompanyLocation["locationType"];
        latitude: number;
        longitude: number;
        radius_meters: number;
        address: string | null;
        status: CompanyLocation["status"];
        is_default: boolean;
      }>;
};

export const AttendanceRepository = {
  async findByEmployeeDate(employeeId: string, attendanceDate: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("attendance_records")
      .select(attendanceRecordSelect)
      .eq("employee_id", employeeId)
      .eq("attendance_date", attendanceDate)
      .maybeSingle();

    if (error) {
      console.error(
        "[AttendanceRepository] Unable to load attendance record.",
        error,
      );
      throw new Error("Unable to load attendance.");
    }

    return data ? toRecord(data) : null;
  },

  async createCheckIn(input: {
    companyId: string;
    employeeId: string;
    attendanceDate: string;
    checkIn: string;
    status: AttendanceStatus;
    lateMinutes: number;
    notes?: string | null;
    gps?: AttendanceGpsInput | null;
    locationId?: string | null;
    distanceMeters?: number | null;
    selfiePath?: string | null;
    deviceInfo?: {
      browser: string;
      platform: string;
    } | null;
  }) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("attendance_records")
      .insert({
        company_id: input.companyId,
        employee_id: input.employeeId,
        attendance_date: input.attendanceDate,
        check_in: input.checkIn,
        status: input.status,
        late_minutes: input.lateMinutes,
        notes: input.notes ?? null,
        check_in_latitude: input.gps?.latitude ?? null,
        check_in_longitude: input.gps?.longitude ?? null,
        check_in_accuracy_meters: input.gps?.accuracy ?? null,
        check_in_address: input.gps?.address ?? null,
        check_in_location_source: input.gps?.source ?? null,
        check_in_selfie_path: input.selfiePath ?? null,
        check_in_device_browser: input.deviceInfo?.browser ?? null,
        check_in_device_platform: input.deviceInfo?.platform ?? null,
        check_in_location_id: input.locationId ?? null,
        check_in_distance_meters: input.distanceMeters ?? null,
        updated_at: input.checkIn,
      })
      .select(attendanceRecordSelect)
      .single();

    if (error || !data) {
      console.error("[AttendanceRepository] Unable to check in.", error);
      throw new Error("Unable to check in.");
    }

    return toRecord(data);
  },

  async updateCheckOut(input: {
    id: string;
    checkOut: string;
    status: AttendanceStatus;
    workingMinutes: number;
    gps?: AttendanceGpsInput | null;
    locationId?: string | null;
    distanceMeters?: number | null;
    selfiePath?: string | null;
    deviceInfo?: {
      browser: string;
      platform: string;
    } | null;
  }) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("attendance_records")
      .update({
        check_out: input.checkOut,
        status: input.status,
        working_minutes: input.workingMinutes,
        check_out_latitude: input.gps?.latitude ?? null,
        check_out_longitude: input.gps?.longitude ?? null,
        check_out_accuracy_meters: input.gps?.accuracy ?? null,
        check_out_address: input.gps?.address ?? null,
        check_out_location_source: input.gps?.source ?? null,
        check_out_selfie_path: input.selfiePath ?? null,
        check_out_device_browser: input.deviceInfo?.browser ?? null,
        check_out_device_platform: input.deviceInfo?.platform ?? null,
        check_out_location_id: input.locationId ?? null,
        check_out_distance_meters: input.distanceMeters ?? null,
        updated_at: input.checkOut,
      })
      .eq("id", input.id)
      .select(attendanceRecordSelect)
      .single();

    if (error || !data) {
      console.error("[AttendanceRepository] Unable to check out.", error);
      throw new Error("Unable to check out.");
    }

    return toRecord(data);
  },

  async countByCompanyDate(companyId: string, attendanceDate: string) {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from("attendance_records")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("attendance_date", attendanceDate);

    if (error) {
      console.error(
        "[AttendanceRepository] Unable to count attendance records.",
        error,
      );
      throw new Error("Unable to load attendance summary.");
    }

    return count ?? 0;
  },

  async getEmployees(companyId: string): Promise<AttendanceEmployeeOption[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("employees")
      .select("id, employee_id, name")
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) {
      console.error(
        "[AttendanceRepository] Unable to load employee options.",
        error,
      );
      throw new Error("Unable to load employees.");
    }

    return data.map((employee) => ({
      id: employee.id,
      employeeId: employee.employee_id,
      name: employee.name,
    }));
  },

  async listByCompany(
    companyId: string,
    filters: AttendanceListFilters,
  ): Promise<AttendanceListItem[]> {
    const supabase = createSupabaseAdminClient();
    const attendanceDate = filters.date;

    let query = supabase
      .from("attendance_records")
      .select(
        `${attendanceRecordSelect}, employees!inner(employee_id, name), check_in_location:company_locations!attendance_records_check_in_location_id_fkey(name), check_out_location:company_locations!attendance_records_check_out_location_id_fkey(name)`,
      )
      .eq("company_id", companyId);

    if (attendanceDate) {
      query = query.eq("attendance_date", attendanceDate);
    }

    if (filters.employeeId) {
      query = query.eq("employee_id", filters.employeeId);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim();
      query = query.or(
        `employee_id.ilike.%${search}%,name.ilike.%${search}%`,
        { foreignTable: "employees" },
      );
    }

    const { data, error } = await query
      .order("attendance_date", { ascending: false })
      .order("check_in", { ascending: false });

    if (error) {
      console.error(
        "[AttendanceRepository] Unable to load attendance records.",
        error,
      );
      throw new Error("Unable to load attendance records.");
    }

    return (data as AttendanceRecordWithEmployeeRow[]).map((row) => {
      const record = toRecord(row);
      const employee = Array.isArray(row.employees)
        ? row.employees[0]
        : row.employees;
      const checkInLocation = Array.isArray(row.check_in_location)
        ? row.check_in_location[0]
        : row.check_in_location;
      const checkOutLocation = Array.isArray(row.check_out_location)
        ? row.check_out_location[0]
        : row.check_out_location;

      return {
        ...record,
        employeeCode: employee?.employee_id ?? "Unknown",
        employeeName: employee?.name ?? "Unknown",
        checkInLocationName: checkInLocation?.name ?? null,
        checkOutLocationName: checkOutLocation?.name ?? null,
      };
    });
  },

  async findDetailById(id: string): Promise<AttendanceDetailRecord | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("attendance_records")
      .select(
        `${attendanceRecordSelect}, employees!inner(employee_id, name), check_in_location:company_locations!attendance_records_check_in_location_id_fkey(name), check_out_location:company_locations!attendance_records_check_out_location_id_fkey(name)`,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(
        "[AttendanceRepository] Unable to load attendance detail.",
        error,
      );
      throw new Error("Unable to load attendance detail.");
    }

    if (!data) {
      return null;
    }

    const row = data as AttendanceRecordWithEmployeeRow;
    const record = toRecord(row);
    const employee = Array.isArray(row.employees)
      ? row.employees[0]
      : row.employees;
    const checkInLocation = Array.isArray(row.check_in_location)
      ? row.check_in_location[0]
      : row.check_in_location;
    const checkOutLocation = Array.isArray(row.check_out_location)
      ? row.check_out_location[0]
      : row.check_out_location;

    return {
      ...record,
      employeeCode: employee?.employee_id ?? "Unknown",
      employeeName: employee?.name ?? "Unknown",
      checkInLocationName: checkInLocation?.name ?? null,
      checkOutLocationName: checkOutLocation?.name ?? null,
    };
  },

  async getAssignedCompanyLocations(companyId: string, employeeId: string) {
    const supabase = createSupabaseAdminClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("employee_location_access")
      .select(
        "effective_from, effective_to, company_locations!inner(id, company_id, name, code, location_type, latitude, longitude, radius_meters, address, status, is_default)",
      )
      .eq("employee_id", employeeId)
      .eq("status", "active")
      .eq("company_locations.company_id", companyId)
      .eq("company_locations.status", "active")
      .or(`effective_from.is.null,effective_from.lte.${today}`)
      .or(`effective_to.is.null,effective_to.gte.${today}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(
        "[AttendanceRepository] Unable to load assigned locations.",
        error,
      );
      throw new Error("Unable to load assigned office locations.");
    }

    return (data as AssignedCompanyLocationAccessRow[]).flatMap(
      (assignment): CompanyLocation[] => {
        const location = Array.isArray(assignment.company_locations)
          ? assignment.company_locations[0]
          : assignment.company_locations;

        if (!location) {
          return [];
        }

        return [
          {
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
          },
        ];
      },
    );
  },

  async getActiveCompanyLocations(companyId: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("company_locations")
      .select(
        "id, company_id, name, code, location_type, latitude, longitude, radius_meters, address, status, is_default",
      )
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error(
        "[AttendanceRepository] Unable to load active company locations.",
        error,
      );
      throw new Error("Unable to load office locations.");
    }

    return data.map((location): CompanyLocation => ({
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
    }));
  },

  async getStatusCount(
    companyId: string,
    attendanceDate: string,
    status: AttendanceStatus,
  ) {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from("attendance_records")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("attendance_date", attendanceDate)
      .eq("status", status);

    if (error) {
      console.error(
        "[AttendanceRepository] Unable to count attendance status.",
        error,
      );
      throw new Error("Unable to load attendance summary.");
    }

    return count ?? 0;
  },

  async countCheckedIn(companyId: string, attendanceDate: string) {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from("attendance_records")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("attendance_date", attendanceDate)
      .not("check_in", "is", null);

    if (error) {
      console.error(
        "[AttendanceRepository] Unable to count checked-in employees.",
        error,
      );
      throw new Error("Unable to load attendance summary.");
    }

    return count ?? 0;
  },
};
