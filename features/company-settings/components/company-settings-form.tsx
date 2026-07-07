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
  CompanySettingsActionState,
  CompanyLocationValues,
  CompanySettingsValues,
  CompanyTheme,
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
    key: "logo" | "favicon",
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
        <section>
          <h2 className="text-base font-semibold">Brand Identity</h2>
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

        <section>
          <h2 className="text-base font-semibold">Theme</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
        </section>

        <section>
          <h2 className="text-base font-semibold">Contact & Locale</h2>
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
