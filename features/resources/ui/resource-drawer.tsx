import { ExternalLink, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FeaturedBadge,
  OpenModeBadge,
  ResourceStatusBadge,
  ResourceTypeBadge,
} from "@/features/resources/ui/resource-badges";
import { ResourceIcon } from "@/features/resources/ui/resource-icon";
import type { ResourceListItem } from "@/features/resources/types/resource.types";

type ResourceDrawerProps = {
  resource: ResourceListItem | null;
  onClose: () => void;
};

export function ResourceDrawer({ resource, onClose }: ResourceDrawerProps) {
  if (!resource) {
    return null;
  }

  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex justify-end backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close resource details"
        onClick={onClose}
      />
      <aside className="bg-background shadow-soft relative h-full w-full max-w-md overflow-y-auto border-l">
        <div className="flex h-14 items-center justify-between border-b px-5">
          <h2 className="font-semibold">Resource Details</h2>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="p-5">
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-start gap-4">
              <ResourceIcon
                icon={resource.icon}
                customImage={resource.thumbnail}
                url={resource.url}
                title={resource.title}
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold">{resource.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {resource.categoryName}
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              {resource.description || "No description provided."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ResourceTypeBadge type={resource.resourceType} />
              <OpenModeBadge mode={resource.openMode} />
              <FeaturedBadge featured={resource.isFeatured} />
              <ResourceStatusBadge status={resource.status} />
            </div>
          </div>

          <dl className="bg-card mt-5 space-y-3 rounded-xl border p-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Display Order</dt>
              <dd className="font-medium">{resource.displayOrder}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium">
                {new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(resource.updatedAt))}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-muted-foreground">URL</dt>
              <dd className="font-medium break-all">
                {resource.url || "Internal resource"}
              </dd>
            </div>
          </dl>

          {resource.url ? (
            <Button asChild className="mt-5 w-full">
              <a
                href={resource.url}
                target={resource.openMode === "same_tab" ? undefined : "_blank"}
                rel={
                  resource.openMode === "same_tab"
                    ? undefined
                    : "noreferrer noopener"
                }
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Open Resource
              </a>
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
