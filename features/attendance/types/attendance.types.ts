import type { Database } from "@/lib/supabase/types";

export type AttendanceStatus =
  Database["public"]["Enums"]["attendance_status"];

export type AttendancePolicyMode =
  Database["public"]["Enums"]["attendance_policy_mode"];
export type AttendanceLocationSource =
  Database["public"]["Enums"]["attendance_location_source"];

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
  checkInAddress: string | null;
  checkInLocationSource: AttendanceLocationSource | null;
  checkInSelfiePath: string | null;
  checkInDeviceBrowser: string | null;
  checkInDevicePlatform: string | null;
  checkInLocationId: string | null;
  checkInDistanceMeters: number | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  checkOutAccuracyMeters: number | null;
  checkOutAddress: string | null;
  checkOutLocationSource: AttendanceLocationSource | null;
  checkOutSelfiePath: string | null;
  checkOutDeviceBrowser: string | null;
  checkOutDevicePlatform: string | null;
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
  address?: string | null;
  source?: AttendanceLocationSource;
};

export type AttendanceLocationValidation = {
  ok: boolean;
  message: string;
  locationName?: string;
  distanceMeters?: number;
  accuracyMeters?: number;
};

export type AttendanceAllowedLocation = {
  id: string;
  name: string;
  radiusMeters: number;
  isAssigned: boolean;
};

export type AttendancePolicySettings = {
  attendanceMode: AttendancePolicyMode;
  gpsAccuracyThresholdMeters: number;
  allowedRadiusMeters: number;
  allowEarlyCheckInMinutes: number;
  allowLateCheckOut: boolean;
  requireGps: boolean;
  requireSelfie: boolean;
  requireHighAccuracy: boolean;
  enableGeofence: boolean;
  faceVerificationEnabled: boolean;
  wifiValidationEnabled: boolean;
  bluetoothBeaconEnabled: boolean;
};

export type AttendancePolicySummary = AttendancePolicySettings & {
  modeLabel: string;
  modeDescription: string;
  allowedLocations: AttendanceAllowedLocation[];
};

export type AttendanceEmployeeOption = {
  id: string;
  employeeId: string;
  name: string;
};

export type TodayAttendance = {
  date: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  record: AttendanceRecord | null;
  policy: AttendancePolicySummary;
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
      modeLabel?: string;
      allowedLocations?: AttendanceAllowedLocation[];
      requiresSelfie?: boolean;
    }
  | {
      ok: false;
      message: string;
      locationName?: string;
      distanceMeters?: number;
      accuracyMeters?: number;
      modeLabel?: string;
      allowedLocations?: AttendanceAllowedLocation[];
      requiresSelfie?: boolean;
    };

export type AttendanceCheckInput = {
  notes?: string;
  gps?: AttendanceGpsInput;
  selfiePath?: string;
  deviceInfo?: {
    browser: string;
    platform: string;
  };
};

export type AttendanceDetailRecord = AttendanceListItem;

export type AttendanceDetail = AttendanceDetailRecord & {
  checkInSelfieUrl: string | null;
  checkOutSelfieUrl: string | null;
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

export type AttendanceSettingsValues = AttendancePolicySettings;
