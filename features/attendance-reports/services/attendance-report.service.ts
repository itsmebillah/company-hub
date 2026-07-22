import "server-only";

import { getAttendancePolicyOption } from "@/features/attendance/constants/attendance-policy-options";
import { requireRole } from "@/features/auth/services/authorization.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { AttendanceReportRepository } from "@/features/attendance-reports/repositories/attendance-report.repository";
import type {
  AttendanceReportDailyDetail,
  AttendanceReportDetailsResult,
  AttendanceReportEmployeeOption,
  AttendanceReportFilters,
  AttendanceReportModeFilter,
  AttendanceReportPageData,
  AttendanceReportRange,
  AttendanceReportRow,
  AttendanceReportStatusFilter,
  AttendanceReportSummary,
  AttendanceReportWorkModeFilter,
} from "@/features/attendance-reports/types/attendance-report.types";
import {
  formatAppDate,
  formatAppDateTime,
  formatAppTime,
  getAppTimeZone,
  shiftAppDateString,
} from "@/lib/datetime";
import { ROLE_NAMES } from "@/lib/auth/permissions";
import { formatTimeValueLabel } from "@/features/attendance/utils/working-hours";

const REPORT_ACCESS_ROLES = [ROLE_NAMES.companyAdmin, "HR"] as const;

type AttendanceReportDataset = {
  pageData: AttendanceReportPageData;
  detailsByEmployeeId: Map<string, AttendanceReportDetailsResult>;
  companyLogo: string | null;
};

function getMonthName(month: number) {
  return formatAppDate(new Date(Date.UTC(2026, month - 1, 1)), {
    month: "long",
    timeZone: getAppTimeZone(),
  });
}

function clampMonth(value: number) {
  return Math.min(Math.max(value, 1), 12);
}

function parsePositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseStatusFilter(value: string | undefined): AttendanceReportStatusFilter {
  if (
    value === "present" ||
    value === "late" ||
    value === "half_day" ||
    value === "leave" ||
    value === "weekend" ||
    value === "holiday" ||
    value === "absent"
  ) {
    return value;
  }

  return "all";
}

function parseModeFilter(value: string | undefined): AttendanceReportModeFilter {
  if (
    value === "office" ||
    value === "remote" ||
    value === "hybrid"
  ) {
    return value;
  }

  return "all";
}

function parseWorkModeFilter(value: string | undefined): AttendanceReportWorkModeFilter {
  if (value === "office" || value === "field" || value === "hybrid") {
    return value;
  }

  return "all";
}

function isValidDateInput(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function toDateRange(filters: AttendanceReportFilters): AttendanceReportRange {
  if (filters.startDate && filters.endDate) {
    return {
      startDate: filters.startDate,
      endDate: filters.endDate,
      month: filters.month,
      year: filters.year,
      usesCustomRange: true,
      label: `${formatAppDate(`${filters.startDate}T00:00:00+06:00`)} - ${formatAppDate(
        `${filters.endDate}T00:00:00+06:00`,
      )}`,
    };
  }

  const startDate = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;
  const nextMonth =
    filters.month === 12
      ? `${filters.year + 1}-01-01`
      : `${filters.year}-${String(filters.month + 1).padStart(2, "0")}-01`;
  const endDate = shiftAppDateString(nextMonth, -1);

  return {
    startDate,
    endDate,
    month: filters.month,
    year: filters.year,
    usesCustomRange: false,
    label: `${getMonthName(filters.month)} ${filters.year}`,
  };
}

function listDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    dates.push(cursor);
    cursor = shiftAppDateString(cursor, 1);
  }

  return dates;
}

