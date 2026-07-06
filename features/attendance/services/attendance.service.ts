import "server-only";

import { redirect } from "next/navigation";

import { ATTENDANCE_RULES } from "@/features/attendance/constants/attendance-options";
import { AttendanceRepository } from "@/features/attendance/repositories/attendance.repository";
import type {
  AdminAttendanceOverview,
  AttendanceCheckInput,
  AttendanceListFilters,
  AttendanceListResult,
  AttendanceRecord,
  AttendanceStatus,
  EmployeeAttendanceSummary,
  TodayAttendance,
} from "@/features/attendance/types/attendance.types";
import { logActivity } from "@/features/activity/utils/activity-log";
import { getCurrentAuthUser } from "@/features/auth/services/auth.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getDateFromTimestamp(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function getOfficeStart(date: string) {
  return new Date(`${date}T${ATTENDANCE_RULES.officeStartTime}:00`);
}

function getLateMinutes(checkIn: string, attendanceDate: string) {
  const checkInTime = new Date(checkIn).getTime();
  const officeStartTime = getOfficeStart(attendanceDate).getTime();

  return Math.max(Math.floor((checkInTime - officeStartTime) / 60000), 0);
}

function getCheckInStatus(lateMinutes: number): AttendanceStatus {
  return lateMinutes > 0 ? "late" : "present";
}

function getCheckOutStatus(record: AttendanceRecord, workingMinutes: number) {
  if (workingMinutes < ATTENDANCE_RULES.halfDayWorkingMinutes) {
    return "half_day";
  }

  return record.lateMinutes > 0 ? "late" : "present";
}

function getWorkingMinutes(checkIn: string, checkOut: string) {
  return Math.max(
    Math.floor(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000,
    ),
    0,
  );
}

async function getCurrentEmployee() {
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_id, name, company_id, status")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !data || data.status !== "active") {
    redirect("/login");
  }

  return data;
}

async function getActiveCompanyId() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    console.error("[AttendanceService] Unable to load active company.", error);
    throw new Error("Unable to load company information.");
  }

  return data[0]?.id ?? null;
}

export const AttendanceService = {
  async getTodayAttendance(): Promise<TodayAttendance> {
    const employee = await getCurrentEmployee();
    const today = getTodayDate();
    const record = await AttendanceRepository.findByEmployeeDate(
      employee.id,
      today,
    );

    return {
      date: today,
      employeeName: employee.name,
      employeeCode: employee.employee_id,
      record,
    };
  },

  async getAdminOverview(): Promise<AdminAttendanceOverview> {
    const companyId = await getActiveCompanyId();
    const today = getTodayDate();

    if (!companyId) {
      return {
        today,
        totalRecordsToday: 0,
        presentToday: 0,
        lateToday: 0,
        checkedInToday: 0,
        notCheckedInToday: 0,
      };
    }

    const [
      employees,
      totalRecordsToday,
      presentToday,
      lateToday,
      checkedInToday,
    ] = await Promise.all([
      AttendanceRepository.getEmployees(companyId),
      AttendanceRepository.countByCompanyDate(companyId, today),
      AttendanceRepository.getStatusCount(companyId, today, "present"),
      AttendanceRepository.getStatusCount(companyId, today, "late"),
      AttendanceRepository.countCheckedIn(companyId, today),
    ]);

    return {
      today,
      totalRecordsToday,
      presentToday,
      lateToday,
      checkedInToday,
      notCheckedInToday: Math.max(employees.length - checkedInToday, 0),
    };
  },

  async getAdminList(
    filters: AttendanceListFilters,
  ): Promise<AttendanceListResult> {
    const companyId = await getActiveCompanyId();
    const date = filters.date || getTodayDate();

    if (!companyId) {
      return {
        date,
        employees: [],
        records: [],
      };
    }

    const [employees, records] = await Promise.all([
      AttendanceRepository.getEmployees(companyId),
      AttendanceRepository.listByCompany(companyId, {
        ...filters,
        date,
      }),
    ]);

    return {
      date,
      employees,
      records,
    };
  },

  async getEmployeeDashboardSummary(): Promise<EmployeeAttendanceSummary> {
    const today = await this.getTodayAttendance();

    return {
      status: today.record?.status ?? "not_started",
      checkIn: today.record?.checkIn ?? null,
      checkOut: today.record?.checkOut ?? null,
      workingMinutes: today.record?.workingMinutes ?? 0,
    };
  },

  async prepareCheckIn(_input: AttendanceCheckInput = {}) {
    return {
      canProceed: true,
      requiresGps: false,
      requiresSelfie: false,
      activityLogReady: true,
    };
  },

  async prepareCheckOut(_input: AttendanceCheckInput = {}) {
    return {
      canProceed: true,
      requiresGps: false,
      requiresSelfie: false,
      activityLogReady: true,
    };
  },

  async checkIn(input: AttendanceCheckInput = {}) {
    const employee = await getCurrentEmployee();
    const serverTimestamp = new Date().toISOString();
    const attendanceDate = getDateFromTimestamp(serverTimestamp);
    const existingRecord = await AttendanceRepository.findByEmployeeDate(
      employee.id,
      attendanceDate,
    );

    if (existingRecord?.checkIn) {
      throw new Error("You have already checked in today.");
    }

    if (existingRecord) {
      throw new Error("Attendance already exists for today.");
    }

    const lateMinutes = getLateMinutes(serverTimestamp, attendanceDate);
    const record = await AttendanceRepository.createCheckIn({
      companyId: employee.company_id,
      employeeId: employee.id,
      attendanceDate,
      checkIn: serverTimestamp,
      status: getCheckInStatus(lateMinutes),
      lateMinutes,
      notes: input.notes?.trim() || null,
    });

    await logActivity({
      companyId: employee.company_id,
      module: "attendance",
      action: "created",
      entityType: "attendance_records",
      entityId: record.id,
      description: `${employee.name} checked in`,
      metadata: {
        employeeId: employee.employee_id,
        attendanceDate,
        checkIn: serverTimestamp,
      },
    });

    return record;
  },

  async checkOut(input: AttendanceCheckInput = {}) {
    const employee = await getCurrentEmployee();
    const serverTimestamp = new Date().toISOString();
    const attendanceDate = getDateFromTimestamp(serverTimestamp);
    const record = await AttendanceRepository.findByEmployeeDate(
      employee.id,
      attendanceDate,
    );

    if (!record?.checkIn) {
      throw new Error("Check in before checking out.");
    }

    if (record.checkOut) {
      throw new Error("You have already checked out today.");
    }

    const workingMinutes = getWorkingMinutes(record.checkIn, serverTimestamp);
    const updatedRecord = await AttendanceRepository.updateCheckOut({
      id: record.id,
      checkOut: serverTimestamp,
      workingMinutes,
      status: getCheckOutStatus(record, workingMinutes),
    });

    await logActivity({
      companyId: employee.company_id,
      module: "attendance",
      action: "updated",
      entityType: "attendance_records",
      entityId: record.id,
      description: `${employee.name} checked out`,
      metadata: {
        employeeId: employee.employee_id,
        attendanceDate,
        checkOut: serverTimestamp,
        workingMinutes,
        notes: input.notes?.trim() || null,
      },
    });

    return updatedRecord;
  },
};
