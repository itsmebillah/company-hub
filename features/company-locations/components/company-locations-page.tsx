"use client";

import {
  useMemo,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Archive,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import type {
  CompanyLocationActionState,
  CompanyLocationEmployeeOption,
  CompanyLocationFormValues,
  CompanyLocationListItem,
  CompanyLocationType,
} from "@/features/company-locations/types/company-location.types";
import { cn } from "@/lib/utils";

type CompanyLocationsPageProps = {
  locations: CompanyLocationListItem[];
  employees: CompanyLocationEmployeeOption[];
  onCreate: (
    values: CompanyLocationFormValues,
  ) => Promise<CompanyLocationActionState>;
  onUpdate: (
    id: string,
    values: CompanyLocationFormValues,
  ) => Promise<CompanyLocationActionState>;
  onArchive: (id: string) => Promise<CompanyLocationActionState>;
  onSetDefault: (id: string) => Promise<CompanyLocationActionState>;
};

const locationTypes: Array<{ value: CompanyLocationType; label: string }> = [
  { value: "head_office", label: "Head Office" },
  { value: "branch", label: "Branch" },
  { value: "warehouse", label: "Warehouse" },
  { value: "factory", label: "Factory" },
  { value: "depot", label: "Depot" },
  { value: "client_site", label: "Client Site" },
];

function emptyForm(): CompanyLocationFormValues {
  return {
    name: "",
    code: "",
    locationType: "branch",
    latitude: "",
    longitude: "",
    radiusMeters: "100",
    address: "",
    status: "active",
    isDefault: false,
    assignedEmployeeIds: [],
  };
}

function formFromLocation(
  location: CompanyLocationListItem,
): CompanyLocationFormValues {
  return {
    name: location.name,
    code: location.code,
    locationType: location.locationType,
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    radiusMeters: String(location.radiusMeters),
    address: location.address ?? "",
    status: location.status === "active" ? "active" : "inactive",
    isDefault: location.isDefault,
    assignedEmployeeIds: location.assignedEmployeeIds,
  };
}

function formatLocationType(value: CompanyLocationType) {
  return locationTypes.find((item) => item.value === value)?.label ?? value;
}

export function CompanyLocationsPage({
  locations,
  employees,
  onCreate,
  onUpdate,
  onArchive,
  onSetDefault,
}: CompanyLocationsPageProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<CompanyLocationFormValues | null>(
    null,
  );
  const [editingLocation, setEditingLocation] =
    useState<CompanyLocationListItem | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const assignedEmployeeNames = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee.name])),
    [employees],
  );

  function openCreate() {
    setEditingLocation(null);
    setFormValues(emptyForm());
    setMessage("");
  }

  function openEdit(location: CompanyLocationListItem) {
    setEditingLocation(location);
    setFormValues(formFromLocation(location));
    setMessage("");
  }

  function closeForm() {
    setEditingLocation(null);
    setFormValues(null);
    router.refresh();
  }

  function runAction(action: () => Promise<CompanyLocationActionState>) {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      setMessage(result.message);

      if (result.ok) {
        closeForm();
      }
    });
  }

  function runListAction(action: () => Promise<CompanyLocationActionState>) {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Company Locations</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage GPS attendance branches, radius rules, and employee access.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          New Location
        </Button>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {isPending ? (
        <p className="text-sm text-muted-foreground">Saving location...</p>
      ) : null}

      {locations.length === 0 ? (
        <EmptyState
          title="No company locations found"
          description="Create a branch before GPS attendance can be used."
          className="bg-card shadow-sm"
          action={
            <Button type="button" onClick={openCreate}>
              <MapPin className="size-4" aria-hidden="true" />
              Create Location
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {locations.map((location) => (
            <article
              key={location.id}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{location.name}</h2>
                    {location.isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                        <Star className="size-3" aria-hidden="true" />
                        Default
                      </span>
                    ) : null}
                    <span className="rounded-full border px-2 py-0.5 text-xs font-medium capitalize">
                      {location.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {location.code} - {formatLocationType(location.locationType)}
                  </p>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border bg-background p-3">
                  <dt className="text-muted-foreground">Coordinates</dt>
                  <dd className="mt-1 font-semibold">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </dd>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <dt className="text-muted-foreground">Radius</dt>
                  <dd className="mt-1 font-semibold">
                    {location.radiusMeters}m
                  </dd>
                </div>
                <div className="rounded-lg border bg-background p-3 sm:col-span-2">
                  <dt className="text-muted-foreground">Assigned Employees</dt>
                  <dd className="mt-1 font-semibold">
                    {location.assignedEmployeeIds.length > 0
                      ? location.assignedEmployeeIds
                          .map((id) => assignedEmployeeNames.get(id) ?? "Unknown")
                          .join(", ")
                      : "No employees assigned"}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(location)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={location.isDefault}
                  onClick={() =>
                    runListAction(() => onSetDefault(location.id))
                  }
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Set Default
                </Button>
                <a
                  href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Map
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => runListAction(() => onArchive(location.id))}
                >
                  <Archive className="size-4" aria-hidden="true" />
                  Archive
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {formValues ? (
        <LocationForm
          values={formValues}
          employees={employees}
          title={editingLocation ? "Edit Location" : "Create Location"}
          submitLabel={editingLocation ? "Save Location" : "Create Location"}
          onChange={setFormValues}
          onClose={closeForm}
          onSubmit={() =>
            runAction(() =>
              editingLocation
                ? onUpdate(editingLocation.id, formValues)
                : onCreate(formValues),
            )
          }
        />
      ) : null}
    </section>
  );
}

function LocationForm({
  values,
  employees,
  title,
  submitLabel,
  onChange,
  onClose,
  onSubmit,
}: {
  values: CompanyLocationFormValues;
  employees: CompanyLocationEmployeeOption[];
  title: string;
  submitLabel: string;
  onChange: (values: CompanyLocationFormValues) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  function update<Key extends keyof CompanyLocationFormValues>(
    key: Key,
    value: CompanyLocationFormValues[Key],
  ) {
    onChange({ ...values, [key]: value });
  }

  function toggleEmployee(employeeId: string) {
    update(
      "assignedEmployeeIds",
      values.assignedEmployeeIds.includes(employeeId)
        ? values.assignedEmployeeIds.filter((id) => id !== employeeId)
        : [...values.assignedEmployeeIds, employeeId],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="mx-auto my-6 max-w-3xl space-y-5 rounded-xl border bg-card p-5 shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure branch coordinates, radius, and employee access.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <input
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          <Field label="Code">
            <input
              value={values.code}
              onChange={(event) => update("code", event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          <Field label="Location Type">
            <select
              value={values.locationType}
              onChange={(event) =>
                update("locationType", event.target.value as CompanyLocationType)
              }
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {locationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={values.status}
              onChange={(event) =>
                update(
                  "status",
                  event.target.value === "active" ? "active" : "inactive",
                )
              }
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Latitude">
            <input
              value={values.latitude}
              inputMode="decimal"
              onChange={(event) => update("latitude", event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          <Field label="Longitude">
            <input
              value={values.longitude}
              inputMode="decimal"
              onChange={(event) => update("longitude", event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          <Field label="Allowed Radius (meters)">
            <input
              value={values.radiusMeters}
              inputMode="numeric"
              onChange={(event) => update("radiusMeters", event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          <label className="flex min-h-11 items-center gap-2 pt-6 text-sm font-medium">
            <input
              type="checkbox"
              checked={values.isDefault}
              onChange={(event) => update("isDefault", event.target.checked)}
            />
            Set as default location
          </label>
          <Field label="Address" className="md:col-span-2">
            <textarea
              value={values.address}
              onChange={(event) => update("address", event.target.value)}
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
        </div>

        <section>
          <h3 className="text-sm font-semibold">Assigned Employees</h3>
          <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2">
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active employees found.
              </p>
            ) : null}
            {employees.map((employee) => (
              <label
                key={employee.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm",
                  values.assignedEmployeeIds.includes(employee.id) &&
                    "border-primary bg-primary/10",
                )}
              >
                <input
                  type="checkbox"
                  checked={values.assignedEmployeeIds.includes(employee.id)}
                  onChange={() => toggleEmployee(employee.id)}
                />
                <span>
                  {employee.name} ({employee.employeeId})
                </span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("space-y-2", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
