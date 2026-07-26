"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ATTENDANCE_POLICY_OPTIONS } from "@/features/attendance/constants/attendance-policy-options";
import type {
  AttendanceActionState,
  AttendanceSettingsValues,
} from "@/features/attendance/types/attendance.types";
import {
  addMinutesToTimeValue,
  formatTimeValueLabel,
} from "@/features/attendance/utils/working-hours";
import { cn } from "@/lib/utils";

type AttendanceSettingsFormProps = {
  initialValues: AttendanceSettingsValues;
  onSave: (values: AttendanceSettingsValues) => Promise<AttendanceActionState>;
};

export function AttendanceSettingsForm({
  initialValues,
  onSave,
}: AttendanceSettingsFormProps) {
  const [values, setValues] = useState(initialValues);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lateAfterTime =
    addMinutesToTimeValue(
      values.officeStartTime,
      values.officeGracePeriodMinutes,
    ) ?? values.officeStartTime;
  const earlyCheckInOpensAt =
    addMinutesToTimeValue(
      values.officeStartTime,
      -values.allowEarlyCheckInMinutes,
    ) ?? values.officeStartTime;

  function updateValue<Key extends keyof AttendanceSettingsValues>(
    key: Key,
    value: AttendanceSettingsValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setMessage("");

    const result = await onSave(values);

    setIsSubmitting(false);
    setStatus(result.ok ? "success" : "error");
    setMessage(result.message);
  }

  return (
    <form
      className="bg-card space-y-6 rounded-xl border p-5 shadow-sm"
      onSubmit={handleSubmit}
      noValidate
    >
      <section>
        <h2 className="text-base font-semibold">Attendance Mode</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Switch attendance validation behavior without changing application
          code.
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {ATTENDANCE_POLICY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer rounded-lg border p-4 transition",
                values.attendanceMode === option.value
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/40",
              )}
            >
              <input
                type="radio"
                name="attendanceMode"
                value={option.value}
                checked={values.attendanceMode === option.value}
                onChange={() => updateValue("attendanceMode", option.value)}
                className="sr-only"
              />
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {option.description}
              </p>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold">Employee Work Modes</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Office employees follow the company working-hours policy. Field
          employees keep the existing GPS-only flow. Hybrid employees use office
          hours only when the attendance policy classifies the check-in as
          office attendance.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="bg-background rounded-lg border p-4">
            <p className="text-sm font-semibold">Office</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Office time, grace, and early check-in rules apply.
            </p>
          </div>
          <div className="bg-background rounded-lg border p-4">
            <p className="text-sm font-semibold">Field</p>
            <p className="text-muted-foreground mt-1 text-sm">
              No office start restriction and no late calculation.
            </p>
          </div>
          <div className="bg-background rounded-lg border p-4">
            <p className="text-sm font-semibold">Hybrid</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Office rules apply only when the check-in is matched to office
              attendance.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div>
          <h2 className="text-base font-semibold">Working Hours</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            These settings control office start, grace, and early-arrival rules
            without changing field attendance behavior.
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">Office Start Time</span>
            <input
              type="time"
              value={values.officeStartTime}
              onChange={(event) =>
                updateValue("officeStartTime", event.target.value)
              }
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Office End Time</span>
            <input
              type="time"
              value={values.officeEndTime}
              onChange={(event) =>
                updateValue("officeEndTime", event.target.value)
              }
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Grace Period (min)</span>
            <input
              type="number"
              min={0}
              max={120}
              value={values.officeGracePeriodMinutes}
              onChange={(event) =>
                updateValue(
                  "officeGracePeriodMinutes",
                  Math.min(120, Math.max(0, Number(event.target.value) || 0)),
                )
              }
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Allow Early Check-in (min)
            </span>
            <input
              type="number"
              min={0}
              max={180}
              value={values.allowEarlyCheckInMinutes}
              onChange={(event) =>
                updateValue(
                  "allowEarlyCheckInMinutes",
                  Math.min(180, Math.max(0, Number(event.target.value) || 0)),
                )
              }
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-lg border p-4">
            <input
              type="checkbox"
              checked={values.allowLateCheckOut}
              onChange={(event) =>
                updateValue("allowLateCheckOut", event.target.checked)
              }
              className="mt-1 size-4"
            />
            <span>
              <span className="block text-sm font-medium">
                Allow Late Check-out
              </span>
              <span className="text-muted-foreground text-sm">
                Keep the checkout policy flag configurable without changing the
                current attendance engine.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-lg border p-4">
            <input
              type="checkbox"
              checked={values.weekendWorkingEnabled}
              onChange={(event) =>
                updateValue("weekendWorkingEnabled", event.target.checked)
              }
              className="mt-1 size-4"
            />
            <span>
              <span className="block text-sm font-medium">Weekend Working</span>
              <span className="text-muted-foreground text-sm">
                Store the office weekend policy alongside the rest of the
                attendance configuration for future scheduling control.
              </span>
            </span>
          </label>
        </div>

        <div className="bg-background mt-4 rounded-xl border p-4">
          <h3 className="text-sm font-semibold">Live Preview</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="bg-card rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Office Hours
              </p>
              <p className="mt-2 text-sm font-semibold">
                {formatTimeValueLabel(values.officeStartTime)} -{" "}
                {formatTimeValueLabel(values.officeEndTime)}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Grace Period
              </p>
              <p className="mt-2 text-sm font-semibold">
                {values.officeGracePeriodMinutes} minute
                {values.officeGracePeriodMinutes === 1 ? "" : "s"}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Late After
              </p>
              <p className="mt-2 text-sm font-semibold">
                {formatTimeValueLabel(lateAfterTime)}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Early Check-in Opens
              </p>
              <p className="mt-2 text-sm font-semibold">
                {formatTimeValueLabel(earlyCheckInOpensAt)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold">GPS Validation</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium">
              GPS Accuracy Threshold (m)
            </span>
            <input
              type="number"
              min={1}
              value={values.gpsAccuracyThresholdMeters}
              onChange={(event) =>
                updateValue(
                  "gpsAccuracyThresholdMeters",
                  Math.max(1, Number(event.target.value) || 0),
                )
              }
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Allowed Radius (m)</span>
            <input
              type="number"
              min={1}
              value={values.allowedRadiusMeters}
              onChange={(event) =>
                updateValue(
                  "allowedRadiusMeters",
                  Math.max(1, Number(event.target.value) || 0),
                )
              }
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
            />
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold">Validation Rules</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-lg border p-4">
            <input
              type="checkbox"
              checked={values.requireGps}
              onChange={(event) =>
                updateValue("requireGps", event.target.checked)
              }
              className="mt-1 size-4"
            />
            <span>
              <span className="block text-sm font-medium">Require GPS</span>
              <span className="text-muted-foreground text-sm">
                Attendance must capture device coordinates when the selected
                policy needs them.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border p-4">
            <input
              type="checkbox"
              checked={values.requireSelfie}
              onChange={(event) =>
                updateValue("requireSelfie", event.target.checked)
              }
              className="mt-1 size-4"
            />
            <span>
              <span className="block text-sm font-medium">Require Selfie</span>
              <span className="text-muted-foreground text-sm">
                Require employees to capture a selfie before attendance
                check-in.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border p-4">
            <input
              type="checkbox"
              checked={values.requireHighAccuracy}
              onChange={(event) =>
                updateValue("requireHighAccuracy", event.target.checked)
              }
              className="mt-1 size-4"
            />
            <span>
              <span className="block text-sm font-medium">
                Require High Accuracy
              </span>
              <span className="text-muted-foreground text-sm">
                Reject GPS readings that exceed the configured accuracy
                threshold.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border p-4">
            <input
              type="checkbox"
              checked={values.enableGeofence}
              onChange={(event) =>
                updateValue("enableGeofence", event.target.checked)
              }
              className="mt-1 size-4"
            />
            <span>
              <span className="block text-sm font-medium">Enable Geofence</span>
              <span className="text-muted-foreground text-sm">
                Enforce branch radius validation for office-based attendance
                modes.
              </span>
            </span>
          </label>
        </div>
      </section>

      {message ? (
        <div
          className={cn(
            "flex items-start gap-2 rounded-md border p-3 text-sm",
            status === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {status === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
          )}
          <p>{message}</p>
        </div>
      ) : null}

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          Save Attendance Settings
        </Button>
      </div>
    </form>
  );
}
