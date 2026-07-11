import Link from "next/link";
import { Download, FileSpreadsheet, FileText, Table2 } from "lucide-react";

import { AttendanceReportTable } from "@/features/attendance-reports/components/attendance-report-table";
import type { AttendanceReportPageData } from "@/features/attendance-reports/types/attendance-report.types";

type AttendanceReportPageProps = {
  data: AttendanceReportPageData;
};

function buildQueryString(data: AttendanceReportPageData) {
  const params = new URLSearchParams();

  if (data.filters.roleId) {
    params.set("roleId", data.filters.roleId);
  }

  if (data.filters.employeeId) {
    params.set("employeeId", data.filters.employeeId);
  }

  if (data.filters.attendanceMode !== "all") {
    params.set("attendanceMode", data.filters.attendanceMode);
  }

  if (data.filters.status !== "all") {
    params.set("status", data.filters.status);
  }

  params.set("month", String(data.filters.month));
  params.set("year", String(data.filters.year));

  if (data.filters.startDate) {
    params.set("startDate", data.filters.startDate);
  }

  if (data.filters.endDate) {
    params.set("endDate", data.filters.endDate);
  }

  return params.toString();
}

const kpiCardStyles = [
  "bg-sky-50 text-sky-950 border-sky-200",
  "bg-emerald-50 text-emerald-950 border-emerald-200",
  "bg-rose-50 text-rose-950 border-rose-200",
  "bg-amber-50 text-amber-950 border-amber-200",
  "bg-indigo-50 text-indigo-950 border-indigo-200",
  "bg-slate-50 text-slate-950 border-slate-200",
  "bg-cyan-50 text-cyan-950 border-cyan-200",
  "bg-violet-50 text-violet-950 border-violet-200",
  "bg-zinc-50 text-zinc-950 border-zinc-200",
] as const;

export function AttendanceReportPage({ data }: AttendanceReportPageProps) {
  const exportQuery = buildQueryString(data);
  const exportLinks = [
    {
      href: `/admin/attendance/reports/export?format=xlsx&${exportQuery}`,
      label: "Excel",
      icon: FileSpreadsheet,
    },
    {
      href: `/admin/attendance/reports/export?format=csv&${exportQuery}`,
      label: "CSV",
      icon: Table2,
    },
    {
      href: `/admin/attendance/reports/export?format=pdf&${exportQuery}`,
      label: "PDF",
      icon: FileText,
    },
  ];
  const kpis = [
    ["Total Employees", String(data.summary.totalEmployees)],
    ["Present", String(data.summary.present)],
    ["Absent", String(data.summary.absent)],
    ["Late", String(data.summary.late)],
    ["On Leave", String(data.summary.onLeave)],
    ["Remote", String(data.summary.remote)],
    ["Hybrid", String(data.summary.hybrid)],
    ["Working Days", String(data.summary.workingDays)],
    ["Avg Working Hours", data.summary.averageWorkingHoursLabel],
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Attendance Reporting
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Monthly Attendance Report
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Download payroll-friendly attendance reports generated directly
            from attendance records for {data.company.name}. Current policy
            reference: {data.attendanceModeLabel}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {exportLinks.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.label}
                href={link.href}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted"
              >
                <Download className="size-4" aria-hidden="true" />
                <Icon className="size-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <form className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Company</span>
          <select
            name="companyId"
            defaultValue={data.company.id}
            disabled
            className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            {data.companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Department</span>
          <input
            name="department"
            defaultValue={data.filters.department}
            disabled
            placeholder="Future ready"
            className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 text-sm text-muted-foreground"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Role</span>
          <select
            name="roleId"
            defaultValue={data.filters.roleId}
            className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">All roles</option>
            {data.roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Employee</span>
          <select
            name="employeeId"
            defaultValue={data.filters.employeeId}
            className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">All employees</option>
            {data.employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} ({employee.employeeId})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Attendance Mode
          </span>
          <select
            name="attendanceMode"
            defaultValue={data.filters.attendanceMode}
            className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="all">All</option>
            <option value="office">Office-based</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid source</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <select
            name="status"
            defaultValue={data.filters.status}
            className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="half_day">Half Day</option>
            <option value="absent">Absent</option>
            <option value="leave">Leave</option>
            <option value="weekend">Weekend</option>
            <option value="holiday">Holiday</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Month</span>
          <input
            type="number"
            min={1}
            max={12}
            name="month"
            defaultValue={data.filters.month}
            className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Year</span>
          <input
            type="number"
            min={2020}
            max={2100}
            name="year"
            defaultValue={data.filters.year}
            className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Start Date</span>
          <input
            type="date"
            name="startDate"
            defaultValue={data.filters.startDate ?? ""}
            className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">End Date</span>
          <input
            type="date"
            name="endDate"
            defaultValue={data.filters.endDate ?? ""}
            className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 text-sm"
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Apply Filters
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map(([label, value], index) => (
          <article
            key={label}
            className={`rounded-2xl border p-4 shadow-sm ${kpiCardStyles[index]}`}
          >
            <p className="text-sm font-medium">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
            <p className="mt-2 text-xs opacity-80">
              Report period: {data.range.label}
            </p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Employee Attendance Summary</h2>
            <p className="text-sm text-muted-foreground">
              Generated by {data.generatedBy} on {data.generatedAt}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.rows.length} employee row{data.rows.length === 1 ? "" : "s"} in this report
          </p>
        </div>
      </div>

      <AttendanceReportTable rows={data.rows} filters={data.filters} />
    </section>
  );
}
