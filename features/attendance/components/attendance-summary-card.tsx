import Link from "next/link";
import { CalendarCheck, Clock, LogIn, LogOut } from "lucide-react";

import { AttendanceStatusBadge } from "@/features/attendance/components/attendance-status-badge";
import type { EmployeeAttendanceSummary } from "@/features/attendance/types/attendance.types";
import { formatAppTime } from "@/lib/datetime";

type AttendanceSummaryCardProps = {
  summary: EmployeeAttendanceSummary;
};

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

export function AttendanceSummaryCard({ summary }: AttendanceSummaryCardProps) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <CalendarCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Today&apos;s Attendance</h2>
            <p className="text-sm text-muted-foreground">
              Manual check-in status
            </p>
          </div>
        </div>
        {summary.status === "not_started" ? (
          <span className="inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
            Not started
          </span>
        ) : (
          <AttendanceStatusBadge status={summary.status} />
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-lg border bg-background p-3">
          <LogIn className="mb-2 size-4 text-muted-foreground" aria-hidden="true" />
          <p className="text-xs text-muted-foreground">Check-in</p>
          <p className="mt-1 font-semibold">{formatTime(summary.checkIn)}</p>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <LogOut className="mb-2 size-4 text-muted-foreground" aria-hidden="true" />
          <p className="text-xs text-muted-foreground">Check-out</p>
          <p className="mt-1 font-semibold">{formatTime(summary.checkOut)}</p>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <Clock className="mb-2 size-4 text-muted-foreground" aria-hidden="true" />
          <p className="text-xs text-muted-foreground">Hours</p>
          <p className="mt-1 font-semibold">
            {formatDuration(summary.workingMinutes)}
          </p>
        </div>
      </div>

      <Link
        href="/attendance"
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Open Attendance
      </Link>
    </section>
  );
}
