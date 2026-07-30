import "server-only";

import { ATTENDANCE_RULES } from "@/features/attendance/constants/attendance-options";
import type {
  AttendanceRecord,
  AttendanceSettingsValues,
  AttendanceType,
} from "@/features/attendance/types/attendance.types";
import { formatAppTime, getAppDateTime } from "@/lib/datetime";

export type CheckInPolicyResult = {
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

export const AttendanceWorkflowValidationService = {
  evaluateCheckInPolicy(input: {
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
  },

  getWorkingMinutes(checkIn: string, checkOut: string) {
    return Math.max(
      Math.floor(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000,
      ),
      0,
    );
  },

  getCheckOutStatus(record: AttendanceRecord, workingMinutes: number) {
    if (workingMinutes < ATTENDANCE_RULES.halfDayWorkingMinutes) {
      return "half_day" as const;
    }

    return record.lateMinutes > 0 ? ("late" as const) : ("present" as const);
  },
};
