"use client";

import { Fragment, useState } from "react";
import { ChevronDown, LoaderCircle } from "lucide-react";

import type {
  AttendanceReportDetailsResult,
  AttendanceReportFilters,
  AttendanceReportRow,
} from "@/features/attendance-reports/types/attendance-report.types";
import { EmployeeWorkModeBadge } from "@/features/employees/ui/employee-work-mode-badge";
import { cn } from "@/lib/utils";

type AttendanceReportTableProps = {
  rows: AttendanceReportRow[];
  filters: AttendanceReportFilters;
};

function toQueryString(filters: AttendanceReportFilters, employeeId: string) {
  const params = new URLSearchParams();

  if (filters.roleId) {
    params.set("roleId", filters.roleId);
  }

  if (filters.employeeId) {
    params.set("employeeId", filters.employeeId);
  }

  if (filters.attendanceMode !== "all") {
    params.set("attendanceMode", filters.attendanceMode);
  }

  if (filters.workMode !== "all") {
    params.set("workMode", filters.workMode);
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  params.set("month", String(filters.month));
  params.set("year", String(filters.year));

  if (filters.startDate) {
    params.set("startDate", filters.startDate);
  }

  if (filters.endDate) {
    params.set("endDate", filters.endDate);
  }

  params.set("employeeId", employeeId);

  return params.toString();
}

export function AttendanceReportTable({
  rows,
  filters,
}: AttendanceReportTableProps) {
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(
    null,
  );
  const [loadingEmployeeId, setLoadingEmployeeId] = useState<string | null>(
    null,
  );
  const [detailsByEmployeeId, setDetailsByEmployeeId] = useState<
    Record<string, AttendanceReportDetailsResult | undefined>
  >({});

  async function toggleRow(employeeId: string) {
    if (expandedEmployeeId === employeeId) {
      setExpandedEmployeeId(null);
      return;
    }

    setExpandedEmployeeId(employeeId);

    if (detailsByEmployeeId[employeeId]) {
      return;
    }

    setLoadingEmployeeId(employeeId);

    try {
      const response = await fetch(
        `/admin/attendance/reports/details?${toQueryString(filters, employeeId)}`,
      );

      if (!response.ok) {
        throw new Error("Unable to load employee attendance details.");
      }

      const detail = (await response.json()) as AttendanceReportDetailsResult;

      setDetailsByEmployeeId((current) => ({
        ...current,
        [employeeId]: detail,
      }));
    } catch (error) {
      console.error(
        "[AttendanceReportTable] Unable to load employee details.",
        error,
      );
      setDetailsByEmployeeId((current) => ({
        ...current,
        [employeeId]: {
          employeeId,
          employeeCode: "",
          employeeName: "",
          dailyItems: [],
        },
      }));
    } finally {
      setLoadingEmployeeId(null);
    }
  }

  return (
    <div className="app-table-shell">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Work Mode</th>
              <th className="px-4 py-3 font-medium">Present</th>
              <th className="px-4 py-3 font-medium">Absent</th>
              <th className="px-4 py-3 font-medium">Late</th>
              <th className="px-4 py-3 font-medium">Leave</th>
              <th className="px-4 py-3 font-medium">Remote</th>
              <th className="px-4 py-3 font-medium">Weekend</th>
              <th className="px-4 py-3 font-medium">Holiday</th>
              <th className="px-4 py-3 font-medium">Working Hours</th>
              <th className="px-4 py-3 font-medium">Avg In</th>
              <th className="px-4 py-3 font-medium">Avg Out</th>
              <th className="px-4 py-3 font-medium">Attendance %</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => {
              const isExpanded = expandedEmployeeId === row.employeeId;
              const detail = detailsByEmployeeId[row.employeeId];
              const isLoading = loadingEmployeeId === row.employeeId;

              return (
                <Fragment key={row.employeeId}>
                  <tr>
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.employeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.employeeCode}
                      </p>
                    </td>
                    <td className="px-4 py-3">{row.roleName}</td>
                    <td className="px-4 py-3">
                      <EmployeeWorkModeBadge workMode={row.workMode} />
                    </td>
                    <td className="px-4 py-3">{row.presentDays}</td>
                    <td className="px-4 py-3">{row.absentDays}</td>
                    <td className="px-4 py-3">{row.lateDays}</td>
                    <td className="px-4 py-3">{row.leaveDays}</td>
                    <td className="px-4 py-3">{row.remoteDays}</td>
                    <td className="px-4 py-3">{row.weekendDays}</td>
                    <td className="px-4 py-3">{row.holidayDays}</td>
                    <td className="px-4 py-3">{row.totalWorkingHoursLabel}</td>
                    <td className="px-4 py-3">{row.averageCheckIn ?? "--"}</td>
                    <td className="px-4 py-3">{row.averageCheckOut ?? "--"}</td>
                    <td className="px-4 py-3">{row.attendancePercentage}%</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleRow(row.employeeId)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-muted"
                      >
                        <ChevronDown
                          className={cn(
                            "size-4 transition",
                            isExpanded ? "rotate-180" : "",
                          )}
                          aria-hidden="true"
                        />
                        Expand
                      </button>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr>
                      <td colSpan={15} className="bg-background/60 px-4 py-4">
                        {isLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <LoaderCircle className="size-4 animate-spin" />
                            Loading daily attendance...
                          </div>
                        ) : detail?.dailyItems.length ? (
                          <div className="overflow-x-auto rounded-2xl border border-white/20">
                            <table className="min-w-full text-left text-xs">
                              <thead className="border-b bg-muted/50 uppercase text-muted-foreground">
                                <tr>
                                  <th className="px-3 py-2 font-medium">Date</th>
                                  <th className="px-3 py-2 font-medium">Check-in</th>
                                  <th className="px-3 py-2 font-medium">Check-out</th>
                                  <th className="px-3 py-2 font-medium">Working Hours</th>
                                  <th className="px-3 py-2 font-medium">Status</th>
                                  <th className="px-3 py-2 font-medium">Work Mode</th>
                                  <th className="px-3 py-2 font-medium">Type</th>
                                  <th className="px-3 py-2 font-medium">Late</th>
                                  <th className="px-3 py-2 font-medium">Office</th>
                                  <th className="px-3 py-2 font-medium">Address</th>
                                  <th className="px-3 py-2 font-medium">Coordinates</th>
                                  <th className="px-3 py-2 font-medium">Distance</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {detail.dailyItems.map((item) => (
                                  <tr key={`${detail.employeeId}-${item.date}`}>
                                    <td className="px-3 py-2">{item.date}</td>
                                    <td className="px-3 py-2">{item.checkIn ?? "--"}</td>
                                    <td className="px-3 py-2">{item.checkOut ?? "--"}</td>
                                    <td className="px-3 py-2">{item.workingHoursLabel}</td>
                                    <td className="px-3 py-2 capitalize">
                                      {item.status.replaceAll("_", " ")}
                                    </td>
                                    <td className="px-3 py-2">
                                      <EmployeeWorkModeBadge workMode={item.workMode} />
                                    </td>
                                    <td className="px-3 py-2 capitalize">
                                      {item.attendanceType?.replaceAll("_", " ") ?? "--"}
                                    </td>
                                    <td className="px-3 py-2">{item.lateMinutes}</td>
                                    <td className="px-3 py-2">{item.office}</td>
                                    <td className="px-3 py-2">
                                      {item.checkInAddress ?? "--"}
                                    </td>
                                    <td className="px-3 py-2">
                                      {item.checkInLatitude !== null &&
                                      item.checkInLongitude !== null
                                        ? `${item.checkInLatitude.toFixed(6)}, ${item.checkInLongitude.toFixed(6)}`
                                        : "--"}
                                    </td>
                                    <td className="px-3 py-2">{item.distanceLabel}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No daily attendance details were found for this employee.
                          </p>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
