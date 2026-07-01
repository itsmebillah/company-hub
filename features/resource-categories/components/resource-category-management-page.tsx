"use client";

import { useState, useTransition } from "react";
import { Archive, FolderKanban, Pencil, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { ResourceCategoryForm } from "@/features/resource-categories/components/resource-category-form";
import type {
  ResourceCategoryActionState,
  ResourceCategoryFormValues,
  ResourceCategoryListItem,
} from "@/features/resource-categories/types/resource-category.types";

type ResourceCategoryManagementPageProps = {
  categories: ResourceCategoryListItem[];
  onCreate: (
    values: ResourceCategoryFormValues,
  ) => Promise<ResourceCategoryActionState>;
  onUpdate: (
    id: string,
    values: ResourceCategoryFormValues,
  ) => Promise<ResourceCategoryActionState>;
  onArchive: (id: string) => Promise<ResourceCategoryActionState>;
  onRestore: (id: string) => Promise<ResourceCategoryActionState>;
};

export function ResourceCategoryManagementPage({
  categories,
  onCreate,
  onUpdate,
  onArchive,
  onRestore,
}: ResourceCategoryManagementPageProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ResourceCategoryListItem | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function closeForm() {
    setIsCreating(false);
    setEditingCategory(null);
    router.refresh();
  }

  function runStatusAction(
    action: (id: string) => Promise<ResourceCategoryActionState>,
    id: string,
  ) {
    setMessage("");
    startTransition(async () => {
      const result = await action(id);
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resource Categories</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage the categories used by resources.
          </p>
        </div>
        <Button type="button" onClick={() => setIsCreating(true)}>
          <Plus className="size-4" />
          New Category
        </Button>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {isPending ? (
        <p className="text-sm text-muted-foreground">Updating category...</p>
      ) : null}

      {categories.length === 0 ? (
        <EmptyState
          title="No categories found"
          description="Create a category before creating resources."
          className="bg-card shadow-sm"
          action={
            <Button type="button" onClick={() => setIsCreating(true)}>
              <FolderKanban className="size-4" />
              Create Category
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.id}
              className="rounded-xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex size-10 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.icon ? (
                      <span className="text-sm font-semibold">
                        {category.icon.slice(0, 2).toUpperCase()}
                      </span>
                    ) : (
                      <FolderKanban className="size-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{category.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Order {category.displayOrder}
                    </p>
                  </div>
                </div>
                <span className="rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                  {category.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCategory(category)}
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    category.status === "archived"
                      ? runStatusAction(onRestore, category.id)
                      : runStatusAction(onArchive, category.id)
                  }
                >
                  {category.status === "archived" ? (
                    <RotateCcw className="size-4" />
                  ) : (
                    <Archive className="size-4" />
                  )}
                  {category.status === "archived" ? "Restore" : "Archive"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {isCreating || editingCategory ? (
        <ResourceCategoryForm
          category={editingCategory}
          onClose={closeForm}
          onSubmit={
            editingCategory
              ? (values) => onUpdate(editingCategory.id, values)
              : onCreate
          }
        />
      ) : null}
    </section>
  );
}
