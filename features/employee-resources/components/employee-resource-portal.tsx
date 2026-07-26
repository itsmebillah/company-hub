"use client";

import { EmptyState } from "@/components/common/empty-state";
import { EmployeeResourceCard } from "@/features/employee-resources/components/employee-resource-card";
import { QuickResourceLinks } from "@/features/employee-resources/components/quick-resource-links";
import type { EmployeeResourcePortalData } from "@/features/employee-resources/types/employee-resource.types";

type EmployeeResourcePortalProps = {
  data: EmployeeResourcePortalData;
  showQuickLinks?: boolean;
  showKnowledge?: boolean;
};

export function EmployeeResourcePortal({
  data,
  showQuickLinks = true,
  showKnowledge = true,
}: EmployeeResourcePortalProps) {
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
    <section className="space-y-4" aria-label="Company Hub resources">
      {showQuickLinks ? (
        <div id="quick-links" className="scroll-mt-28">
          <QuickResourceLinks categories={data.categories} />
        </div>
      ) : null}
      {showKnowledge ? (
        <div
          id="knowledge-hub"
          className="scroll-mt-28 space-y-3"
          aria-label="Resources by category"
        >
          {data.categories.map((category) => (
            <div
              key={category.id}
              className="app-card app-card-subtle space-y-3 p-3 sm:p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold text-white shadow-[var(--shadow-soft)]"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.icon
                      ? category.icon.slice(0, 2).toUpperCase()
                      : "R"}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold sm:text-base">
                      {category.name}
                    </h2>
                    <p className="text-muted-foreground text-[11px] sm:text-xs">
                      Curated employee links
                    </p>
                  </div>
                </div>
                <div
                  className="border-border/60 bg-background/80 text-muted-foreground shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium"
                  aria-label={`${category.resources.length} resources`}
                >
                  {category.resources.length} item
                  {category.resources.length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {category.resources.map((resource) => (
                  <EmployeeResourceCard
                    key={resource.id}
                    resource={resource}
                    categoryName={category.name}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
