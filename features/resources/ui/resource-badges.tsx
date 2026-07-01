import { Star } from "lucide-react";

import type {
  ResourceOpenMode,
  ResourceStatus,
  ResourceType,
} from "@/features/resources/types/resource.types";
import {
  getOpenModeLabel,
  getResourceTypeLabel,
} from "@/features/resources/constants/resource-options";
import { cn } from "@/lib/utils";

const statusClasses = {
  active:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  inactive:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  archived:
    "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800",
};

export function ResourceStatusBadge({ status }: { status: ResourceStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1",
        statusClasses[status],
      )}
    >
      {status}
    </span>
  );
}

export function ResourceTypeBadge({ type }: { type: ResourceType }) {
  return (
    <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
      {getResourceTypeLabel(type)}
    </span>
  );
}

export function OpenModeBadge({ mode }: { mode: ResourceOpenMode }) {
  return (
    <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
      {getOpenModeLabel(mode)}
    </span>
  );
}

export function FeaturedBadge({ featured }: { featured: boolean }) {
  return featured ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900">
      <Star className="size-3" aria-hidden="true" />
      Featured
    </span>
  ) : (
    <span className="text-sm text-muted-foreground">No</span>
  );
}
