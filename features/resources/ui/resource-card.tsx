import { Archive, Copy, Eye, Pencil, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FeaturedBadge,
  OpenModeBadge,
  ResourceStatusBadge,
  ResourceTypeBadge,
} from "@/features/resources/ui/resource-badges";
import { ResourceIcon } from "@/features/resources/ui/resource-icon";
import type {
  ResourceListItem,
} from "@/features/resources/types/resource.types";

type ResourceCardProps = {
  resource: ResourceListItem;
  onView: (resource: ResourceListItem) => void;
  onEdit: (resource: ResourceListItem) => void;
  onDuplicate: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
};

export function ResourceCard({
  resource,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
}: ResourceCardProps) {
  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <ResourceIcon icon={resource.icon} title={resource.title} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{resource.title}</h3>
          <p className="text-sm text-muted-foreground">
            {resource.categoryName}
          </p>
        </div>
        <ResourceStatusBadge status={resource.status} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
        {resource.description || resource.url || "No description"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <ResourceTypeBadge type={resource.resourceType} />
        <OpenModeBadge mode={resource.openMode} />
        <FeaturedBadge featured={resource.isFeatured} />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Last updated{" "}
        {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
          new Date(resource.updatedAt),
        )}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => onView(resource)}>
          <Eye className="size-4" aria-hidden="true" />
          View
        </Button>
        <Button type="button" variant="outline" onClick={() => onEdit(resource)}>
          <Pencil className="size-4" aria-hidden="true" />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onDuplicate(resource.id)}
        >
          <Copy className="size-4" aria-hidden="true" />
          Duplicate
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            resource.status === "archived"
              ? onRestore(resource.id)
              : onArchive(resource.id)
          }
        >
          {resource.status === "archived" ? (
            <RotateCcw className="size-4" aria-hidden="true" />
          ) : (
            <Archive className="size-4" aria-hidden="true" />
          )}
          {resource.status === "archived" ? "Restore" : "Archive"}
        </Button>
      </div>
    </article>
  );
}
