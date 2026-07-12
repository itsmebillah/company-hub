import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type AttendanceReportRecordRow = {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: Database["public"]["Enums"]["attendance_status"];
  working_minutes: number;
  late_minutes: number;
  office_start_time_snapshot: string | null;
  office_grace_period_minutes_snapshot: number | null;
  work_mode: Database["public"]["Enums"]["employee_work_mode"];
  attendance_type: Database["public"]["Enums"]["attendance_type"];
  check_in_address: string | null;
  check_out_address: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_accuracy_meters: number | null;
  check_in_distance_meters: number | null;
  check_in_location_source: Database["public"]["Enums"]["attendance_location_source"] | null;
  check_in_device_browser: string | null;
  check_in_device_platform: string | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  check_out_accuracy_meters: number | null;
  check_out_device_browser: string | null;
  check_out_device_platform: string | null;
  check_in_location:
    | {
        name: string;
      }
    | Array<{
        name: string;
      }>
    | null;
};

export type AttendanceReportCompanyContextRow = {
  company: {
    id: string;
    name: string;
  };
  settings: {
    company_name: string;
    company_logo: string | null;
    attendance_mode: Database["public"]["Enums"]["attendance_policy_mode"];
    working_days: string[];
    timezone: string | null;
  } | null;
  roles: Array<{
    id: string;
    name: string;
  }>;
  employees: Array<{
    id: string;
    employee_id: string;
    name: string;
    joining_date: string | null;
    role_id: string;
    work_mode: Database["public"]["Enums"]["employee_work_mode"];
  }>;
};

export type AttendanceReportAttendanceRecord = {
  id: string;
  employeeId: string;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: Database["public"]["Enums"]["attendance_status"];
  workingMinutes: number;
  lateMinutes: number;
  officeStartTimeSnapshot: string | null;
  officeGracePeriodMinutesSnapshot: number | null;
  workMode: Database["public"]["Enums"]["employee_work_mode"];
  attendanceType: Database["public"]["Enums"]["attendance_type"];
  checkInAddress: string | null;
  checkOutAddress: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkInAccuracyMeters: number | null;
  checkInDistanceMeters: number | null;
  checkInLocationSource:
    | Database["public"]["Enums"]["attendance_location_source"]
    | null;
  checkInDeviceBrowser: string | null;
  checkInDevicePlatform: string | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  checkOutAccuracyMeters: number | null;
  checkOutDeviceBrowser: string | null;
  checkOutDevicePlatform: string | null;
  checkInLocationName: string | null;
};

export type AttendanceReportLeaveRow = {
  employeeId: string;
  startDate: string;
  endDate: string;
};

export type AttendanceReportHolidayEventRow = {
  date: string;
  title: string;
  isWorkingDay: boolean;
};

function getLocationName(
  location: AttendanceReportRecordRow["check_in_location"],
) {
  if (!location) {
    return null;
  }

  return Array.isArray(location) ? location[0]?.name ?? null : location.name;
}

