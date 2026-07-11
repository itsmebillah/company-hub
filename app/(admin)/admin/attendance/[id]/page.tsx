import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, LocateFixed, Route } from "lucide-react";

import { AttendanceStatusBadge } from "@/features/attendance/components";
import { AttendanceService } from "@/features/attendance/services/attendance.service";
import { formatAppDateTime } from "@/lib/datetime";

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

  return formatAppDateTime(value);
}

function formatMeters(value: number | null) {
  if (value === null) {
    return "--";
  }

  return `${Math.round(value)}m`;
}

function formatDuration(minutes: number) {
  if (minutes <= 0) {
    return "--";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
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
          address={record.checkInAddress}
          source={record.checkInLocationSource}
          selfieUrl={record.checkInSelfieUrl}
          browser={record.checkInDeviceBrowser}
          platform={record.checkInDevicePlatform}
        />
        <LocationPanel
          title="Check-out Location"
          time={record.checkOut}
          latitude={record.checkOutLatitude}
          longitude={record.checkOutLongitude}
          accuracy={record.checkOutAccuracyMeters}
          distance={record.checkOutDistanceMeters}
          locationName={record.checkOutLocationName}
          address={record.checkOutAddress}
          source={record.checkOutLocationSource}
          selfieUrl={record.checkOutSelfieUrl}
          browser={record.checkOutDeviceBrowser}
          platform={record.checkOutDevicePlatform}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Attendance Summary</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-background p-3">
              <dt className="text-muted-foreground">Date</dt>
              <dd className="mt-1 font-semibold">{record.attendanceDate}</dd>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <dt className="text-muted-foreground">Working Hours</dt>
              <dd className="mt-1 font-semibold">
                {formatDuration(record.workingMinutes)}
              </dd>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <dt className="text-muted-foreground">Work Mode</dt>
              <dd className="mt-1 font-semibold capitalize">
                {record.employeeWorkMode}
              </dd>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <dt className="text-muted-foreground">Attendance Type</dt>
              <dd className="mt-1 font-semibold capitalize">
                {record.attendanceType}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Route className="size-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Future Route Placeholders</h2>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Travel Route</li>
            <li>Live Tracking</li>
            <li>Mileage</li>
            <li>Route History</li>
          </ul>
        </article>
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
  address,
  source,
  selfieUrl,
  browser,
  platform,
}: {
  title: string;
  time: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  distance: number | null;
  locationName: string | null;
  address: string | null;
  source: string | null;
  selfieUrl: string | null;
  browser: string | null;
  platform: string | null;
}) {
  const mapHref =
    latitude !== null && longitude !== null
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

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
        {mapHref ? (
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer noopener"
            className="ml-auto inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Open Map
          </a>
        ) : null}
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
        <div className="rounded-lg border bg-background p-3 sm:col-span-2">
          <dt className="text-muted-foreground">Readable Address</dt>
          <dd className="mt-1 font-semibold">{address ?? "--"}</dd>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <dt className="text-muted-foreground">Location Source</dt>
          <dd className="mt-1 font-semibold">{source ?? "--"}</dd>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <dt className="text-muted-foreground">Device</dt>
          <dd className="mt-1 font-semibold">
            {[browser, platform].filter(Boolean).join(" / ") || "--"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 rounded-lg border bg-background p-3">
        <p className="text-sm text-muted-foreground">Selfie</p>
        {selfieUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selfieUrl}
            alt={`${title} selfie`}
            className="mt-3 h-48 w-48 rounded-lg object-cover"
          />
        ) : (
          <p className="mt-2 text-sm font-semibold">No selfie captured.</p>
        )}
      </div>
    </article>
  );
}
