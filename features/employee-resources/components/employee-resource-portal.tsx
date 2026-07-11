"use client";

import { EmptyState } from "@/components/common/empty-state";
import { EmployeeResourceCard } from "@/features/employee-resources/components/employee-resource-card";
import type { EmployeeResourcePortalData } from "@/features/employee-resources/types/employee-resource.types";

type EmployeeResourcePortalProps = {
  data: EmployeeResourcePortalData;
};

export function EmployeeResourcePortal({ data }: EmployeeResourcePortalProps) {
  if (data.categories.length === 0) {
    return (
      <EmptyState
        title="No Resources Available"
        description="No active resources are available for your role right now."
        className="bg-card shadow-sm"
      />
    );
  }

  return (
    <section className="space-y-4" aria-label="Resources by category">
      {data.categories.map((category) => (
        <div key={category.id} className="app-card app-card-subtle space-y-4 p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-[var(--shadow-soft)]"
              style={{ backgroundColor: category.color }}
            >
              {category.icon ? category.icon.slice(0, 2).toUpperCase() : "R"}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">
                {category.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {category.resources.length} resource
                {category.resources.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {category.resources.map((resource) => (
              <EmployeeResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
