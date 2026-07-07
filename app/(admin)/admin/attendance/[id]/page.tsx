import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LocateFixed } from "lucide-react";

import { AttendanceStatusBadge } from "@/features/attendance/components";
import { AttendanceService } from "@/features/attendance/services/attendance.service";

export const dynamic = "force-dynamic";

type AdminAttendanceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatTime(value: string | null) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMeters(value: number | null) {
  if (value === null) {
    return "--";
  }

  return `${Math.round(value)}m`;
}

export default async function AdminAttendanceDetailPage({
  params,
}: AdminAttendanceDetailPageProps) {
  const { id } = await params;
  const record = await AttendanceService.getAttendanceDetail(id);

  if (!record) {
    notFound();
  }

  return (
    <section className="space-y-5">
      <Link
        href="/admin/attendance"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Attendance
      </Link>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {record.employeeCode}
            </p>
            <h1 className="mt-1 text-2xl font-semibold">
              {record.employeeName}
            </h1>
          </div>
          <AttendanceStatusBadge status={record.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LocationPanel
          title="Check-in Location"
          time={record.checkIn}
          latitude={record.checkInLatitude}
          longitude={record.checkInLongitude}
          accuracy={record.checkInAccuracyMeters}
          distance={record.checkInDistanceMeters}
          locationName={record.checkInLocationName}
        />
        <LocationPanel
          title="Check-out Location"
          time={record.checkOut}
          latitude={record.checkOutLatitude}
          longitude={record.checkOutLongitude}
          accuracy={record.checkOutAccuracyMeters}
          distance={record.checkOutDistanceMeters}
          locationName={record.checkOutLocationName}
        />
      </div>
    </section>
  );
}

function LocationPanel({
  title,
  time,
  latitude,
  longitude,
  accuracy,
  distance,
  locationName,
}: {
  title: string;
  time: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  distance: number | null;
  locationName: string | null;
}) {
  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <LocateFixed className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{formatTime(time)}</p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg border bg-background p-3">
          <dt className="text-muted-foreground">Office</dt>
          <dd className="mt-1 font-semibold">{locationName ?? "--"}</dd>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <dt className="text-muted-foreground">Distance</dt>
          <dd className="mt-1 font-semibold">{formatMeters(distance)}</dd>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <dt className="text-muted-foreground">Accuracy</dt>
          <dd className="mt-1 font-semibold">{formatMeters(accuracy)}</dd>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <dt className="text-muted-foreground">Coordinates</dt>
          <dd className="mt-1 font-semibold">
            {latitude !== null && longitude !== null
              ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              : "--"}
          </dd>
        </div>
      </dl>
    </article>
  );
}
