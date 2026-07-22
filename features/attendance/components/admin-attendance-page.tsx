import Link from "next/link";
import { CalendarCheck, Clock, FileSpreadsheet, Search, Users } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { IconBadge } from "@/components/common/icon-badge";
import { PageHeader } from "@/components/common/page-header";
import { AttendanceStatusBadge } from "@/features/attendance/components/attendance-status-badge";
import {
  ATTENDANCE_STATUS_OPTIONS,
  getAttendanceStatusLabel,
} from "@/features/attendance/constants/attendance-options";
import type {
  AdminAttendanceOverview,
  AttendanceListFilters,
  AttendanceListResult,
} from "@/features/attendance/types/attendance.types";
import { EMPLOYEE_WORK_MODE_OPTIONS } from "@/features/employees/constants/employee-work-mode.config";
import { EmployeeWorkModeBadge } from "@/features/employees/ui/employee-work-mode-badge";
import { formatAppDate, formatAppTime } from "@/lib/datetime";

type AdminAttendancePageProps = {
  overview: AdminAttendanceOverview;
  result: AttendanceListResult;
  filters: AttendanceListFilters;
};

function formatDate(value: string) {
  return formatAppDate(`${value}T00:00:00`);
}

function formatTime(value: string | null) {
  if (!value) {
    return "--";
  }

  return formatAppTime(value);
}

function formatDuration(minutes: number) {
  if (minutes <= 0) {
    return "--";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes} min`;
}

export function AdminAttendancePage({
  overview,
  result,
  filters,
}: AdminAttendancePageProps) {
  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Company Attendance"
        title="Attendance"
        description="Read-only attendance management for manual check-in workflows."
        actions={
          <Link
            href="/admin/attendance/reports"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-background/75 px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:bg-muted"
          >
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Monthly Reports
          </Link>
        }
        aside={<IconBadge icon={CalendarCheck} className="mx-auto lg:mx-0" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="app-card p-5">
          <div className="flex items-center gap-3">
            <IconBadge icon={CalendarCheck} className="size-10 rounded-2xl" />
            <div>
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-lg font-semibold">
                {formatDate(overview.today)}
              </p>
            </div>
          </div>
        </div>
        <div className="app-card p-5">
          <div className="flex items-center gap-3">
            <IconBadge icon={Clock} className="size-10 rounded-2xl" />
            <div>
              <p className="text-sm text-muted-foreground">Records Today</p>
              <p className="text-lg font-semibold">
                {overview.totalRecordsToday}
              </p>
            </div>
          </div>
        </div>
        <div className="app-card p-5">
          <div className="flex items-center gap-3">
            <IconBadge icon={Users} className="size-10 rounded-2xl" />
            <div>
              <p className="text-sm text-muted-foreground">Checked In</p>
              <p className="text-lg font-semibold">
                {overview.checkedInToday}
              </p>
            </div>
          </div>
        </div>
        <div className="app-card p-5">
          <div className="flex items-center gap-3">
            <IconBadge icon={Clock} className="size-10 rounded-2xl" />
            <div>
              <p className="text-sm text-muted-foreground">Late Today</p>
              <p className="text-lg font-semibold">{overview.lateToday}</p>
            </div>
          </div>
        </div>
      </div>

      <form className="app-card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_160px_160px_160px_160px_auto]">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Search
          </span>
          <div className="mt-1 flex min-h-11 items-center gap-2 rounded-lg border bg-background px-3">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <input
              name="search"
              defaultValue={filters.search ?? ""}
              placeholder="Employee ID or name"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Date</span>
          <input
            type="date"
            name="date"
            defaultValue={result.date}
            className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Employee
          </span>
          <select
            name="employeeId"
            defaultValue={filters.employeeId ?? ""}
            className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All employees</option>
            {result.employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} ({employee.employeeId})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Status
          </span>
          <select
            name="status"
            defaultValue={filters.status ?? "all"}
            className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All statuses</option>
            {ATTENDANCE_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Work Mode
          </span>
          <select
            name="workMode"
            defaultValue={filters.workMode ?? "all"}
            className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All work modes</option>
            {EMPLOYEE_WORK_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-auto"
          >
            Apply
          </button>
        </div>
      </form>

      {result.records.length === 0 ? (
        <EmptyState
          title="No attendance records found"
          description="Attendance records will appear here after employees check in."
          className="bg-card shadow-sm"
        />
      ) : (
        <div className="app-table-shell">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Work Mode</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Check-in</th>
                  <th className="px-4 py-3 font-medium">Check-out</th>
                  <th className="px-4 py-3 font-medium">Working Hours</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{record.employeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.employeeCode}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <EmployeeWorkModeBadge workMode={record.employeeWorkMode} />
                    </td>
                    <td className="px-4 py-3">{formatDate(record.attendanceDate)}</td>
                    <td className="px-4 py-3">{formatTime(record.checkIn)}</td>
                    <td className="px-4 py-3">{formatTime(record.checkOut)}</td>
                    <td className="px-4 py-3">
                      {formatDuration(record.workingMinutes)}
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceStatusBadge status={record.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/attendance/${record.id}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y lg:hidden">
            {result.records.map((record) => (
              <article key={record.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{record.employeeName}</h2>
                    <p className="text-sm text-muted-foreground">
                      {record.employeeCode} - {formatDate(record.attendanceDate)}
                    </p>
                  </div>
                  <AttendanceStatusBadge status={record.status} />
                </div>
                <EmployeeWorkModeBadge workMode={record.employeeWorkMode} />
                <dl className="grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-lg border bg-background p-2">
                    <dt className="text-xs text-muted-foreground">In</dt>
                    <dd className="font-medium">{formatTime(record.checkIn)}</dd>
                  </div>
                  <div className="rounded-lg border bg-background p-2">
                    <dt className="text-xs text-muted-foreground">Out</dt>
                    <dd className="font-medium">{formatTime(record.checkOut)}</dd>
                  </div>
                  <div className="rounded-lg border bg-background p-2">
                    <dt className="text-xs text-muted-foreground">Hours</dt>
                    <dd className="font-medium">
                      {formatDuration(record.workingMinutes)}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">
                  Status: {getAttendanceStatusLabel(record.status)}
                </p>
                <Link
                  href={`/admin/attendance/${record.id}`}
                  className="inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-semibold"
                >
                  View Detail
                </Link>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
