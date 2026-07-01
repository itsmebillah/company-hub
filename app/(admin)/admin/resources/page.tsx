import {
  archiveResourceAction,
  createResourceAction,
  duplicateResourceAction,
  restoreResourceAction,
  updateResourceAction,
} from "@/features/resources/actions/resource.actions";
import {
  getResourceCategories,
  listResources,
} from "@/features/resources/services/resource.service";
import { ResourceManagementPage } from "@/features/resources/ui";
import type {
  ResourceSort,
  ResourceStatus,
  ResourceType,
} from "@/features/resources/types/resource.types";

export const dynamic = "force-dynamic";

type AdminResourcesPageProps = {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    resourceType?: string;
    status?: string;
    featured?: string;
    sort?: string;
  }>;
};

function parseResourceType(value: string | undefined): ResourceType | "all" {
  if (
    value === "google_sheet" ||
    value === "apps_script" ||
    value === "power_bi" ||
    value === "looker" ||
    value === "website" ||
    value === "pdf" ||
    value === "internal"
  ) {
    return value;
  }

  return "all";
}

function parseStatus(value: string | undefined): ResourceStatus | "all" {
  if (value === "active" || value === "inactive" || value === "archived") {
    return value;
  }

  return "all";
}

function parseFeatured(value: string | undefined) {
  return value === "true" || value === "false" ? value : "all";
}

function parseSort(value: string | undefined): ResourceSort {
  if (
    value === "display_order" ||
    value === "title" ||
    value === "created_at" ||
    value === "status"
  ) {
    return value;
  }

  return "display_order";
}

export default async function AdminResourcesPage({
  searchParams,
}: AdminResourcesPageProps) {
  const params = await searchParams;
  const [categories, result] = await Promise.all([
    getResourceCategories(),
    listResources({
      search: params.search,
      categoryId: params.categoryId,
      resourceType: parseResourceType(params.resourceType),
      status: parseStatus(params.status),
      featured: parseFeatured(params.featured),
      sort: parseSort(params.sort),
    }),
  ]);

  return (
    <ResourceManagementPage
      result={result}
      categories={categories}
      filters={{
        search: params.search ?? "",
        categoryId: params.categoryId ?? "",
        resourceType: params.resourceType ?? "",
        status: params.status ?? "",
        featured: params.featured ?? "",
        sort: params.sort ?? "display_order",
      }}
      onCreate={createResourceAction}
      onUpdate={updateResourceAction}
      onDuplicate={duplicateResourceAction}
      onArchive={archiveResourceAction}
      onRestore={restoreResourceAction}
    />
  );
}
