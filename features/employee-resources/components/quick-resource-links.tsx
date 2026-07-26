"use client";

import { Star } from "lucide-react";

import { getPremiumCardClassName } from "@/components/common/premium-card";
import type {
  EmployeePortalCategory,
  EmployeePortalResource,
} from "@/features/employee-resources/types/employee-resource.types";
import { cn } from "@/lib/utils";
import { ResourceVisual } from "@/features/resources/ui/resource-visual";

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
  const resources = flattenResources(categories).sort(
    (first, second) => Number(second.isFeatured) - Number(first.isFeatured),
  );

  if (resources.length === 0) {
    return null;
  }

  return (
    <section
      className="bg-card/95 rounded-[1.45rem] border p-3 shadow-[var(--shadow-card)] sm:p-4"
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

      <div className="grid grid-cols-4 gap-2 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:[grid-template-columns:repeat(auto-fit,minmax(7.5rem,1fr))]">
        {resources.map((resource) => (
          <QuickResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
}

function QuickResourceCard({ resource }: { resource: EmployeePortalResource }) {
  const className = getPremiumCardClassName(
    "cyan",
    "group relative flex min-h-28 min-w-0 touch-manipulation flex-col items-center justify-center gap-2 rounded-[1.35rem] p-2 text-center transition duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] sm:aspect-square sm:min-h-0 sm:gap-2.5 sm:p-3",
  );
  const content = (
    <>
      {resource.isFeatured ? (
        <span
          className="absolute top-2 right-2 inline-flex size-5 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          aria-label="Featured"
          title="Featured"
        >
          <Star className="size-3" aria-hidden="true" />
        </span>
      ) : null}

      <ResourceVisual
        icon={resource.icon}
        customImage={resource.thumbnail}
        url={resource.url}
        title={resource.title}
        className="size-12 transition duration-200 group-hover:scale-105 min-[390px]:size-14 sm:size-16"
      />

      <h3 className="line-clamp-2 min-h-8 w-full text-xs leading-4 font-semibold sm:text-sm">
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
