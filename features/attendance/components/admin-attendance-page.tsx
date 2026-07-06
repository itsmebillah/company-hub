import { CalendarCheck, Clock, Search, Users } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
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

type AdminAttendancePageProps = {
  overview: AdminAttendanceOverview;
  result: AttendanceListResult;
  filters: AttendanceListFilters;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string | null) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Read-only attendance management for manual check-in workflows.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <CalendarCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-lg font-semibold">
                {formatDate(overview.today)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Clock className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Records Today</p>
              <p className="text-lg font-semibold">
                {overview.totalRecordsToday}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Users className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Checked In</p>
              <p className="text-lg font-semibold">
                {overview.checkedInToday}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Clock className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Late Today</p>
              <p className="text-lg font-semibold">{overview.lateToday}</p>
            </div>
          </div>
        </div>
      </div>

      <form className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_170px_170px_170px_auto]">
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
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Check-in</th>
                  <th className="px-4 py-3 font-medium">Check-out</th>
                  <th className="px-4 py-3 font-medium">Working Hours</th>
                  <th className="px-4 py-3 font-medium">Status</th>
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
                    <td className="px-4 py-3">{formatDate(record.attendanceDate)}</td>
                    <td className="px-4 py-3">{formatTime(record.checkIn)}</td>
                    <td className="px-4 py-3">{formatTime(record.checkOut)}</td>
                    <td className="px-4 py-3">
                      {formatDuration(record.workingMinutes)}
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceStatusBadge status={record.status} />
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
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
