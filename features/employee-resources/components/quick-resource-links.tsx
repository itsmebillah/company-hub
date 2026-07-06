"use client";

import { ExternalLink, Link2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  EmployeePortalCategory,
  EmployeePortalResource,
} from "@/features/employee-resources/types/employee-resource.types";

type QuickResourceLinksProps = {
  categories: EmployeePortalCategory[];
};

const resourceTypeLabels: Record<string, string> = {
  apps_script: "Apps Script",
  google_sheet: "Google Sheet",
  power_bi: "Power BI",
  looker: "Looker",
  website: "Website",
  pdf: "PDF",
  drive: "Drive",
  youtube: "Video",
  internal: "Internal Page",
};

function getTarget(resource: EmployeePortalResource) {
  return resource.openMode === "same_tab" ? undefined : "_blank";
}

function getRel(resource: EmployeePortalResource) {
  return resource.openMode === "same_tab" ? undefined : "noreferrer noopener";
}

function flattenResources(categories: EmployeePortalCategory[]) {
  return categories.flatMap((category) =>
    category.resources.map((resource) => ({
      ...resource,
      categoryName: category.name,
    })),
  );
}

export function QuickResourceLinks({ categories }: QuickResourceLinksProps) {
  const resources = flattenResources(categories)
    .sort((first, second) => Number(second.isFeatured) - Number(first.isFeatured))
    .slice(0, 8);

  if (resources.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" aria-labelledby="quick-resource-links-title">
      <div className="flex items-end justify-between gap-3">
        <div>
        <h2 id="quick-resource-links-title" className="text-base font-semibold">
          Quick Resource Links
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Open approved company applications and documents.
        </p>
        </div>
      </div>

      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 xl:grid-cols-4">
        {resources.map((resource) => (
          <article
            key={resource.id}
            className="flex min-h-40 w-44 shrink-0 snap-start flex-col rounded-xl border bg-card p-3 shadow-sm sm:w-auto"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                {resource.icon ? (
                  <span className="text-sm font-semibold">
                    {resource.icon.slice(0, 2).toUpperCase()}
                  </span>
                ) : (
                  <Link2 className="size-4" aria-hidden="true" />
                )}
              </div>
              {resource.isFeatured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[0.68rem] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <Star className="size-3" aria-hidden="true" />
                Featured
              </span>
            ) : null}
            </div>

            <div className="mt-3 min-w-0">
              <h3 className="line-clamp-2 text-sm font-semibold">
                {resource.title}
              </h3>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {resourceTypeLabels[resource.resourceType] ??
                  resource.categoryName}
              </p>
            </div>

            <p className="mt-2 line-clamp-2 flex-1 text-xs leading-5 text-muted-foreground">
              {resource.description || resource.categoryName}
            </p>

            {resource.url ? (
              <Button asChild size="sm" className="mt-4 h-9 w-full">
                <a
                  href={resource.url}
                  target={getTarget(resource)}
                  rel={getRel(resource)}
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Open
                </a>
              </Button>
            ) : (
              <Button type="button" size="sm" className="mt-4 h-9 w-full" disabled>
                Internal
              </Button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
