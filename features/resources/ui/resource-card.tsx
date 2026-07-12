import type { ReactNode } from "react";
import { Archive, Copy, Eye, Link2, Pencil, RotateCcw } from "lucide-react";

import {
  PremiumCard,
  PremiumIconContainer,
} from "@/components/common/premium-card";
import { Button } from "@/components/ui/button";
import {
  getOpenModeLabel,
  getResourceTypeLabel,
} from "@/features/resources/constants/resource-options";
import type {
  ResourceListItem,
} from "@/features/resources/types/resource.types";
import { getRenderableImageSrc } from "@/lib/media";

type ResourceCardProps = {
  resource: ResourceListItem;
  onView: (resource: ResourceListItem) => void;
  onEdit: (resource: ResourceListItem) => void;
  onDuplicate: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
};

function CompactBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "muted";
}) {
  const classes = {
    neutral:
      "border border-border/60 bg-background/80 text-muted-foreground",
    accent:
      "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    success:
      "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    warning:
      "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    muted:
      "border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
  } as const;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${classes[tone]}`}
    >
      {children}
    </span>
  );
}

function renderAdminResourceIcon(resource: ResourceListItem) {
  if (resource.icon.trim()) {
    return (
      <PremiumIconContainer className="size-9 text-xs font-semibold">
        {resource.icon.slice(0, 2).toUpperCase()}
      </PremiumIconContainer>
    );
  }

  return <PremiumIconContainer icon={Link2} className="size-9" />;
}

export function ResourceCard({
  resource,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
}: ResourceCardProps) {
  const thumbnailSrc = getRenderableImageSrc(resource.thumbnail);
  const typeLabel = getResourceTypeLabel(resource.resourceType);
  const openModeLabel = getOpenModeLabel(resource.openMode);
  const urlLabel = resource.url || "Internal page";
  const statusTone =
    resource.status === "active"
      ? "success"
      : resource.status === "inactive"
        ? "warning"
        : "muted";

  return (
    <PremiumCard tone="cyan" className="overflow-hidden p-3">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {renderAdminResourceIcon(resource)}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold leading-5">
                {resource.title}
              </h3>
              <p className="truncate text-[11px] text-muted-foreground">
                {resource.categoryName}
              </p>
              <p
                className="mt-1 truncate text-[11px] text-muted-foreground"
                title={urlLabel}
              >
                {urlLabel}
              </p>
            </div>
            {resource.isFeatured ? (
              <CompactBadge tone="accent">Featured</CompactBadge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <CompactBadge>{typeLabel}</CompactBadge>
        <CompactBadge>{openModeLabel}</CompactBadge>
        {thumbnailSrc ? <CompactBadge>Preview</CompactBadge> : null}
        <CompactBadge tone={statusTone}>{resource.status}</CompactBadge>
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Updated{" "}
        {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
          new Date(resource.updatedAt),
        )}
      </p>

      <div className="mt-3 space-y-2">
        <Button
          type="button"
          size="sm"
          className="h-8 w-full rounded-xl"
          onClick={() => onView(resource)}
        >
          <Eye className="size-3.5" aria-hidden="true" />
          View Resource
        </Button>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-xl px-2"
            onClick={() => onEdit(resource)}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-xl px-2"
            onClick={() => onDuplicate(resource.id)}
          >
            <Copy className="size-3.5" aria-hidden="true" />
            Duplicate
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-xl px-2"
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
      </div>
    </PremiumCard>
  );
}
