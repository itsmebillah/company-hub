import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AttendanceEmployeeOption,
  AttendanceListFilters,
  AttendanceListItem,
  AttendanceRecord,
  AttendanceStatus,
} from "@/features/attendance/types/attendance.types";

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
};

export const AttendanceRepository = {
  async findByEmployeeDate(employeeId: string, attendanceDate: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("attendance_records")
      .select(
        "id, company_id, employee_id, attendance_date, check_in, check_out, status, working_minutes, late_minutes, notes, created_at, updated_at",
      )
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
        updated_at: input.checkIn,
      })
      .select(
        "id, company_id, employee_id, attendance_date, check_in, check_out, status, working_minutes, late_minutes, notes, created_at, updated_at",
      )
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
  }) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("attendance_records")
      .update({
        check_out: input.checkOut,
        status: input.status,
        working_minutes: input.workingMinutes,
        updated_at: input.checkOut,
      })
      .eq("id", input.id)
      .select(
        "id, company_id, employee_id, attendance_date, check_in, check_out, status, working_minutes, late_minutes, notes, created_at, updated_at",
      )
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
        "id, company_id, employee_id, attendance_date, check_in, check_out, status, working_minutes, late_minutes, notes, created_at, updated_at, employees!inner(employee_id, name)",
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

      return {
        ...record,
        employeeCode: employee?.employee_id ?? "Unknown",
        employeeName: employee?.name ?? "Unknown",
      };
    });
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