export const AttendanceReportRepository = {
  async getCompanyContext(companyId: string): Promise<AttendanceReportCompanyContextRow> {
    const supabase = createSupabaseAdminClient();
    const [companyResult, settingsResult, rolesResult, employeesResult] =
      await Promise.all([
        supabase
          .from("companies")
          .select("id, name")
          .eq("id", companyId)
          .maybeSingle(),
        supabase
          .from("company_settings")
          .select("company_name, company_logo, attendance_mode, working_days, timezone")
          .eq("company_id", companyId)
          .maybeSingle(),
        supabase
          .from("roles")
          .select("id, name")
          .eq("company_id", companyId)
          .eq("status", "active")
          .order("name", { ascending: true }),
        supabase
          .from("employees")
          .select("id, employee_id, name, joining_date, role_id, work_mode")
          .eq("company_id", companyId)
          .eq("status", "active")
          .order("name", { ascending: true }),
      ]);

    if (companyResult.error || !companyResult.data) {
      console.error(
        "[AttendanceReportRepository] Unable to load company context.",
        companyResult.error,
      );
      throw new Error("Unable to load company information.");
    }

    if (settingsResult.error) {
      console.error(
        "[AttendanceReportRepository] Unable to load company settings.",
        settingsResult.error,
      );
      throw new Error("Unable to load company settings.");
    }

    if (rolesResult.error) {
      console.error(
        "[AttendanceReportRepository] Unable to load role options.",
        rolesResult.error,
      );
      throw new Error("Unable to load role options.");
    }

    if (employeesResult.error) {
      console.error(
        "[AttendanceReportRepository] Unable to load employee options.",
        employeesResult.error,
      );
      throw new Error("Unable to load employee options.");
    }

    return {
      company: companyResult.data,
      settings: settingsResult.data,
      roles: rolesResult.data,
      employees: employeesResult.data,
    };
  },

  async getAttendanceRecords(input: {
    companyId: string;
    startDate: string;
    endDate: string;
    employeeId?: string;
  }): Promise<AttendanceReportAttendanceRecord[]> {
    const supabase = createSupabaseAdminClient();
    let query = supabase
      .from("attendance_records")
      .select(
        "id, employee_id, attendance_date, check_in, check_out, status, working_minutes, late_minutes, office_start_time_snapshot, office_grace_period_minutes_snapshot, work_mode, attendance_type, check_in_address, check_out_address, check_in_latitude, check_in_longitude, check_in_accuracy_meters, check_in_distance_meters, check_in_location_source, check_in_device_browser, check_in_device_platform, check_out_latitude, check_out_longitude, check_out_accuracy_meters, check_out_device_browser, check_out_device_platform, check_in_location:company_locations!attendance_records_check_in_location_id_fkey(name)",
      )
      .eq("company_id", input.companyId)
      .gte("attendance_date", input.startDate)
      .lte("attendance_date", input.endDate);

    if (input.employeeId) {
      query = query.eq("employee_id", input.employeeId);
    }

    const { data, error } = await query.order("attendance_date", {
      ascending: true,
    });

    if (error) {
      console.error(
        "[AttendanceReportRepository] Unable to load attendance records.",
        error,
      );
      throw new Error("Unable to load attendance records.");
    }

    return (data as AttendanceReportRecordRow[]).map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      attendanceDate: row.attendance_date,
      checkIn: row.check_in,
      checkOut: row.check_out,
      status: row.status,
      workingMinutes: row.working_minutes,
      lateMinutes: row.late_minutes,
      officeStartTimeSnapshot: row.office_start_time_snapshot,
      officeGracePeriodMinutesSnapshot:
        row.office_grace_period_minutes_snapshot,
      workMode: row.work_mode,
      attendanceType: row.attendance_type,
      checkInAddress: row.check_in_address,
      checkOutAddress: row.check_out_address,
      checkInLatitude: row.check_in_latitude,
      checkInLongitude: row.check_in_longitude,
      checkInAccuracyMeters: row.check_in_accuracy_meters,
      checkInDistanceMeters: row.check_in_distance_meters,
      checkInLocationSource: row.check_in_location_source,
      checkInDeviceBrowser: row.check_in_device_browser,
      checkInDevicePlatform: row.check_in_device_platform,
      checkOutLatitude: row.check_out_latitude,
      checkOutLongitude: row.check_out_longitude,
      checkOutAccuracyMeters: row.check_out_accuracy_meters,
      checkOutDeviceBrowser: row.check_out_device_browser,
      checkOutDevicePlatform: row.check_out_device_platform,
      checkInLocationName: getLocationName(row.check_in_location),
    }));
  },

  async getApprovedLeaveRows(input: {
    companyId: string;
    startDate: string;
    endDate: string;
    employeeId?: string;
  }): Promise<AttendanceReportLeaveRow[]> {
    const supabase = createSupabaseAdminClient();
    let query = supabase
      .from("leave_requests")
      .select("employee_id, start_date, end_date")
      .eq("company_id", input.companyId)
      .eq("status", "approved")
      .lte("start_date", input.endDate)
      .gte("end_date", input.startDate);

    if (input.employeeId) {
      query = query.eq("employee_id", input.employeeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "[AttendanceReportRepository] Unable to load approved leave records.",
        error,
      );
      throw new Error("Unable to load leave records.");
    }

    return data.map((row) => ({
      employeeId: row.employee_id,
      startDate: row.start_date,
      endDate: row.end_date,
    }));
  },

  async getHolidayRows(input: {
    companyId: string;
    startDate: string;
    endDate: string;
  }): Promise<AttendanceReportHolidayEventRow[]> {
    const supabase = createSupabaseAdminClient();
    const { data: calendars, error: calendarError } = await supabase
      .from("holiday_calendars")
      .select("id, is_default")
      .eq("company_id", input.companyId)
      .eq("status", "active")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });

    if (calendarError) {
      console.error(
        "[AttendanceReportRepository] Unable to load holiday calendars.",
        calendarError,
      );
      throw new Error("Unable to load holiday calendars.");
    }

    const calendarId = calendars[0]?.id;

    if (!calendarId) {
      return [];
    }

    const { data, error } = await supabase
      .from("holiday_events")
      .select("date, title, is_working_day")
      .eq("calendar_id", calendarId)
      .eq("status", "active")
      .gte("date", input.startDate)
      .lte("date", input.endDate)
      .order("date", { ascending: true });

    if (error) {
      console.error(
        "[AttendanceReportRepository] Unable to load holiday events.",
        error,
      );
      throw new Error("Unable to load holiday events.");
    }

    return data.map((row) => ({
      date: row.date,
      title: row.title,
      isWorkingDay: row.is_working_day,
    }));
  },
};
