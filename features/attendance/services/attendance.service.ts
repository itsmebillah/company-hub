import "server-only";

import { redirect } from "next/navigation";

import { ATTENDANCE_RULES } from "@/features/attendance/constants/attendance-options";
import { getAttendancePolicyOption } from "@/features/attendance/constants/attendance-policy-options";
import { AttendanceRepository } from "@/features/attendance/repositories/attendance.repository";
import { AttendancePolicyService } from "@/features/attendance/services/attendance-policy.service";
import { AttendanceReverseGeocodeService } from "@/features/attendance/services/attendance-reverse-geocode.service";
import { AttendanceSelfieService } from "@/features/attendance/services/attendance-selfie.service";
import type {
  AdminAttendanceOverview,
  AttendanceCheckInput,
  AttendanceListFilters,
  AttendanceListResult,
  AttendanceRecord,
  AttendanceSettingsValues,
  AttendanceType,
  EmployeeAttendanceSummary,
  TodayAttendance,
} from "@/features/attendance/types/attendance.types";
import { logActivity } from "@/features/activity/utils/activity-log";
import { requireCurrentEmployeeContext } from "@/features/auth/services/current-employee-context.service";
import { requireCurrentCompanyId } from "@/features/auth/services/current-company-context.service";
import { CalendarService } from "@/features/company-calendar/services/calendar.service";
import { NotificationService } from "@/features/notifications/services/notification.service";
import { formatAppTime, getAppDateString, getAppDateTime } from "@/lib/datetime";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getTodayDate() {
  return getAppDateString();
}

function getDateFromTimestamp(value: string) {
  return getAppDateString(value);
}

type CheckInPolicyResult = {
  lateMinutes: number;
  status: "present" | "late";
  officeStartTimeSnapshot: string | null;
  officeGracePeriodMinutesSnapshot: number | null;
};

function getOfficeStartDateTime(
  attendanceDate: string,
  settings: AttendanceSettingsValues,
) {
  return getAppDateTime(attendanceDate, settings.officeStartTime);
}

function getEarlyCheckInDateTime(
  attendanceDate: string,
  settings: AttendanceSettingsValues,
) {
  return new Date(
    getOfficeStartDateTime(attendanceDate, settings).getTime() -
      settings.allowEarlyCheckInMinutes * 60000,
  );
}

function getLateThresholdDateTime(
  attendanceDate: string,
  settings: AttendanceSettingsValues,
) {
  return new Date(
    getOfficeStartDateTime(attendanceDate, settings).getTime() +
      settings.officeGracePeriodMinutes * 60000,
  );
}

function evaluateCheckInPolicy(input: {
  attendanceDate: string;
  checkIn: string;
  attendanceType: AttendanceType | null | undefined;
  settings: AttendanceSettingsValues;
}): CheckInPolicyResult {
  if (input.attendanceType !== "office") {
    return {
      lateMinutes: 0,
      status: "present",
      officeStartTimeSnapshot: null,
      officeGracePeriodMinutesSnapshot: null,
    };
  }

  const checkInTime = new Date(input.checkIn).getTime();
  const earlyCheckInOpensAt = getEarlyCheckInDateTime(
    input.attendanceDate,
    input.settings,
  ).getTime();

  if (checkInTime < earlyCheckInOpensAt) {
    throw new Error(
      `Office check-in opens at ${formatAppTime(getEarlyCheckInDateTime(input.attendanceDate, input.settings))}.`,
    );
  }

  const lateThresholdTime = getLateThresholdDateTime(
    input.attendanceDate,
    input.settings,
  ).getTime();
  const lateMinutes = Math.max(
    Math.floor((checkInTime - lateThresholdTime) / 60000),
    0,
  );

  return {
    lateMinutes,
    status: lateMinutes > 0 ? "late" : "present",
    officeStartTimeSnapshot: input.settings.officeStartTime,
    officeGracePeriodMinutesSnapshot: input.settings.officeGracePeriodMinutes,
  };
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
  const context = await requireCurrentEmployeeContext();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_id, name, company_id, status, work_mode")
    .eq("id", context.id)
    .eq("company_id", context.companyId)
    .single();

  if (error || !data || data.status !== "active") {
    redirect("/login");
  }

  return data;
}

