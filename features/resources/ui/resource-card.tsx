import { Archive, Copy, Eye, Pencil, RotateCcw } from "lucide-react";

import { PremiumCard } from "@/components/common/premium-card";
import { Button } from "@/components/ui/button";
import { ResourceIcon } from "@/features/resources/ui/resource-icon";
import {
  getOpenModeLabel,
  getResourceTypeLabel,
} from "@/features/resources/constants/resource-options";
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
  const typeLabel = getResourceTypeLabel(resource.resourceType);
  const openModeLabel = getOpenModeLabel(resource.openMode);
  const urlLabel = resource.url || "Internal page";
  const statusTone =
    resource.status === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
      : resource.status === "inactive"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
        : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";

  return (
    <PremiumCard tone="cyan" className="overflow-hidden p-3">
      <div className="flex items-start gap-3">
        <ResourceIcon icon={resource.icon} title={resource.title} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold leading-5">
                {resource.title}
              </h3>
              <p className="truncate text-[11px] text-muted-foreground">
                {resource.categoryName}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${statusTone}`}
            >
              {resource.status}
            </span>
          </div>
          <p
            className="mt-1 truncate text-[11px] text-muted-foreground"
            title={urlLabel}
          >
            {urlLabel}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="inline-flex rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {typeLabel}
        </span>
        <span className="inline-flex rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {openModeLabel}
        </span>
        {resource.isFeatured ? (
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
            Featured
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Updated{" "}
        {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
          new Date(resource.updatedAt),
        )}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-xl px-2.5"
          onClick={() => onView(resource)}
        >
          <Eye className="size-3.5" aria-hidden="true" />
          View
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-xl px-2.5"
          onClick={() => onEdit(resource)}
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-xl px-2.5"
          onClick={() => onDuplicate(resource.id)}
        >
          <Copy className="size-3.5" aria-hidden="true" />
          Duplicate
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-xl px-2.5"
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
    </PremiumCard>
  );
}
