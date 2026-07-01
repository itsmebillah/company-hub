import { FolderKanban } from "lucide-react";

import type { EmployeePortalCategory } from "@/features/employee-resources/types/employee-resource.types";

type CategoryCardProps = {
  category: EmployeePortalCategory;
  isActive: boolean;
  onSelect: (id: string) => void;
};

export function CategoryCard({
  category,
  isActive,
  onSelect,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      className="rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-ring data-[active=true]:border-primary data-[active=true]:bg-primary/10"
      data-active={isActive}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: category.color }}
        >
          {category.icon ? (
            <span className="text-sm font-semibold">
              {category.icon.slice(0, 2).toUpperCase()}
            </span>
          ) : (
            <FolderKanban className="size-5" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{category.name}</p>
          <p className="text-sm text-muted-foreground">
            {category.resources.length} resource
            {category.resources.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </button>
  );
}
