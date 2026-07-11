"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Camera,
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
  onUploadSelfie: (formData: FormData) => Promise<{
    ok: boolean;
    message: string;
    path: string;
  }>;
};

function getClientDeviceInfo() {
  const navigatorWithUserAgentData = navigator as Navigator & {
    userAgentData?: {
      platform?: string;
    };
  };
  const browser = navigator.userAgent;
  const platform =
    navigatorWithUserAgentData.userAgentData?.platform ||
    navigator.platform ||
    "Unknown";

  return { browser, platform };
}

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

function summarizeAllowedLocations(names: string[]) {
  if (names.length === 0) {
    return "Remote or policy-based access";
  }

  if (names.length === 1) {
    return names[0];
  }

  if (names.length === 2) {
    return `${names[0]}, ${names[1]}`;
  }

  return `${names[0]}, ${names[1]} +${names.length - 2} more`;
}

export function EmployeeAttendanceCard({
  attendance,
  onCheckIn,
  onCheckOut,
  onValidateLocation,
  onUploadSelfie,
}: EmployeeAttendanceCardProps) {
  const record = attendance.record;
  const [notes, setNotes] = useState(record?.notes ?? "");
  const [message, setMessage] = useState<AttendanceActionState | null>(null);
  const [gps, setGps] = useState<AttendanceGpsInput | null>(null);
  const [locationStatus, setLocationStatus] =
    useState<AttendanceActionState | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState("");
  const [selfieError, setSelfieError] = useState("");
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(
    getElapsedMinutes(record?.checkIn ?? null),
  );
  const [isPending, startTransition] = useTransition();
  const hasCheckedIn = Boolean(record?.checkIn);
  const hasCheckedOut = Boolean(record?.checkOut);
  const hasValidLocation = locationStatus?.ok === true;
  const allowedLocationNames =
    locationStatus?.allowedLocations?.map((location) => location.name) ??
    attendance.policy.allowedLocations.map((location) => location.name);
  const canCheckIn = !hasCheckedIn && !isPending && hasValidLocation;
  const canCheckOut = hasCheckedIn && !hasCheckedOut && !isPending && hasValidLocation;
  const requiresSelfie = locationStatus?.requiresSelfie ?? attendance.policy.requireSelfie;
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
    return () => {
      if (selfiePreviewUrl) {
        URL.revokeObjectURL(selfiePreviewUrl);
      }
    };
  }, [selfiePreviewUrl]);

  useEffect(() => {
    if (!record?.checkIn || record.checkOut) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedMinutes(getElapsedMinutes(record.checkIn));
    }, 30000);

    return () => window.clearInterval(interval);
  }, [record?.checkIn, record?.checkOut]);

  function validateAttendance(nextGps?: AttendanceGpsInput) {
    startTransition(async () => {
      const result = nextGps
        ? await onValidateLocation({ gps: nextGps })
        : await onValidateLocation();
      setLocationStatus(result);
      setIsLocating(false);
    });
  }

  async function readCurrentLocation() {
    if (!window.isSecureContext) {
      setGps(null);
      setIsLocating(true);
      validateAttendance();
      return;
    }

    if (!("geolocation" in navigator)) {
      setGps(null);
      setIsLocating(true);
      validateAttendance();
      return;
    }

    const permissionState = await resolvePermissionState();

    if (permissionState === "denied") {
      setGps(null);
      setIsLocating(true);
      validateAttendance();
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
        validateAttendance(nextGps);
      },
      (error) => {
        setGps(null);
        validateAttendance();
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

  function handleSelfieChange(file: File | null) {
    if (selfiePreviewUrl) {
      URL.revokeObjectURL(selfiePreviewUrl);
    }

    if (!file) {
      setSelfieFile(null);
      setSelfiePreviewUrl("");
      setSelfieError("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSelfieFile(null);
      setSelfiePreviewUrl("");
      setSelfieError("Please capture a valid selfie image.");
      return;
    }

    setSelfieFile(file);
    setSelfiePreviewUrl(URL.createObjectURL(file));
    setSelfieError("");
  }

  async function uploadSelfie(phase: "checkin" | "checkout") {
    if (!selfieFile) {
      return "";
    }

    const formData = new FormData();
    formData.set("phase", phase);
    formData.set("attendanceDate", attendance.date);
    formData.set("file", selfieFile);

    setIsUploadingSelfie(true);
    const result = await onUploadSelfie(formData);
    setIsUploadingSelfie(false);

    if (!result.ok) {
      setSelfieError(result.message);
      return "";
    }

    return result.path;
  }

  function submit(action: "check-in" | "check-out") {
    setMessage(null);
    setSelfieError("");

    if (locationStatus?.ok !== true) {
      setMessage({
        ok: false,
        message: "Validate attendance policy requirements before continuing.",
      });
      return;
    }

    startTransition(async () => {
      const selfiePath =
        selfieFile ? await uploadSelfie(action === "check-in" ? "checkin" : "checkout") : "";

      if (requiresSelfie && action === "check-in" && !selfiePath) {
        setMessage({
          ok: false,
          message: "Attendance selfie is required before check-in.",
        });
        return;
      }

      const input: AttendanceCheckInput = {
        notes,
        ...(gps ? { gps } : {}),
        ...(selfiePath ? { selfiePath } : {}),
        deviceInfo: getClientDeviceInfo(),
      };
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
          <div className="grid gap-3 border-b pb-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Attendance Mode
              </p>
              <p className="mt-2 text-sm font-semibold">
                {locationStatus?.modeLabel ?? attendance.policy.modeLabel}
              </p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Allowed Office
              </p>
              <p className="mt-2 text-sm font-semibold">
                {summarizeAllowedLocations(allowedLocationNames)}
              </p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                GPS Status
              </p>
              <p className="mt-2 text-sm font-semibold">
                {gps ? `${gps.source ?? "gps"}`.toUpperCase() : "Pending"}
              </p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current Accuracy
              </p>
              <p className="mt-2 text-sm font-semibold">
                {gps ? `${Math.round(gps.accuracy)}m` : "--"}
              </p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current Distance
              </p>
              <p className="mt-2 text-sm font-semibold">
                {typeof locationStatus?.distanceMeters === "number"
                  ? `${Math.round(locationStatus.distanceMeters)}m`
                  : "--"}
              </p>
            </div>
          </div>

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
                      ? `Matched Location: ${locationStatus.locationName} - `
                      : ""}
                    {typeof locationStatus?.distanceMeters === "number"
                      ? `Distance: ${Math.round(locationStatus.distanceMeters)}m - `
                      : ""}
                    Accuracy: {Math.round(gps.accuracy)}m
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {attendance.policy.modeDescription}
                </p>
                {requiresSelfie ? (
                  <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                    Selfie is required before check-in.
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
                Attendance follows the configured policy engine. GPS, geofence,
                and future validation hooks are evaluated from admin settings.
              </p>
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Camera className="size-4" aria-hidden="true" />
                Attendance Selfie
              </span>
              <div className="rounded-lg border bg-background p-3">
                <div className="flex flex-col gap-3">
                  {selfiePreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selfiePreviewUrl}
                      alt="Attendance selfie preview"
                      className="h-32 w-32 rounded-lg object-cover"
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {requiresSelfie
                        ? "Capture a selfie before checking in."
                        : "Optional for checkout and future attendance verification."}
                    </p>
                  )}
                  <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium">
                    <Camera className="size-4" aria-hidden="true" />
                    {isUploadingSelfie ? "Uploading..." : "Capture Selfie"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="sr-only"
                      onChange={(event) =>
                        handleSelfieChange(event.target.files?.[0] ?? null)
                      }
                      disabled={isUploadingSelfie || isPending}
                    />
                  </label>
                </div>
              </div>
            </label>

            {selfieError ? (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
                {selfieError}
              </p>
            ) : null}

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
