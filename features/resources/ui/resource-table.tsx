import { Archive, Copy, Eye, Pencil, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FeaturedBadge,
  ResourceStatusBadge,
  ResourceTypeBadge,
} from "@/features/resources/ui/resource-badges";
import { ResourceIcon } from "@/features/resources/ui/resource-icon";
import type {
  ResourceListItem,
} from "@/features/resources/types/resource.types";

type ResourceTableProps = {
  resources: ResourceListItem[];
  onView: (resource: ResourceListItem) => void;
  onEdit: (resource: ResourceListItem) => void;
  onDuplicate: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
};

export function ResourceTable({
  resources,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
}: ResourceTableProps) {
  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  return (
    <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm lg:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Icon</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last Updated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr key={resource.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <ResourceIcon icon={resource.icon} title={resource.title} />
                </td>
                <td className="max-w-72 px-4 py-3">
                  <p className="font-medium">{resource.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {resource.description || resource.url || "No description"}
                  </p>
                </td>
                <td className="px-4 py-3">{resource.categoryName}</td>
                <td className="px-4 py-3">
                  <ResourceTypeBadge type={resource.resourceType} />
                </td>
                <td className="px-4 py-3">
                  <FeaturedBadge featured={resource.isFeatured} />
                </td>
                <td className="px-4 py-3">
                  <ResourceStatusBadge status={resource.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(resource.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onView(resource)}
                      aria-label="View resource"
                    >
                      <Eye className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(resource)}
                      aria-label="Edit resource"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onDuplicate(resource.id)}
                      aria-label="Duplicate resource"
                    >
                      <Copy className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        resource.status === "archived"
                          ? onRestore(resource.id)
                          : onArchive(resource.id)
                      }
                      aria-label={
                        resource.status === "archived"
                          ? "Restore resource"
                          : "Archive resource"
                      }
                    >
                      {resource.status === "archived" ? (
                        <RotateCcw className="size-4" aria-hidden="true" />
                      ) : (
                        <Archive className="size-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