async function getActiveCompanyId() {
  try {
    return await requireCurrentCompanyId();
  } catch (error) {
    console.error("[AttendanceService] Unable to load current company.", error);
    throw new Error("Unable to load company information.");
  }
}

export const AttendanceService = {
  async getTodayAttendance(): Promise<TodayAttendance> {
    const employee = await getCurrentEmployee();
    const today = getTodayDate();
    const [record, policy] = await Promise.all([
      AttendanceRepository.findByEmployeeDate(employee.id, today),
      AttendancePolicyService.getSummary(employee.company_id, employee.id),
    ]);

    return {
      date: today,
      companyId: employee.company_id,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeCode: employee.employee_id,
      workMode: employee.work_mode,
      record,
      policy,
    };
  },

  async getAdminOverview(companyIdOverride?: string): Promise<AdminAttendanceOverview> {
    const companyId = companyIdOverride ?? (await getActiveCompanyId());
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
    const employee = await getCurrentEmployee();
    const attendanceDate = getTodayDate();
    const policySettings = await AttendancePolicyService.getSettings(
      employee.company_id,
    );
    const result = await AttendancePolicyService.validateForWorkMode(
      employee.company_id,
      employee.id,
      employee.work_mode,
      _input.gps,
      policySettings,
    );
    evaluateCheckInPolicy({
      attendanceDate,
      checkIn: new Date().toISOString(),
      attendanceType: result.attendanceType,
      settings: policySettings,
    });

    return result;
  },

  async prepareCheckOut(_input: AttendanceCheckInput = {}) {
    const employee = await getCurrentEmployee();
    const result = await AttendancePolicyService.validateForWorkMode(
      employee.company_id,
      employee.id,
      employee.work_mode,
      _input.gps,
    );

    return result;
  },

  async checkIn(input: AttendanceCheckInput = {}) {
    const employee = await getCurrentEmployee();
    const serverTimestamp = new Date().toISOString();
    const attendanceDate = getDateFromTimestamp(serverTimestamp);
    const calendarInfo = await CalendarService.getDateInfo(
      employee.company_id,
      attendanceDate,
    );

    if (calendarInfo.status === "holiday") {
      throw new Error("Today is marked as a non-working holiday.");
    }

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

    const policySettings = await AttendancePolicyService.getSettings(
      employee.company_id,
    );
    const policyValidation = await AttendancePolicyService.validateForWorkMode(
      employee.company_id,
      employee.id,
      employee.work_mode,
      input.gps,
      policySettings,
    );

    if (policySettings.requireSelfie && !input.selfiePath) {
      throw new Error("Attendance selfie is required before check-in.");
    }

    const attendanceType = policyValidation.attendanceType ?? "office";
    const checkInPolicy = evaluateCheckInPolicy({
      attendanceDate,
      checkIn: serverTimestamp,
      attendanceType,
      settings: policySettings,
    });
    const reverseGeocode = policyValidation.gps
      ? await AttendanceReverseGeocodeService.reverseLookup({
          latitude: policyValidation.gps.latitude,
          longitude: policyValidation.gps.longitude,
        })
      : { address: null };
    const gpsWithAddress = policyValidation.gps
      ? {
          ...policyValidation.gps,
          address: input.gps?.address ?? reverseGeocode.address ?? null,
        }
      : null;
    const record = await AttendanceRepository.createCheckIn({
      companyId: employee.company_id,
      employeeId: employee.id,
      attendanceDate,
      checkIn: serverTimestamp,
      status: checkInPolicy.status,
      lateMinutes: checkInPolicy.lateMinutes,
      officeStartTimeSnapshot: checkInPolicy.officeStartTimeSnapshot,
      officeGracePeriodMinutesSnapshot:
        checkInPolicy.officeGracePeriodMinutesSnapshot,
      notes: input.notes?.trim() || null,
      gps: gpsWithAddress,
      locationId: policyValidation.location?.id ?? null,
      distanceMeters: policyValidation.distanceMeters ?? null,
      workMode: employee.work_mode,
      attendanceType,
      selfiePath: input.selfiePath ?? null,
      deviceInfo: input.deviceInfo ?? null,
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
        attendanceMode: getAttendancePolicyOption(policySettings.attendanceMode)
          .label,
        workMode: employee.work_mode,
        attendanceType,
        officeStartTimeSnapshot: checkInPolicy.officeStartTimeSnapshot,
        officeGracePeriodMinutesSnapshot:
          checkInPolicy.officeGracePeriodMinutesSnapshot,
        lateMinutes: checkInPolicy.lateMinutes,
        checkInStatus: checkInPolicy.status,
        gpsLocationName: policyValidation.location?.name ?? null,
        gpsAddress: gpsWithAddress?.address ?? null,
        selfiePath: input.selfiePath ?? null,
        gpsDistanceMeters:
          typeof policyValidation.distanceMeters === "number"
            ? Math.round(policyValidation.distanceMeters)
            : null,
        gpsAccuracyMeters: policyValidation.gps?.accuracy ?? null,
      },
    });

    await NotificationService.create({
      companyId: employee.company_id,
      employeeId: employee.id,
      type: "attendance",
      title: "Attendance completed",
      message: `Check-in recorded for ${attendanceDate}.`,
      actionUrl: "/attendance",
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

    const policySettings = await AttendancePolicyService.getSettings(
      employee.company_id,
    );
    const policyValidation = await AttendancePolicyService.validateForWorkMode(
      employee.company_id,
      employee.id,
      employee.work_mode,
      input.gps,
      policySettings,
    );
    const reverseGeocode = policyValidation.gps
      ? await AttendanceReverseGeocodeService.reverseLookup({
          latitude: policyValidation.gps.latitude,
          longitude: policyValidation.gps.longitude,
        })
      : { address: null };
    const gpsWithAddress = policyValidation.gps
      ? {
          ...policyValidation.gps,
          address: input.gps?.address ?? reverseGeocode.address ?? null,
        }
      : null;
    const workingMinutes = getWorkingMinutes(record.checkIn, serverTimestamp);
    const updatedRecord = await AttendanceRepository.updateCheckOut({
      id: record.id,
      checkOut: serverTimestamp,
      workingMinutes,
      status: getCheckOutStatus(record, workingMinutes),
      gps: gpsWithAddress,
      locationId: policyValidation.location?.id ?? null,
      distanceMeters: policyValidation.distanceMeters ?? null,
      workMode: record.workMode ?? employee.work_mode,
      attendanceType: record.attendanceType ?? policyValidation.attendanceType,
      selfiePath: input.selfiePath ?? null,
      deviceInfo: input.deviceInfo ?? null,
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
        attendanceMode: getAttendancePolicyOption(policySettings.attendanceMode)
          .label,
        workMode: employee.work_mode,
        attendanceType: record.attendanceType ?? policyValidation.attendanceType ?? "office",
        gpsLocationName: policyValidation.location?.name ?? null,
        gpsAddress: gpsWithAddress?.address ?? null,
        selfiePath: input.selfiePath ?? null,
        gpsDistanceMeters:
          typeof policyValidation.distanceMeters === "number"
            ? Math.round(policyValidation.distanceMeters)
            : null,
        gpsAccuracyMeters: policyValidation.gps?.accuracy ?? null,
      },
    });

    await NotificationService.create({
      companyId: employee.company_id,
      employeeId: employee.id,
      type: "attendance",
      title: "Attendance completed",
      message: `Check-out recorded for ${attendanceDate}.`,
      actionUrl: "/attendance",
    });

    return updatedRecord;
  },

  async getAttendanceDetail(id: string) {
    const companyId = await getActiveCompanyId();
    const record = await AttendanceRepository.findDetailById(id, companyId);

    if (!record) {
      return null;
    }

    const [checkInSelfieUrl, checkOutSelfieUrl] = await Promise.all([
      record.checkInSelfiePath
        ? AttendanceSelfieService.getSignedUrl(record.checkInSelfiePath)
        : Promise.resolve(null),
      record.checkOutSelfiePath
        ? AttendanceSelfieService.getSignedUrl(record.checkOutSelfiePath)
        : Promise.resolve(null),
    ]);

    return {
      ...record,
      checkInSelfieUrl,
      checkOutSelfieUrl,
    };
  },
};
