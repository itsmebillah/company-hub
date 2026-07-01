"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, ShieldCheck, UsersRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import type {
  PermissionEmployee,
  ResourcePermissionActionState,
  ResourcePermissionDraft,
  ResourcePermissionManagementData,
  ResourcePermissionState,
} from "@/features/resource-permissions/types/resource-permission.types";
import { cn } from "@/lib/utils";

type ResourcePermissionPageProps = {
  data: ResourcePermissionManagementData;
  onSave: (
    resourceId: string,
    draft: ResourcePermissionDraft,
  ) => Promise<ResourcePermissionActionState>;
};

function emptyDraft(): ResourcePermissionDraft {
  return {
    isPublic: false,
    roleIds: [],
    employeeIds: [],
  };
}

function toDraft(state: ResourcePermissionState | undefined) {
  if (!state) {
    return emptyDraft();
  }

  return {
    isPublic: state.isPublic,
    roleIds: [...state.roleIds],
    employeeIds: [...state.employeeIds],
  };
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function ResourcePermissionPage({
  data,
  onSave,
}: ResourcePermissionPageProps) {
  const [selectedResourceId, setSelectedResourceId] = useState(
    data.resources[0]?.id ?? "",
  );
  const [resourceSearch, setResourceSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, ResourcePermissionDraft>>(
    () =>
      Object.fromEntries(
        data.permissions.map((permission) => [
          permission.resourceId,
          toDraft(permission),
        ]),
      ),
  );
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const categories = useMemo(
    () =>
      Array.from(
        new Map(
          data.resources.map((resource) => [
            resource.categoryId,
            resource.categoryName,
          ]),
        ),
      ).map(([id, name]) => ({ id, name })),
    [data.resources],
  );

  const filteredResources = useMemo(() => {
    const search = resourceSearch.trim().toLowerCase();

    return data.resources.filter((resource) => {
      const matchesSearch =
        !search || resource.title.toLowerCase().includes(search);
      const matchesCategory =
        !categoryFilter || resource.categoryId === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, data.resources, resourceSearch]);

  const selectedResource = data.resources.find(
    (resource) => resource.id === selectedResourceId,
  );
  const currentDraft = drafts[selectedResourceId] ?? emptyDraft();
  const selectedRoles = data.roles.filter((role) =>
    currentDraft.roleIds.includes(role.id),
  );
  const selectedEmployees = data.employees.filter((employee) =>
    currentDraft.employeeIds.includes(employee.id),
  );
  const inheritedEmployees = data.employees.filter((employee) =>
    currentDraft.roleIds.includes(employee.roleId),
  );
  const filteredEmployees = useMemo(() => {
    const search = employeeSearch.trim().toLowerCase();

    return data.employees.filter((employee) => {
      if (!search) {
        return true;
      }

      return (
        employee.employeeId.toLowerCase().includes(search) ||
        employee.name.toLowerCase().includes(search) ||
        employee.roleName.toLowerCase().includes(search)
      );
    });
  }, [data.employees, employeeSearch]);

  function updateDraft(nextDraft: ResourcePermissionDraft) {
    setDrafts((current) => ({
      ...current,
      [selectedResourceId]: nextDraft,
    }));
  }

  function togglePublic() {
    updateDraft(
      currentDraft.isPublic
        ? emptyDraft()
        : { isPublic: true, roleIds: [], employeeIds: [] },
    );
  }

  function toggleRole(roleId: string) {
    updateDraft({
      ...currentDraft,
      isPublic: false,
      roleIds: toggleValue(currentDraft.roleIds, roleId),
    });
  }

  function toggleEmployee(employeeId: string) {
    updateDraft({
      ...currentDraft,
      isPublic: false,
      employeeIds: toggleValue(currentDraft.employeeIds, employeeId),
    });
  }

  function resetDraft() {
    const original = data.permissions.find(
      (permission) => permission.resourceId === selectedResourceId,
    );
    updateDraft(toDraft(original));
    setMessage("Changes cancelled.");
  }

  function saveDraft() {
    if (!selectedResourceId) {
      return;
    }

    setMessage("");
    startTransition(async () => {
      const result = await onSave(selectedResourceId, currentDraft);
      setMessage(result.message);
    });
  }

  if (data.resources.length === 0) {
    return (
      <EmptyState
        title="No active resources"
        description="Create active resources before assigning permissions."
        className="bg-card shadow-sm"
      />
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="rounded-xl border bg-card p-4 shadow-sm">
        <div>
          <h2 className="text-base font-semibold">Resources</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a resource to manage access.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <label className="relative block">
            <span className="sr-only">Search resource</span>
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={resourceSearch}
              onChange={(event) => setResourceSearch(event.target.value)}
              placeholder="Search resource"
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto pr-1">
          {filteredResources.map((resource) => (
            <button
              key={resource.id}
              type="button"
              onClick={() => {
                setSelectedResourceId(resource.id);
                setMessage("");
              }}
              className={cn(
                "w-full rounded-lg border bg-background p-3 text-left transition hover:border-ring",
                resource.id === selectedResourceId && "border-primary bg-primary/10",
              )}
            >
              <p className="font-medium">{resource.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {resource.categoryName}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <div className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Permission Editor</p>
            <h1 className="text-2xl font-semibold">
              {selectedResource?.title ?? "Select a resource"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedResource?.categoryName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={resetDraft}>
              Cancel
            </Button>
            <Button type="button" onClick={saveDraft} disabled={isPending}>
              <ShieldCheck className="size-4" aria-hidden="true" />
              Save
            </Button>
          </div>
        </div>

        {message ? (
          <p className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}

        <section className="rounded-xl border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Public Access</h2>
              <p className="text-sm text-muted-foreground">
                All active employees can access this resource.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={currentDraft.isPublic}
                onChange={togglePublic}
                className="size-4"
              />
              <span className="text-sm font-medium">Public</span>
            </label>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border bg-background p-4">
            <h2 className="font-semibold">Role Access</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Select one or more roles.
            </p>
            <div className="space-y-2">
              {data.roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2"
                >
                  <span className="text-sm font-medium">{role.name}</span>
                  <input
                    type="checkbox"
                    checked={currentDraft.roleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    disabled={currentDraft.isPublic}
                    className="size-4"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-background p-4">
            <h2 className="font-semibold">Employee Access</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Select individual employees.
            </p>
            <label className="relative mb-3 block">
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                value={employeeSearch}
                onChange={(event) => setEmployeeSearch(event.target.value)}
                placeholder="Search employee ID, name, role"
                className="h-10 w-full rounded-md border bg-card pl-9 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {filteredEmployees.map((employee) => (
                <EmployeePermissionRow
                  key={employee.id}
                  employee={employee}
                  checked={currentDraft.employeeIds.includes(employee.id)}
                  disabled={currentDraft.isPublic}
                  onToggle={() => toggleEmployee(employee.id)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <PermissionSummary
            title="Current Permissions"
            values={
              currentDraft.isPublic
                ? ["Public"]
                : [
                    ...selectedRoles.map((role) => role.name),
                    ...selectedEmployees.map(
                      (employee) => `${employee.name} (${employee.employeeId})`,
                    ),
                  ]
            }
            emptyLabel="No employees can access this resource."
          />
          <PermissionSummary
            title="Inherited Through Roles"
            values={inheritedEmployees.map(
              (employee) => `${employee.name} · ${employee.roleName}`,
            )}
            emptyLabel="No inherited access."
          />
          <PermissionSummary
            title="Direct Employees"
            values={selectedEmployees.map(
              (employee) => `${employee.name} · ${employee.employeeId}`,
            )}
            emptyLabel="No direct employees selected."
          />
        </section>
      </div>
    </section>
  );
}

function EmployeePermissionRow({
  employee,
  checked,
  disabled,
  onToggle,
}: {
  employee: PermissionEmployee;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2">
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {employee.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {employee.employeeId} · {employee.roleName}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className="size-4"
      />
    </label>
  );
}

function PermissionSummary({
  title,
  values,
  emptyLabel,
}: {
  title: string;
  values: string[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2">
        <UsersRound className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      {values.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium"
            >
              {value}
              <X className="size-3 text-muted-foreground" aria-hidden="true" />
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}
