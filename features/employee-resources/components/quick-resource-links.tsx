"use client";

import { Link2, Star } from "lucide-react";

import type {
  EmployeePortalCategory,
  EmployeePortalResource,
} from "@/features/employee-resources/types/employee-resource.types";
import { cn } from "@/lib/utils";

type QuickResourceLinksProps = {
  categories: EmployeePortalCategory[];
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
    <section
      className="space-y-3 rounded-2xl border bg-card p-3 shadow-sm sm:p-4"
      aria-labelledby="quick-resource-links-title"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2
            id="quick-resource-links-title"
            className="text-base font-semibold"
          >
            Quick Resource Links
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Open approved company applications and documents.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {resources.map((resource) => (
          <QuickResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
}

function QuickResourceCard({ resource }: { resource: EmployeePortalResource }) {
  const className =
    "group relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border bg-background p-2.5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-ring hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-32 sm:p-3";
  const content = (
    <>
      {resource.isFeatured ? (
        <span
          className="absolute right-1.5 top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          aria-label="Featured"
          title="Featured"
        >
          <Star className="size-3" aria-hidden="true" />
        </span>
      ) : null}

      <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground sm:size-11">
        {resource.icon ? (
          <span className="text-xs font-semibold sm:text-sm">
            {resource.icon.slice(0, 2).toUpperCase()}
          </span>
        ) : (
          <Link2 className="size-4 sm:size-5" aria-hidden="true" />
        )}
      </div>

      <h3 className="line-clamp-2 min-h-8 w-full text-xs font-semibold leading-4 sm:text-sm sm:leading-5">
        {resource.title}
      </h3>
    </>
  );

  if (!resource.url) {
    return (
      <div
        className={cn(className, "cursor-not-allowed opacity-70")}
        aria-disabled="true"
        title="Internal resource"
      >
        {content}
      </div>
    );
  }

  return (
    <a
      href={resource.url}
      target={getTarget(resource)}
      rel={getRel(resource)}
      className={className}
      aria-label={`Open ${resource.title}`}
    >
      {content}
    </a>
  );
}
