"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CompanyBrandPreview } from "@/features/company-settings/components/company-brand-preview";
import type {
  CompanyLanguage,
  CompanySettingsActionState,
  CompanyLocationValues,
  CompanySettingsValues,
  CompanyTheme,
  WorkingDay,
} from "@/features/company-settings/types/company-settings.types";
import { cn } from "@/lib/utils";

type CompanySettingsFormProps = {
  initialValues: CompanySettingsValues;
  onSave: (
    values: CompanySettingsValues,
  ) => Promise<CompanySettingsActionState>;
};

const themes: Array<{ value: CompanyTheme; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const languages: CompanyLanguage[] = ["English", "Bangla"];

const workingDayOptions: WorkingDay[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function filePathFromSelection(file: File | undefined, folder: string) {
  if (!file) {
    return "";
  }

  return `${folder}/${file.name}`;
}

function createEmptyLocation(): CompanyLocationValues {
  return {
    name: "",
    latitude: "",
    longitude: "",
    radiusMeters: "100",
    status: "active",
  };
}

export function CompanySettingsForm({
  initialValues,
  onSave,
}: CompanySettingsFormProps) {
  const [values, setValues] = useState<CompanySettingsValues>(initialValues);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue<Key extends keyof CompanySettingsValues>(
    key: Key,
    value: CompanySettingsValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
    key: "logo" | "banner" | "favicon",
    folder: string,
  ) {
    const path = filePathFromSelection(event.target.files?.[0], folder);

    if (path) {
      updateValue(key, path);
    }
  }

  function addLocation() {
    setValues((current) => ({
      ...current,
      locations: [...current.locations, createEmptyLocation()],
    }));
  }

  function updateLocation<Key extends keyof CompanyLocationValues>(
    index: number,
    key: Key,
    value: CompanyLocationValues[Key],
  ) {
    setValues((current) => ({
      ...current,
      locations: current.locations.map((location, locationIndex) =>
        locationIndex === index ? { ...location, [key]: value } : location,
      ),
    }));
  }

  function removeLocation(index: number) {
    setValues((current) => ({
      ...current,
      locations: current.locations.filter((_, locationIndex) => locationIndex !== index),
    }));
  }

  function toggleWorkingDay(day: WorkingDay) {
    setValues((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((currentDay) => currentDay !== day)
        : [...current.workingDays, day],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!values.companyName.trim()) {
      setStatus("error");
      setMessage("Company name is required.");
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form
        className="space-y-6 rounded-xl border bg-card p-5 shadow-sm"
        onSubmit={handleSubmit}
        noValidate
      >
        <section id="general-settings" className="scroll-mt-24">
          <h2 className="text-base font-semibold">General Settings</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Company Name</span>
              <input
                value={values.companyName}
                onChange={(event) =>
                  updateValue("companyName", event.target.value)
                }
                className={cn(
                  "h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !values.companyName.trim() && status === "error"
                    ? "border-destructive"
                    : "",
                )}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Short Name</span>
              <input
                value={values.shortName}
                onChange={(event) =>
                  updateValue("shortName", event.target.value)
                }
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Language</span>
              <select
                value={values.language}
                onChange={(event) =>
                  updateValue("language", event.target.value as CompanyLanguage)
                }
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {languages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Timezone</span>
              <input
                value={values.timezone}
                onChange={(event) =>
                  updateValue("timezone", event.target.value)
                }
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Date Format</span>
              <input
                value={values.dateFormat}
                onChange={(event) =>
                  updateValue("dateFormat", event.target.value)
                }
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Currency</span>
              <input
                value={values.currency}
                onChange={(event) =>
                  updateValue("currency", event.target.value)
                }
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Office Start</span>
              <input
                type="time"
                value={values.officeStartTime}
                onChange={(event) =>
                  updateValue("officeStartTime", event.target.value)
                }
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Office End</span>
              <input
                type="time"
                value={values.officeEndTime}
                onChange={(event) =>
                  updateValue("officeEndTime", event.target.value)
                }
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <div className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Working Days</span>
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {workingDayOptions.map((day) => (
                  <label
                    key={day}
                    className={cn(
                      "flex h-11 cursor-pointer items-center justify-center rounded-md border text-sm font-medium",
                      values.workingDays.includes(day) &&
                        "border-primary bg-primary/10",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={values.workingDays.includes(day)}
                      onChange={() => toggleWorkingDay(day)}
                      className="sr-only"
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="company-profile" className="scroll-mt-24">
          <h2 className="text-base font-semibold">Company Profile</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Logo</span>
              <div className="grid gap-2">
                <input
                  value={values.logo}
                  onChange={(event) => updateValue("logo", event.target.value)}
                  placeholder="branding/logo.png"
                  className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium">
                  <Upload className="size-4" aria-hidden="true" />
                  Select Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) =>
                      handleFileChange(event, "logo", "branding")
                    }
                  />
                </label>
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Company Banner</span>
              <div className="grid gap-2">
                <input
                  value={values.banner}
                  onChange={(event) =>
                    updateValue("banner", event.target.value)
                  }
                  placeholder="branding/banner.jpg"
                  className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium">
                  <Upload className="size-4" aria-hidden="true" />
                  Select Banner
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) =>
                      handleFileChange(event, "banner", "branding")
                    }
                  />
                </label>
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Favicon</span>
              <div className="grid gap-2">
                <input
                  value={values.favicon}
                  onChange={(event) =>
                    updateValue("favicon", event.target.value)
                  }
                  placeholder="branding/favicon.ico"
                  className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium">
                  <Upload className="size-4" aria-hidden="true" />
                  Select Favicon
                  <input
                    type="file"
                    accept="image/*,.ico"
                    className="sr-only"
                    onChange={(event) =>
                      handleFileChange(event, "favicon", "branding")
                    }
                  />
                </label>
              </div>
            </label>
          </div>
        </section>

        <section id="branding" className="scroll-mt-24">
          <h2 className="text-base font-semibold">Branding</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Theme</span>
              <div className="grid gap-3 sm:grid-cols-3">
            {themes.map((theme) => (
              <label
                key={theme.value}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center rounded-md border text-sm font-medium",
                  values.theme === theme.value && "border-primary bg-primary/10",
                )}
              >
                <input
                  type="radio"
                  name="theme"
                  value={theme.value}
                  checked={values.theme === theme.value}
                  onChange={() => updateValue("theme", theme.value)}
                  className="sr-only"
                />
                {theme.label}
              </label>
            ))}
              </div>
            </div>
            <label className="space-y-2">
              <span className="text-sm font-medium">Primary Color</span>
              <input
                type="color"
                value={values.primaryColor}
                onChange={(event) =>
                  updateValue("primaryColor", event.target.value)
                }
                className="h-11 w-full rounded-md border bg-background px-2"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Secondary Color</span>
              <input
                type="color"
                value={values.secondaryColor}
                onChange={(event) =>
                  updateValue("secondaryColor", event.target.value)
                }
                className="h-11 w-full rounded-md border bg-background px-2"
              />
            </label>
          </div>
        </section>

        <section id="notifications" className="scroll-mt-24">
          <h2 className="text-base font-semibold">Contact Details</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Support Email</span>
              <input
                type="email"
                value={values.supportEmail}
                onChange={(event) =>
                  updateValue("supportEmail", event.target.value)
                }
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Support Phone</span>
              <input
                value={values.supportPhone}
                onChange={(event) =>
                  updateValue("supportPhone", event.target.value)
                }
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Website</span>
              <input
                value={values.website}
                onChange={(event) =>
                  updateValue("website", event.target.value)
                }
                placeholder="https://example.com"
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Address</span>
              <textarea
                value={values.address}
                onChange={(event) =>
                  updateValue("address", event.target.value)
                }
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>
        </section>

        <section id="resources" className="scroll-mt-24">
          <h2 className="text-base font-semibold">Notification Preferences</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(
              [
                ["announcements", "Announcements"],
                ["attendance", "Attendance"],
                ["leave", "Leave"],
                ["approvals", "Approvals"],
                ["system", "System"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-start gap-3 rounded-lg border p-4"
              >
                <input
                  type="checkbox"
                  checked={values.notificationPreferences[key]}
                  onChange={(event) =>
                    updateValue("notificationPreferences", {
                      ...values.notificationPreferences,
                      [key]: event.target.checked,
                    })
                  }
                  className="mt-1 size-4"
                />
                <span>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="text-sm text-muted-foreground">
                    Control company-wide notification delivery for {label.toLowerCase()}.
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section id="security" className="scroll-mt-24">
          <h2 className="text-base font-semibold">Resource Defaults</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium">Open Mode</span>
              <select
                value={values.resourcePreferences.openMode}
                onChange={(event) =>
                  updateValue("resourcePreferences", {
                    ...values.resourcePreferences,
                    openMode: event.target.value as
                      CompanySettingsValues["resourcePreferences"]["openMode"],
                  })
                }
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="same_tab">Same Tab</option>
                <option value="new_tab">New Tab</option>
                <option value="external">External</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Sorting</span>
              <select
                value={values.resourcePreferences.sorting}
                onChange={(event) =>
                  updateValue("resourcePreferences", {
                    ...values.resourcePreferences,
                    sorting: event.target.value as
                      CompanySettingsValues["resourcePreferences"]["sorting"],
                  })
                }
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="featured_first">Featured First</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Visibility Defaults</span>
              <select
                value={values.resourcePreferences.visibilityDefaults}
                onChange={(event) =>
                  updateValue("resourcePreferences", {
                    ...values.resourcePreferences,
                    visibilityDefaults: event.target.value as
                      CompanySettingsValues["resourcePreferences"]["visibilityDefaults"],
                  })
                }
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="permission_aware">Permission Aware</option>
                <option value="company_wide">Company Wide</option>
                <option value="restricted">Restricted</option>
              </select>
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold">Security Preferences</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Password Policy</span>
              <select
                value={values.securityPreferences.passwordPolicy}
                onChange={(event) =>
                  updateValue("securityPreferences", {
                    ...values.securityPreferences,
                    passwordPolicy: event.target.value as
                      CompanySettingsValues["securityPreferences"]["passwordPolicy"],
                  })
                }
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="standard">Standard</option>
                <option value="strong">Strong</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Session Timeout (minutes)</span>
              <input
                type="number"
                min={1}
                value={values.securityPreferences.sessionTimeoutMinutes}
                onChange={(event) =>
                  updateValue("securityPreferences", {
                    ...values.securityPreferences,
                    sessionTimeoutMinutes: Math.max(
                      1,
                      Number(event.target.value) || 1,
                    ),
                  })
                }
                className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="flex items-start gap-3 rounded-lg border p-4 md:col-span-2">
              <input
                type="checkbox"
                checked={values.securityPreferences.forceLogoutEnabled}
                onChange={(event) =>
                  updateValue("securityPreferences", {
                    ...values.securityPreferences,
                    forceLogoutEnabled: event.target.checked,
                  })
                }
                className="mt-1 size-4"
              />
              <span>
                <span className="block text-sm font-medium">Force Logout</span>
                <span className="text-sm text-muted-foreground">
                  Prepare future forced sign-out controls without changing authentication flow today.
                </span>
              </span>
            </label>
          </div>
        </section>

        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Office Locations</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Active locations are used for GPS attendance validation.
              </p>
            </div>
            <button
              type="button"
              onClick={addLocation}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add Location
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {values.locations.length === 0 ? (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                No office locations configured. Add at least one active office
                before enabling GPS attendance.
              </div>
            ) : null}

            {values.locations.map((location, index) => (
              <div key={location.id ?? index} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="size-4" aria-hidden="true" />
                    Office Location {index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLocation(index)}
                    className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Remove office location ${index + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-medium">Location Name</span>
                    <input
                      value={location.name}
                      onChange={(event) =>
                        updateLocation(index, "name", event.target.value)
                      }
                      placeholder="Head Office"
                      className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium">Latitude</span>
                    <input
                      value={location.latitude}
                      inputMode="decimal"
                      onChange={(event) =>
                        updateLocation(index, "latitude", event.target.value)
                      }
                      placeholder="23.8103"
                      className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium">Longitude</span>
                    <input
                      value={location.longitude}
                      inputMode="decimal"
                      onChange={(event) =>
                        updateLocation(index, "longitude", event.target.value)
                      }
                      placeholder="90.4125"
                      className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Allowed Radius (meters)
                    </span>
                    <input
                      value={location.radiusMeters}
                      inputMode="numeric"
                      onChange={(event) =>
                        updateLocation(index, "radiusMeters", event.target.value)
                      }
                      placeholder="100"
                      className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium">Status</span>
                    <select
                      value={location.status}
                      onChange={(event) =>
                        updateLocation(
                          index,
                          "status",
                          event.target.value === "active"
                            ? "active"
                            : "inactive",
                        )
                      }
                      className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                </div>
              </div>
            ))}
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
            Save Settings
          </Button>
        </div>
      </form>

      <CompanyBrandPreview values={values} />
    </div>
  );
}
