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
    .sort((first, second) => Number(second.isFeatured) - Number(first.isFeatured));

  if (resources.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-[1.45rem] border bg-card/95 p-3 shadow-[var(--shadow-card)] sm:p-4"
      aria-labelledby="quick-resource-links-title"
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2
            id="quick-resource-links-title"
            className="text-sm font-semibold sm:text-base"
          >
            Quick Resource Links
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:grid-cols-4 xl:[grid-template-columns:repeat(auto-fit,minmax(7.75rem,1fr))]">
        {resources.map((resource) => (
          <QuickResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
}

function QuickResourceCard({ resource }: { resource: EmployeePortalResource }) {
  const className =
    "group relative flex aspect-square min-w-0 flex-col items-center justify-center gap-2 rounded-[1.25rem] border border-white/20 bg-background/75 p-2 text-center shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-3";
  const content = (
    <>
      {resource.isFeatured ? (
        <span
          className="absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          aria-label="Featured"
          title="Featured"
        >
          <Star className="size-3" aria-hidden="true" />
        </span>
      ) : null}

      <div className="flex size-9 items-center justify-center rounded-2xl border border-white/20 bg-primary/8 text-primary sm:size-10">
        {resource.icon ? (
          <span className="text-xs font-semibold sm:text-sm">
            {resource.icon.slice(0, 2).toUpperCase()}
          </span>
        ) : (
          <Link2 className="size-4 sm:size-5" aria-hidden="true" />
        )}
      </div>

      <h3 className="line-clamp-2 min-h-8 w-full text-[0.72rem] font-semibold leading-4 sm:text-xs">
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
