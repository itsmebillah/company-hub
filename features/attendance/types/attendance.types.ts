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
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkInAccuracyMeters: number | null;
  checkInLocationId: string | null;
  checkInDistanceMeters: number | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  checkOutAccuracyMeters: number | null;
  checkOutLocationId: string | null;
  checkOutDistanceMeters: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyLocationStatus = "active" | "inactive" | "archived";

export type CompanyLocation = {
  id: string;
  companyId: string;
  name: string;
  code: string;
  locationType: Database["public"]["Enums"]["company_location_type"];
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address: string | null;
  status: CompanyLocationStatus;
  isDefault: boolean;
};

export type AttendanceGpsInput = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp?: string;
};

export type AttendanceLocationValidation = {
  ok: boolean;
  message: string;
  locationName?: string;
  distanceMeters?: number;
  accuracyMeters?: number;
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
  checkInLocationName: string | null;
  checkOutLocationName: string | null;
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
      locationName?: string;
      distanceMeters?: number;
      accuracyMeters?: number;
    }
  | {
      ok: false;
      message: string;
      locationName?: string;
      distanceMeters?: number;
      accuracyMeters?: number;
    };

export type AttendanceCheckInput = {
  notes?: string;
  gps?: AttendanceGpsInput;
};

export type AttendanceDetail = AttendanceListItem;

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
