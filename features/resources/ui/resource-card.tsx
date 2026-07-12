import { Archive, Copy, Eye, Pencil, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmployeeResourceCard } from "@/features/employee-resources/components/employee-resource-card";
import type { EmployeePortalResource } from "@/features/employee-resources/types/employee-resource.types";
import type { ResourceListItem } from "@/features/resources/types/resource.types";

type ResourceCardProps = {
  resource: ResourceListItem;
  onView: (resource: ResourceListItem) => void;
  onEdit: (resource: ResourceListItem) => void;
  onDuplicate: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
};

function toEmployeePortalResource(
  resource: ResourceListItem,
): EmployeePortalResource {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    resourceType: resource.resourceType,
    url: resource.url,
    icon: resource.icon,
    thumbnail: resource.thumbnail,
    openMode: resource.openMode,
    isFeatured: resource.isFeatured,
  };
}

export function ResourceCard({
  resource,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
}: ResourceCardProps) {
  return (
    <EmployeeResourceCard
      resource={toEmployeePortalResource(resource)}
      categoryName={resource.categoryName}
      extraBadges={
        resource.status !== "active" ? (
          <span
            className={
              resource.status === "archived"
                ? "inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                : "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
            }
          >
            {resource.status}
          </span>
        ) : null
      }
      primaryAction={
        <Button
          type="button"
          size="sm"
          className="h-8 w-full rounded-xl"
          onClick={() => onView(resource)}
        >
          <Eye className="size-3.5" aria-hidden="true" />
          View Resource
        </Button>
      }
      footer={
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-xl px-2 text-xs"
            onClick={() => onEdit(resource)}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-xl px-2 text-xs"
            onClick={() => onDuplicate(resource.id)}
          >
            <Copy className="size-3.5" aria-hidden="true" />
            Duplicate
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-xl px-2 text-xs"
            onClick={() =>
              resource.status === "archived"
                ? onRestore(resource.id)
                : onArchive(resource.id)
            }
          >
            {resource.status === "archived" ? (
              <RotateCcw className="size-3.5" aria-hidden="true" />
            ) : (
              <Archive className="size-3.5" aria-hidden="true" />
            )}
            {resource.status === "archived" ? "Restore" : "Archive"}
          </Button>
        </div>
      }
    />
  );
}