function formatMinutes(minutes: number) {
  if (minutes <= 0) {
    return "0h 0m";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function formatDistance(value: number | null) {
  if (value === null) {
    return "--";
  }

  return `${Math.round(value)}m`;
}

function formatPercent(value: number) {
  return Math.round(value * 10) / 10;
}

function getWeekdayName(date: string) {
  return formatAppDate(`${date}T00:00:00+06:00`, {
    weekday: "long",
  });
}

function getTimeOfDayMinutes(value: string | null) {
  if (!value) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: getAppTimeZone(),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const hour = Number.parseInt(
    parts.find((part) => part.type === "hour")?.value ?? "",
    10,
  );
  const minute = Number.parseInt(
    parts.find((part) => part.type === "minute")?.value ?? "",
    10,
  );

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return hour * 60 + minute;
}

function formatAverageTime(minutes: number | null) {
  if (minutes === null) {
    return null;
  }

  const safeMinutes = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${normalizedHours}:${String(remainingMinutes).padStart(2, "0")} ${period}`;
}

function buildFilters(
  companyId: string,
  input: Record<string, string | string[] | undefined>,
): AttendanceReportFilters {
  const today = new Date();
  const month = clampMonth(parsePositiveNumber(String(input.month ?? ""), today.getUTCMonth() + 1));
  const year = parsePositiveNumber(String(input.year ?? ""), today.getUTCFullYear());
  const startDate = isValidDateInput(String(input.startDate ?? ""))
    ? String(input.startDate)
    : null;
  const endDate = isValidDateInput(String(input.endDate ?? ""))
    ? String(input.endDate)
    : null;

  return {
    companyId,
    department: String(input.department ?? ""),
    roleId: String(input.roleId ?? ""),
    employeeId: String(input.employeeId ?? ""),
    attendanceMode: parseModeFilter(String(input.attendanceMode ?? "")),
    workMode: parseWorkModeFilter(String(input.workMode ?? "")),
    status: parseStatusFilter(String(input.status ?? "")),
    month,
    year,
    startDate,
    endDate,
  };
}

function matchesRowFilters(
  row: AttendanceReportRow,
  status: AttendanceReportStatusFilter,
  attendanceMode: AttendanceReportModeFilter,
) {
  const statusMatch =
    status === "all"
      ? true
      : status === "present"
        ? row.presentDays > 0
        : status === "late"
          ? row.lateDays > 0
          : status === "leave"
            ? row.leaveDays > 0
            : status === "weekend"
              ? row.weekendDays > 0
              : status === "holiday"
                ? row.holidayDays > 0
                : status === "half_day"
                  ? row.halfDayDays > 0
                  : row.absentDays > 0;
  const modeMatch =
    attendanceMode === "all"
      ? true
      : attendanceMode === "remote"
        ? row.remoteDays > 0
        : attendanceMode === "hybrid"
          ? row.hybridDays > 0
          : row.attendanceDays - row.remoteDays > 0;

  return statusMatch && modeMatch;
}

async function requireReportAccess() {
  const profile = await requireRole(REPORT_ACCESS_ROLES);

  if (!profile || profile.status !== "active") {
    return null;
  }

  return profile;
}

async function buildDataset(
  filters: AttendanceReportFilters,
  options: {
    employeeId?: string;
  } = {},
): Promise<AttendanceReportDataset> {
  const session = await getCurrentSessionProfile();

  if (!session || session.status !== "active") {
    throw new Error("You must be signed in to view attendance reports.");
  }

  if (!REPORT_ACCESS_ROLES.includes(session.roleName as (typeof REPORT_ACCESS_ROLES)[number])) {
    throw new Error("You do not have permission to access attendance reports.");
  }

  const range = toDateRange(filters);
  const context = await AttendanceReportRepository.getCompanyContext(
    session.companyId,
  );
  const rolesById = new Map(context.roles.map((role) => [role.id, role.name]));
  const employees = context.employees
    .filter((employee) =>
      filters.roleId ? employee.role_id === filters.roleId : true,
    )
    .filter((employee) =>
      filters.workMode !== "all" ? employee.work_mode === filters.workMode : true,
    )
    .filter((employee) =>
      options.employeeId || filters.employeeId
        ? employee.id === (options.employeeId ?? filters.employeeId)
        : true,
    );
  const employeeOptions: AttendanceReportEmployeeOption[] = context.employees.map(
    (employee) => ({
      id: employee.id,
      employeeId: employee.employee_id,
      name: employee.name,
      roleId: employee.role_id,
      roleName: rolesById.get(employee.role_id) ?? "Unknown",
      workMode: employee.work_mode,
    }),
  );
    const [attendanceRecords, leaveRows, holidayRows] = await Promise.all([
      AttendanceReportRepository.getAttendanceRecords({
        companyId: session.companyId,
        startDate: range.startDate,
        endDate: range.endDate,
        employeeId: options.employeeId ?? filters.employeeId ?? undefined,
      }),
      AttendanceReportRepository.getApprovedLeaveRows({
        companyId: session.companyId,
        startDate: range.startDate,
        endDate: range.endDate,
        employeeId: options.employeeId ?? filters.employeeId ?? undefined,
      }),
    AttendanceReportRepository.getHolidayRows({
      companyId: session.companyId,
      startDate: range.startDate,
      endDate: range.endDate,
    }),
  ]);
  const dates = listDates(range.startDate, range.endDate);
  const workingDays = new Set(context.settings?.working_days ?? [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
  ]);
  const holidayMap = new Map(
    holidayRows.map((row) => [
      row.date,
      {
        title: row.title,
        isWorkingDay: row.isWorkingDay,
      },
    ]),
  );
  const leaveDateKeys = new Set<string>();

  for (const leaveRow of leaveRows) {
    let cursor = leaveRow.startDate < range.startDate ? range.startDate : leaveRow.startDate;
    const boundary = leaveRow.endDate > range.endDate ? range.endDate : leaveRow.endDate;

    while (cursor <= boundary) {
      leaveDateKeys.add(`${leaveRow.employeeId}:${cursor}`);
      cursor = shiftAppDateString(cursor, 1);
    }
  }

  const attendanceMap = new Map<string, (typeof attendanceRecords)[number]>();

  for (const record of attendanceRecords) {
    attendanceMap.set(`${record.employeeId}:${record.attendanceDate}`, record);
  }

  const detailsByEmployeeId = new Map<string, AttendanceReportDetailsResult>();
  const rows: AttendanceReportRow[] = [];
  const companyWorkingDays = dates.reduce((count, date) => {
    const holiday = holidayMap.get(date);

    if (holiday && !holiday.isWorkingDay) {
      return count;
    }

    if (holiday?.isWorkingDay) {
      return count + 1;
    }

    return workingDays.has(getWeekdayName(date)) ? count + 1 : count;
  }, 0);

  for (const employee of employees) {
    const row: AttendanceReportRow = {
      employeeId: employee.id,
      employeeCode: employee.employee_id,
      employeeName: employee.name,
      roleId: employee.role_id,
      roleName: rolesById.get(employee.role_id) ?? "Unknown",
      workMode: employee.work_mode,
      departmentName: null,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      leaveDays: 0,
      remoteDays: 0,
      weekendDays: 0,
      holidayDays: 0,
      totalWorkingMinutes: 0,
      totalWorkingHoursLabel: "0h 0m",
      averageCheckIn: null,
      averageCheckOut: null,
      attendancePercentage: 0,
      halfDayDays: 0,
      hybridDays: 0,
      attendanceDays: 0,
    };
    const dailyItems: AttendanceReportDailyDetail[] = [];
    const joiningDate = employee.joining_date;
    let checkInMinutesTotal = 0;
    let checkInMinutesCount = 0;
    let checkOutMinutesTotal = 0;
    let checkOutMinutesCount = 0;
    let eligibleWorkingDays = 0;

    for (const date of dates) {
      if (joiningDate && date < joiningDate) {
        continue;
      }

      const holiday = holidayMap.get(date);
      const isWorkingDay = holiday?.isWorkingDay
        ? true
        : holiday && !holiday.isWorkingDay
          ? false
          : workingDays.has(getWeekdayName(date));
      const record = attendanceMap.get(`${employee.id}:${date}`);
      const onLeave = leaveDateKeys.has(`${employee.id}:${date}`);

      if (holiday && !holiday.isWorkingDay) {
        row.holidayDays += 1;
        dailyItems.push({
          date,
          officeStartTime: null,
          checkIn: null,
          checkOut: null,
          workingHoursLabel: "--",
          status: "holiday",
          workMode: employee.work_mode,
          lateMinutes: 0,
          office: holiday.title,
          attendanceType: null,
          checkInAddress: null,
          checkOutAddress: null,
          checkInLatitude: null,
          checkInLongitude: null,
          checkInAccuracyMeters: null,
          checkInDeviceBrowser: null,
          checkInDevicePlatform: null,
          checkOutLatitude: null,
          checkOutLongitude: null,
          checkOutAccuracyMeters: null,
          checkOutDeviceBrowser: null,
          checkOutDevicePlatform: null,
          distanceLabel: "--",
          locationSource: null,
        });
        continue;
      }

      if (!isWorkingDay) {
        row.weekendDays += 1;
        dailyItems.push({
          date,
          officeStartTime: null,
          checkIn: null,
          checkOut: null,
          workingHoursLabel: "--",
          status: "weekend",
          workMode: employee.work_mode,
          lateMinutes: 0,
          office: "Weekend",
          attendanceType: null,
          checkInAddress: null,
          checkOutAddress: null,
          checkInLatitude: null,
          checkInLongitude: null,
          checkInAccuracyMeters: null,
          checkInDeviceBrowser: null,
          checkInDevicePlatform: null,
          checkOutLatitude: null,
          checkOutLongitude: null,
          checkOutAccuracyMeters: null,
          checkOutDeviceBrowser: null,
          checkOutDevicePlatform: null,
          distanceLabel: "--",
          locationSource: null,
        });
        continue;
      }

      if (onLeave) {
        row.leaveDays += 1;
        dailyItems.push({
          date,
          officeStartTime: null,
          checkIn: null,
          checkOut: null,
          workingHoursLabel: "--",
          status: "leave",
          workMode: employee.work_mode,
          lateMinutes: 0,
          office: "Approved leave",
          attendanceType: null,
          checkInAddress: null,
          checkOutAddress: null,
          checkInLatitude: null,
          checkInLongitude: null,
          checkInAccuracyMeters: null,
          checkInDeviceBrowser: null,
          checkInDevicePlatform: null,
          checkOutLatitude: null,
          checkOutLongitude: null,
          checkOutAccuracyMeters: null,
          checkOutDeviceBrowser: null,
          checkOutDevicePlatform: null,
          distanceLabel: "--",
          locationSource: null,
        });
        continue;
      }

      eligibleWorkingDays += 1;

      if (!record) {
        row.absentDays += 1;
        dailyItems.push({
          date,
          officeStartTime: null,
          checkIn: null,
          checkOut: null,
          workingHoursLabel: "--",
          status: "absent",
          workMode: employee.work_mode,
          lateMinutes: 0,
          office: "Absent",
          attendanceType: null,
          checkInAddress: null,
          checkOutAddress: null,
          checkInLatitude: null,
          checkInLongitude: null,
          checkInAccuracyMeters: null,
          checkInDeviceBrowser: null,
          checkInDevicePlatform: null,
          checkOutLatitude: null,
          checkOutLongitude: null,
          checkOutAccuracyMeters: null,
          checkOutDeviceBrowser: null,
          checkOutDevicePlatform: null,
          distanceLabel: "--",
          locationSource: null,
        });
        continue;
      }

      row.attendanceDays += 1;
      row.totalWorkingMinutes += record.workingMinutes;

      if (record.status === "late") {
        row.lateDays += 1;
      } else if (record.status === "half_day") {
        row.halfDayDays += 1;
        row.presentDays += 1;
      } else if (record.status === "present") {
        row.presentDays += 1;
      } else if (record.status === "leave") {
        row.leaveDays += 1;
      } else if (record.status === "holiday") {
        row.holidayDays += 1;
      } else if (record.status === "weekend") {
        row.weekendDays += 1;
      }

      if (record.attendanceType === "field" || !record.checkInLocationName) {
        row.remoteDays += 1;
      }

      if (record.attendanceType === "hybrid" || record.checkInLocationSource === "hybrid") {
        row.hybridDays += 1;
      }

      const checkInMinutes = getTimeOfDayMinutes(record.checkIn);
      const checkOutMinutes = getTimeOfDayMinutes(record.checkOut);

      if (checkInMinutes !== null) {
        checkInMinutesTotal += checkInMinutes;
        checkInMinutesCount += 1;
      }

      if (checkOutMinutes !== null) {
        checkOutMinutesTotal += checkOutMinutes;
        checkOutMinutesCount += 1;
      }

      dailyItems.push({
        date,
        officeStartTime: record.officeStartTimeSnapshot
          ? formatTimeValueLabel(record.officeStartTimeSnapshot)
          : null,
        checkIn: record.checkIn ? formatAppTime(record.checkIn) : null,
        checkOut: record.checkOut ? formatAppTime(record.checkOut) : null,
        workingHoursLabel:
          record.workingMinutes > 0 ? formatMinutes(record.workingMinutes) : "--",
        status: record.status,
        workMode: record.workMode ?? employee.work_mode,
        lateMinutes: record.lateMinutes,
        office: record.checkInLocationName ?? "Remote",
        attendanceType: record.attendanceType,
        checkInAddress: record.checkInAddress,
        checkOutAddress: record.checkOutAddress,
        checkInLatitude: record.checkInLatitude,
        checkInLongitude: record.checkInLongitude,
        checkInAccuracyMeters: record.checkInAccuracyMeters,
        checkInDeviceBrowser: record.checkInDeviceBrowser,
        checkInDevicePlatform: record.checkInDevicePlatform,
        checkOutLatitude: record.checkOutLatitude,
        checkOutLongitude: record.checkOutLongitude,
        checkOutAccuracyMeters: record.checkOutAccuracyMeters,
        checkOutDeviceBrowser: record.checkOutDeviceBrowser,
        checkOutDevicePlatform: record.checkOutDevicePlatform,
        distanceLabel: formatDistance(record.checkInDistanceMeters),
        locationSource: record.checkInLocationSource,
      });
    }

    row.totalWorkingHoursLabel = formatMinutes(row.totalWorkingMinutes);
    row.averageCheckIn =
      checkInMinutesCount > 0
        ? formatAverageTime(Math.round(checkInMinutesTotal / checkInMinutesCount))
        : null;
    row.averageCheckOut =
      checkOutMinutesCount > 0
        ? formatAverageTime(Math.round(checkOutMinutesTotal / checkOutMinutesCount))
        : null;
    row.attendancePercentage =
      eligibleWorkingDays > 0
        ? formatPercent(
            ((row.presentDays + row.lateDays + row.halfDayDays) /
              eligibleWorkingDays) *
              100,
          )
        : 0;

    detailsByEmployeeId.set(employee.id, {
      employeeId: employee.id,
      employeeCode: employee.employee_id,
      employeeName: employee.name,
      dailyItems,
    });
    rows.push(row);
  }

  const filteredRows = rows.filter((row) =>
    matchesRowFilters(row, filters.status, filters.attendanceMode),
  );
  const summary: AttendanceReportSummary = {
    totalEmployees: filteredRows.length,
    present: filteredRows.reduce((sum, row) => sum + row.presentDays, 0),
    absent: filteredRows.reduce((sum, row) => sum + row.absentDays, 0),
    late: filteredRows.reduce((sum, row) => sum + row.lateDays, 0),
    onLeave: filteredRows.reduce((sum, row) => sum + row.leaveDays, 0),
    remote: filteredRows.reduce((sum, row) => sum + row.remoteDays, 0),
    hybrid: filteredRows.reduce((sum, row) => sum + row.hybridDays, 0),
    workingDays: companyWorkingDays,
    averageWorkingHoursLabel:
      filteredRows.reduce((sum, row) => sum + row.attendanceDays, 0) > 0
        ? formatMinutes(
            Math.round(
              filteredRows.reduce((sum, row) => sum + row.totalWorkingMinutes, 0) /
                Math.max(
                  filteredRows.reduce((sum, row) => sum + row.attendanceDays, 0),
                  1,
                ),
            ),
          )
        : "0h 0m",
  };

  return {
    pageData: {
      company: {
        id: context.company.id,
        name: context.settings?.company_name ?? context.company.name,
      },
      companies: [
        {
          id: context.company.id,
          name: context.settings?.company_name ?? context.company.name,
        },
      ],
      roles: context.roles,
      employees: employeeOptions,
      filters,
      range,
      generatedAt: formatAppDateTime(new Date()),
      generatedBy: session.name,
      attendanceModeLabel: getAttendancePolicyOption(
        context.settings?.attendance_mode ?? "company_location",
      ).label,
      summary,
      rows: filteredRows,
    },
    detailsByEmployeeId,
    companyLogo: context.settings?.company_logo ?? null,
  };
}

export const AttendanceReportService = {
  async getAccessProfile() {
    return requireReportAccess();
  },

  async getPageData(searchParams: Record<string, string | string[] | undefined>) {
    const profile = await requireReportAccess();

    if (!profile) {
      return null;
    }

    const filters = buildFilters(profile.companyId, searchParams);

    return buildDataset(filters);
  },

  async getDetails(
    searchParams: Record<string, string | string[] | undefined>,
    employeeId: string,
  ) {
    const profile = await requireReportAccess();

    if (!profile) {
      return null;
    }

    const filters = buildFilters(profile.companyId, searchParams);
    const dataset = await buildDataset(filters, { employeeId });

    return dataset.detailsByEmployeeId.get(employeeId) ?? null;
  },

  async getExportDataset(
    searchParams: Record<string, string | string[] | undefined>,
  ) {
    const profile = await requireReportAccess();

    if (!profile) {
      return null;
    }

    const filters = buildFilters(profile.companyId, searchParams);

    return buildDataset(filters);
  },
};
