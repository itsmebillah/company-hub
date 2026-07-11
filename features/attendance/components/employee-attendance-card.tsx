"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  Clock,
  LocateFixed,
  LogIn,
  LogOut,
  RefreshCw,
  StickyNote,
} from "lucide-react";

import { AttendanceStatusBadge } from "@/features/attendance/components/attendance-status-badge";
import type {
  AttendanceActionState,
  AttendanceCheckInput,
  AttendanceGpsInput,
  TodayAttendance,
} from "@/features/attendance/types/attendance.types";
import { cn } from "@/lib/utils";

type EmployeeAttendanceCardProps = {
  attendance: TodayAttendance;
  onCheckIn: (input?: AttendanceCheckInput) => Promise<AttendanceActionState>;
  onCheckOut: (input?: AttendanceCheckInput) => Promise<AttendanceActionState>;
  onValidateLocation: (
    input?: AttendanceCheckInput,
  ) => Promise<AttendanceActionState>;
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
    return "Not recorded";
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

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function getElapsedMinutes(checkIn: string | null) {
  if (!checkIn) {
    return 0;
  }

  return Math.max(
    Math.floor((Date.now() - new Date(checkIn).getTime()) / 60000),
    0,
  );
}

export function EmployeeAttendanceCard({
  attendance,
  onCheckIn,
  onCheckOut,
  onValidateLocation,
}: EmployeeAttendanceCardProps) {
  const record = attendance.record;
  const [notes, setNotes] = useState(record?.notes ?? "");
  const [message, setMessage] = useState<AttendanceActionState | null>(null);
  const [gps, setGps] = useState<AttendanceGpsInput | null>(null);
  const [locationStatus, setLocationStatus] =
    useState<AttendanceActionState | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(
    getElapsedMinutes(record?.checkIn ?? null),
  );
  const [isPending, startTransition] = useTransition();
  const hasCheckedIn = Boolean(record?.checkIn);
  const hasCheckedOut = Boolean(record?.checkOut);
  const hasValidLocation = locationStatus?.ok === true && Boolean(gps);
  const canCheckIn = !hasCheckedIn && !isPending && hasValidLocation;
  const canCheckOut = hasCheckedIn && !hasCheckedOut && !isPending && hasValidLocation;
  const workingMinutes = useMemo(() => {
    if (!record?.checkIn) {
      return 0;
    }

    if (record.checkOut) {
      return record.workingMinutes;
    }

    return elapsedMinutes;
  }, [elapsedMinutes, record]);

  async function resolvePermissionState() {
    if (!("permissions" in navigator) || !navigator.permissions?.query) {
      return null;
    }

    try {
      const status = await navigator.permissions.query({
        name: "geolocation",
      });

      return status.state;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (!record?.checkIn || record.checkOut) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedMinutes(getElapsedMinutes(record.checkIn));
    }, 30000);

    return () => window.clearInterval(interval);
  }, [record?.checkIn, record?.checkOut]);

  async function readCurrentLocation() {
    if (!window.isSecureContext) {
      setGps(null);
      setLocationStatus({
        ok: false,
        message:
          "Location requires a secure browser context. Use HTTPS or localhost.",
      });
      return;
    }

    if (!("geolocation" in navigator)) {
      setGps(null);
      setLocationStatus({
        ok: false,
        message: "Location is not available on this device.",
      });
      return;
    }

    const permissionState = await resolvePermissionState();

    if (permissionState === "denied") {
      setGps(null);
      setLocationStatus({
        ok: false,
        message: "Location permission denied.",
      });
      return;
    }

    setIsLocating(true);
    setLocationStatus(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextGps = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString(),
        };

        setGps(nextGps);
        startTransition(async () => {
          const result = await onValidateLocation({ gps: nextGps });
          setLocationStatus(result);
          setIsLocating(false);
        });
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied."
            : error.code === error.POSITION_UNAVAILABLE
              ? "Location unavailable."
              : "Location timeout.";

        setGps(null);
        setLocationStatus({
          ok: false,
          message: error.message ? `${message} ${error.message}` : message,
        });
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 120000,
        timeout: 15000,
      },
    );
  }

  useEffect(() => {
    readCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(action: "check-in" | "check-out") {
    setMessage(null);

    if (!gps || locationStatus?.ok !== true) {
      setMessage({
        ok: false,
        message: "Confirm your office location before continuing.",
      });
      return;
    }

    startTransition(async () => {
      const input = { notes, gps };
      const result =
        action === "check-in"
          ? await onCheckIn(input)
          : await onCheckOut(input);

      setMessage(result);
    });
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manual check-in and check-out for {attendance.employeeName}.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {attendance.employeeCode}
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              {formatDate(attendance.date)}
            </h2>
          </div>
          {record ? (
            <AttendanceStatusBadge status={record.status} />
          ) : (
            <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Not started
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LogIn className="size-4" aria-hidden="true" />
              Check-in
            </div>
            <p className="mt-2 font-semibold">{formatTime(record?.checkIn ?? null)}</p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LogOut className="size-4" aria-hidden="true" />
              Check-out
            </div>
            <p className="mt-2 font-semibold">{formatTime(record?.checkOut ?? null)}</p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" aria-hidden="true" />
              Working time
            </div>
            <p className="mt-2 font-semibold">
              {formatDuration(workingMinutes)}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border bg-muted/30 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  locationStatus?.ok
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                <LocateFixed className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">Current location</h3>
                <p
                  className={cn(
                    "mt-1 text-sm",
                    locationStatus?.ok
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-muted-foreground",
                  )}
                >
                  {isLocating
                    ? "Checking your office location..."
                    : locationStatus?.message ??
                      "Allow location access to validate attendance."}
                </p>
                {gps ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {locationStatus?.locationName
                      ? `Assigned Location: ${locationStatus.locationName} - `
                      : ""}
                    {typeof locationStatus?.distanceMeters === "number"
                      ? `Distance: ${Math.round(locationStatus.distanceMeters)}m - `
                      : ""}
                    Accuracy: {Math.round(gps.accuracy)}m
                  </p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={readCurrentLocation}
              disabled={isLocating || isPending}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={cn("size-4", isLocating && "animate-spin")}
                aria-hidden="true"
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-medium">
              <StickyNote className="size-4" aria-hidden="true" />
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={hasCheckedOut || isPending}
              rows={4}
              className="mt-2 min-h-28 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-70"
              placeholder="Optional attendance note"
            />
          </label>

          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CalendarDays
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p>
                Server time and verified office GPS are used for attendance
                records. Selfie validation remains prepared for a future sprint.
              </p>
            </div>

            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => submit("check-in")}
                disabled={!canCheckIn}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                <LogIn className="size-4" aria-hidden="true" />
                {isPending && canCheckIn ? "Checking in..." : "Check in"}
              </button>
              <button
                type="button"
                onClick={() => submit("check-out")}
                disabled={!canCheckOut}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="size-4" aria-hidden="true" />
                {isPending && canCheckOut ? "Checking out..." : "Check out"}
              </button>
            </div>
          </div>
        </div>

        {message ? (
          <p
            className={cn(
              "mt-4 rounded-lg border px-3 py-2 text-sm",
              message.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
            )}
            role="status"
          >
            {message.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
