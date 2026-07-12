import type {
  AttendanceLocationSource,
  AttendanceStatus,
  AttendanceType,
  EmployeeWorkMode,
} from "@/features/attendance/types/attendance.types";

export type AttendanceReportStatusFilter =
  | "all"
  | AttendanceStatus
  | "absent";

export type AttendanceReportModeFilter =
  | "all"
  | "office"
  | "remote"
  | "hybrid";
export type AttendanceReportWorkModeFilter =
  | "all"
  | EmployeeWorkMode;

export type AttendanceReportFilters = {
  companyId: string;
  department: string;
  roleId: string;
  employeeId: string;
  attendanceMode: AttendanceReportModeFilter;
  workMode: AttendanceReportWorkModeFilter;
  status: AttendanceReportStatusFilter;
  month: number;
  year: number;
  startDate: string | null;
  endDate: string | null;
};

export type AttendanceReportRange = {
  startDate: string;
  endDate: string;
  month: number;
  year: number;
  usesCustomRange: boolean;
  label: string;
};

export type AttendanceReportCompanyOption = {
  id: string;
  name: string;
};

export type AttendanceReportRoleOption = {
  id: string;
  name: string;
};

export type AttendanceReportEmployeeOption = {
  id: string;
  employeeId: string;
  name: string;
  roleId: string;
  roleName: string;
  workMode: EmployeeWorkMode;
};

export type AttendanceReportSummary = {
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  remote: number;
  hybrid: number;
  workingDays: number;
  averageWorkingHoursLabel: string;
};

export type AttendanceReportRow = {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  roleId: string;
  roleName: string;
  workMode: EmployeeWorkMode;
  departmentName: string | null;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  remoteDays: number;
  weekendDays: number;
  holidayDays: number;
  totalWorkingMinutes: number;
  totalWorkingHoursLabel: string;
  averageCheckIn: string | null;
  averageCheckOut: string | null;
  attendancePercentage: number;
  halfDayDays: number;
  hybridDays: number;
  attendanceDays: number;
};

export type AttendanceReportDailyDetail = {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHoursLabel: string;
  status: AttendanceStatus | "absent";
  workMode: EmployeeWorkMode;
  lateMinutes: number;
  office: string;
  attendanceType: AttendanceType | null;
  checkInAddress: string | null;
  checkOutAddress: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkInAccuracyMeters: number | null;
  checkInDeviceBrowser: string | null;
  checkInDevicePlatform: string | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  checkOutAccuracyMeters: number | null;
  checkOutDeviceBrowser: string | null;
  checkOutDevicePlatform: string | null;
  distanceLabel: string;
  locationSource: AttendanceLocationSource | null;
};

export type AttendanceReportDetailsResult = {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  dailyItems: AttendanceReportDailyDetail[];
};

export type AttendanceReportPageData = {
  company: AttendanceReportCompanyOption;
  companies: AttendanceReportCompanyOption[];
  roles: AttendanceReportRoleOption[];
  employees: AttendanceReportEmployeeOption[];
  filters: AttendanceReportFilters;
  range: AttendanceReportRange;
  generatedAt: string;
  generatedBy: string;
  attendanceModeLabel: string;
  summary: AttendanceReportSummary;
  rows: AttendanceReportRow[];
};

export type AttendanceReportExportFormat = "csv" | "xlsx" | "pdf";
