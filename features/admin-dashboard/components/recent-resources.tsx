import { FolderKanban } from "lucide-react";

import { ResourceTypeBadge } from "@/features/resources/ui/resource-badges";
import type { DashboardResource } from "@/features/admin-dashboard/types/dashboard.types";

type RecentResourcesProps = {
  resources: DashboardResource[];
};

export function RecentResources({ resources }: RecentResourcesProps) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Recent Resources</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest resources available in Company Hub.
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
          <FolderKanban className="size-5" aria-hidden="true" />
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed bg-background p-6 text-center">
          <FolderKanban className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No Resources</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Resources will appear here after they are created.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{resource.title}</p>
                <p className="text-xs text-muted-foreground">
                  {resource.categoryName}
                </p>
              </div>
              <ResourceTypeBadge type={resource.resourceType} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
