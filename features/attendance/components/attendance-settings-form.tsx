"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ATTENDANCE_POLICY_OPTIONS } from "@/features/attendance/constants/attendance-policy-options";
import type {
  AttendanceActionState,
  AttendanceSettingsValues,
} from "@/features/attendance/types/attendance.types";
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
      className="space-y-6 rounded-xl border bg-card p-5 shadow-sm"
      onSubmit={handleSubmit}
      noValidate
    >
      <section>
        <h2 className="text-base font-semibold">Attendance Mode</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Switch attendance validation behavior without changing application code.
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
              <p className="mt-1 text-sm text-muted-foreground">
                {option.description}
              </p>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold">GPS Validation</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium">GPS Accuracy Threshold (m)</span>
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
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Allow Early Check-in (min)</span>
            <input
              type="number"
              min={0}
              value={values.allowEarlyCheckInMinutes}
              onChange={(event) =>
                updateValue(
                  "allowEarlyCheckInMinutes",
                  Math.max(0, Number(event.target.value) || 0),
                )
              }
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              onChange={(event) => updateValue("requireGps", event.target.checked)}
              className="mt-1 size-4"
            />
            <span>
              <span className="block text-sm font-medium">Require GPS</span>
              <span className="text-sm text-muted-foreground">
                Attendance must capture device coordinates when the selected policy needs them.
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
              <span className="text-sm text-muted-foreground">
                Require employees to capture a selfie before attendance check-in.
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
              <span className="block text-sm font-medium">Require High Accuracy</span>
              <span className="text-sm text-muted-foreground">
                Reject GPS readings that exceed the configured accuracy threshold.
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
              <span className="text-sm text-muted-foreground">
                Enforce branch radius validation for office-based attendance modes.
              </span>
            </span>
          </label>
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
              <span className="block text-sm font-medium">Allow Late Check-out</span>
              <span className="text-sm text-muted-foreground">
                Stores the policy flag now so later checkout windows can use the same setting.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold">Future Validation Placeholders</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="flex items-start gap-3 rounded-lg border p-4">
            <input
              type="checkbox"
              checked={values.faceVerificationEnabled}
              onChange={(event) =>
                updateValue("faceVerificationEnabled", event.target.checked)
              }
              className="mt-1 size-4"
            />
            <span className="text-sm">
              <span className="block font-medium">Face Verification</span>
              <span className="text-muted-foreground">Placeholder only</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border p-4">
            <input
              type="checkbox"
              checked={values.wifiValidationEnabled}
              onChange={(event) =>
                updateValue("wifiValidationEnabled", event.target.checked)
              }
              className="mt-1 size-4"
            />
            <span className="text-sm">
              <span className="block font-medium">Wi-Fi Validation</span>
              <span className="text-muted-foreground">Placeholder only</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border p-4">
            <input
              type="checkbox"
              checked={values.bluetoothBeaconEnabled}
              onChange={(event) =>
                updateValue("bluetoothBeaconEnabled", event.target.checked)
              }
              className="mt-1 size-4"
            />
            <span className="text-sm">
              <span className="block font-medium">Bluetooth Beacon</span>
              <span className="text-muted-foreground">Placeholder only</span>
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
