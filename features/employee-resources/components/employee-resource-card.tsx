"use client";

import { ExternalLink, Heart, Link2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EmployeePortalResource } from "@/features/employee-resources/types/employee-resource.types";
import { getRenderableImageSrc } from "@/lib/media";

type EmployeeResourceCardProps = {
  resource: EmployeePortalResource;
};

function getTarget(resource: EmployeePortalResource) {
  return resource.openMode === "same_tab" ? undefined : "_blank";
}

function getRel(resource: EmployeePortalResource) {
  return resource.openMode === "same_tab" ? undefined : "noreferrer noopener";
}

export function EmployeeResourceCard({ resource }: EmployeeResourceCardProps) {
  const thumbnailSrc = getRenderableImageSrc(resource.thumbnail);

  return (
    <article className="app-card flex min-h-48 flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {resource.icon ? (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-background/75 text-sm font-semibold shadow-[var(--shadow-soft)]">
              {resource.icon.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/80 shadow-[var(--shadow-soft)]">
              <Link2 className="size-5" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{resource.title}</h3>
            {resource.isFeatured ? (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <Star className="size-3" aria-hidden="true" />
                Featured
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-background/75 text-muted-foreground"
          aria-label="Add to favorites"
          title="Favorites coming soon"
        >
          <Heart className="size-4" aria-hidden="true" />
        </button>
      </div>

      {thumbnailSrc ? (
        <img
          src={thumbnailSrc}
          alt=""
          className="mt-4 aspect-video w-full rounded-2xl border border-white/20 object-cover"
        />
      ) : null}

      <p className="mt-4 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
        {resource.description || "No description provided."}
      </p>

      {resource.url ? (
        <Button asChild className="mt-4 h-10 w-full">
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
        <Button type="button" className="mt-4 h-10 w-full" disabled>
          Internal Resource
        </Button>
      )}
    </article>
  );
}
