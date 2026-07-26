"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, Plus, ShieldCheck, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { ResourceCard } from "@/features/resources/ui/resource-card";
import { ResourceDrawer } from "@/features/resources/ui/resource-drawer";
import { ResourceFilters } from "@/features/resources/ui/resource-filters";
import { ResourceForm } from "@/features/resources/ui/resource-form";
import { ResourceTable } from "@/features/resources/ui/resource-table";
import type {
  ResourceActionState,
  ResourceCategoryOption,
  ResourceFormValues,
  ResourceListResult,
  ResourceListItem,
} from "@/features/resources/types/resource.types";

type ResourceManagementPageProps = {
  result: ResourceListResult;
  categories: ResourceCategoryOption[];
  filters: {
    search: string;
    categoryId: string;
    resourceType: string;
    status: string;
    featured: string;
    sort: string;
  };
  onCreate: (values: ResourceFormValues) => Promise<ResourceActionState>;
  onUpdate: (
    id: string,
    values: ResourceFormValues,
  ) => Promise<ResourceActionState>;
  onDuplicate: (id: string) => Promise<ResourceActionState>;
  onDelete: (id: string) => Promise<ResourceActionState>;
  onArchive: (id: string) => Promise<ResourceActionState>;
  onRestore: (id: string) => Promise<ResourceActionState>;
};

export function ResourceManagementPage({
  result,
  categories,
  filters,
  onCreate,
  onUpdate,
  onDuplicate,
  onDelete,
  onArchive,
  onRestore,
}: ResourceManagementPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedResource, setSelectedResource] =
    useState<ResourceListItem | null>(null);
  const [editingResource, setEditingResource] =
    useState<ResourceListItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");

  function updateFilters(nextFilters: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { ...filters, ...nextFilters };

    Object.entries(merged).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    router.replace(`/admin/resources?${params.toString()}`);
  }

  async function runStatusAction(
    action: (id: string) => Promise<ResourceActionState>,
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

  function closeForm() {
    setIsCreating(false);
    setEditingResource(null);
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resources</h1>
          <p className="text-muted-foreground text-sm">
            Manage employee links, reports, documents, and internal tools
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
          <Button asChild size="sm" variant="outline" className="h-9">
            <Link href="/admin/resources/categories">
              <Tags className="size-4" aria-hidden="true" />
              Categories
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-9">
            <Link href="/admin/resources/permissions">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Permissions
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            className="col-span-2 h-9 sm:col-span-1"
            onClick={() => setIsCreating(true)}
            disabled={categories.length === 0}
          >
            <Plus className="size-4" aria-hidden="true" />
            New Resource
          </Button>
        </div>
      </div>

      <ResourceFilters
        categories={categories}
        search={filters.search}
        categoryId={filters.categoryId}
        resourceType={filters.resourceType}
        status={filters.status}
        featured={filters.featured}
        sort={filters.sort}
        onChange={updateFilters}
        onReset={() => router.replace("/admin/resources")}
      />

      {message ? (
        <p className="text-muted-foreground text-sm">{message}</p>
      ) : null}
      {isPending ? (
        <p className="text-muted-foreground text-sm">Updating resource...</p>
      ) : null}

      {categories.length === 0 ? (
        <EmptyState
          title="No categories found"
          description="Create an active category before adding resources."
          className="bg-card shadow-sm"
          action={
            <Button asChild>
              <Link href="/admin/resources/categories">
                <Tags className="size-4" aria-hidden="true" />
                Create Category
              </Link>
            </Button>
          }
        />
      ) : result.resources.length > 0 ? (
        <>
          <ResourceTable
            resources={result.resources}
            onView={setSelectedResource}
            onEdit={setEditingResource}
            onDuplicate={(id) => runStatusAction(onDuplicate, id)}
            onArchive={(id) => runStatusAction(onArchive, id)}
            onRestore={(id) => runStatusAction(onRestore, id)}
          />
          <div className="grid gap-2.5 lg:hidden">
            {result.resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onView={setSelectedResource}
                onEdit={setEditingResource}
                onDuplicate={(id) => runStatusAction(onDuplicate, id)}
                onDelete={(id) => runStatusAction(onDelete, id)}
                onArchive={(id) => runStatusAction(onArchive, id)}
                onRestore={(id) => runStatusAction(onRestore, id)}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="No resources found"
          description="Create a resource or adjust the current filters."
          className="bg-card shadow-sm"
          action={
            <Button type="button" onClick={() => setIsCreating(true)}>
              <FolderKanban className="size-4" aria-hidden="true" />
              Create Resource
            </Button>
          }
        />
      )}

      {isCreating || editingResource ? (
        <ResourceForm
          resource={editingResource}
          categories={categories}
          onClose={closeForm}
          onSubmit={
            editingResource
              ? (values) => onUpdate(editingResource.id, values)
              : onCreate
          }
        />
      ) : null}

      <ResourceDrawer
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
      />
    </section>
  );
}
