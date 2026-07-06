import type { Database } from "@/lib/supabase/types";

export type AttendanceStatus =
  Database["public"]["Enums"]["attendance_status"];

export type AttendanceRecord = {
  id: string;
  companyId: string;
  employeeId: string;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  workingMinutes: number;
  lateMinutes: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceEmployeeOption = {
  id: string;
  employeeId: string;
  name: string;
};

export type TodayAttendance = {
  date: string;
  employeeName: string;
  employeeCode: string;
  record: AttendanceRecord | null;
};

export type AttendanceListItem = AttendanceRecord & {
  employeeCode: string;
  employeeName: string;
};

export type AttendanceListFilters = {
  date?: string;
  employeeId?: string;
  search?: string;
  status?: AttendanceStatus | "all";
};

export type AttendanceListResult = {
  date: string;
  records: AttendanceListItem[];
  employees: AttendanceEmployeeOption[];
};

export type AttendanceActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

export type AttendanceCheckInput = {
  notes?: string;
};

export type AdminAttendanceOverview = {
  today: string;
  totalRecordsToday: number;
  presentToday: number;
  lateToday: number;
  checkedInToday: number;
  notCheckedInToday: number;
};

export type EmployeeAttendanceSummary = {
  status: AttendanceStatus | "not_started";
  checkIn: string | null;
  checkOut: string | null;
  workingMinutes: number;
};
