import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, LocateFixed } from "lucide-react";

import { AttendanceStatusBadge } from "@/features/attendance/components";
import { AttendanceService } from "@/features/attendance/services/attendance.service";
import { EmployeeWorkModeBadge } from "@/features/employees/ui/employee-work-mode-badge";
import { getEmployeeWorkModeConfig } from "@/features/employees/constants/employee-work-mode.config";
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
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-semibold"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Attendance
      </Link>

      <div className="bg-card rounded-xl border p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-muted-foreground text-sm">
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
          selfieSyncStatus={record.checkInSelfieSyncStatus}
          selfieDriveUrl={record.checkInSelfieDriveUrl}
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
          selfieSyncStatus={record.checkOutSelfieSyncStatus}
          selfieDriveUrl={record.checkOutSelfieDriveUrl}
          browser={record.checkOutDeviceBrowser}
          platform={record.checkOutDevicePlatform}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="bg-card rounded-xl border p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Attendance Summary</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="bg-background rounded-lg border p-3">
              <dt className="text-muted-foreground">Date</dt>
              <dd className="mt-1 font-semibold">{record.attendanceDate}</dd>
            </div>
            <div className="bg-background rounded-lg border p-3">
              <dt className="text-muted-foreground">Working Hours</dt>
              <dd className="mt-1 font-semibold">
                {formatDuration(record.workingMinutes)}
              </dd>
            </div>
            <div className="bg-background rounded-lg border p-3">
              <dt className="text-muted-foreground">Work Mode</dt>
              <dd className="mt-1 font-semibold">
                <EmployeeWorkModeBadge workMode={record.employeeWorkMode} />
              </dd>
            </div>
            <div className="bg-background rounded-lg border p-3">
              <dt className="text-muted-foreground">Attendance Type</dt>
              <dd className="mt-1 font-semibold capitalize">
                {getEmployeeWorkModeConfig(record.attendanceType).label}
              </dd>
            </div>
          </dl>
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
  selfieSyncStatus,
  selfieDriveUrl,
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
  selfieSyncStatus: string | null;
  selfieDriveUrl: string | null;
  browser: string | null;
  platform: string | null;
}) {
  const mapHref =
    latitude !== null && longitude !== null
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

  return (
    <article className="bg-card rounded-xl border p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-lg">
          <LocateFixed className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-muted-foreground text-sm">{formatTime(time)}</p>
        </div>
        {mapHref ? (
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:bg-muted ml-auto inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Open Map
          </a>
        ) : null}
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="bg-background rounded-lg border p-3">
          <dt className="text-muted-foreground">Office</dt>
          <dd className="mt-1 font-semibold">{locationName ?? "--"}</dd>
        </div>
        <div className="bg-background rounded-lg border p-3">
          <dt className="text-muted-foreground">Distance</dt>
          <dd className="mt-1 font-semibold">{formatMeters(distance)}</dd>
        </div>
        <div className="bg-background rounded-lg border p-3">
          <dt className="text-muted-foreground">Accuracy</dt>
          <dd className="mt-1 font-semibold">{formatMeters(accuracy)}</dd>
        </div>
        <div className="bg-background rounded-lg border p-3">
          <dt className="text-muted-foreground">Coordinates</dt>
          <dd className="mt-1 font-semibold">
            {latitude !== null && longitude !== null
              ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              : "--"}
          </dd>
        </div>
        <div className="bg-background rounded-lg border p-3 sm:col-span-2">
          <dt className="text-muted-foreground">Readable Address</dt>
          <dd className="mt-1 font-semibold">{address ?? "--"}</dd>
        </div>
        <div className="bg-background rounded-lg border p-3">
          <dt className="text-muted-foreground">Location Source</dt>
          <dd className="mt-1 font-semibold">{source ?? "--"}</dd>
        </div>
        <div className="bg-background rounded-lg border p-3">
          <dt className="text-muted-foreground">Device</dt>
          <dd className="mt-1 font-semibold">
            {[browser, platform].filter(Boolean).join(" / ") || "--"}
          </dd>
        </div>
      </dl>

      <div className="bg-background mt-4 rounded-lg border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">Selfie</p>
          {selfieSyncStatus ? (
            <span className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-1 text-xs font-semibold capitalize">
              Drive: {selfieSyncStatus}
            </span>
          ) : null}
        </div>
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
        {selfieDriveUrl ? (
          <a
            href={selfieDriveUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:bg-muted mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Open in Google Drive
          </a>
        ) : null}
      </div>
    </article>
  );
}
