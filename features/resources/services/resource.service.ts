import "server-only";

import { logActivity } from "@/features/activity/utils/activity-log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  RESOURCE_SORTS,
} from "@/features/resources/constants/resource-options";
import { ResourceValidationService } from "@/features/resources/services/resource-validation.service";
import type {
  ResourceCategoryOption,
  ResourceFilters,
  ResourceFormValues,
  ResourceListItem,
  ResourceListResult,
  ResourceSort,
  ResourceStatus,
} from "@/features/resources/types/resource.types";

function normalizeOptional(value: string) {
  const nextValue = value.trim();

  return nextValue.length > 0 ? nextValue : null;
}

function parseSort(value: string | undefined): ResourceSort {
  if (RESOURCE_SORTS.some((item) => item.value === value)) {
    return value as ResourceSort;
  }

  return "display_order";
}

async function getActiveCompanyId() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    console.error("[ResourceService] Unable to load active company.", error);
    throw new Error("Unable to load company information.");
  }

  return data[0]?.id ?? null;
}

async function requireActiveCompanyId() {
  const companyId = await getActiveCompanyId();

  if (!companyId) {
    throw new Error("Company was not found.");
  }

  return companyId;
}

export async function getResourceCategories(): Promise<
  ResourceCategoryOption[]
> {
  const supabase = createSupabaseAdminClient();
  const companyId = await getActiveCompanyId();

  if (!companyId) {
    return [];
  }

  const { data, error } = await supabase
    .from("resource_categories")
    .select("id, name, icon, color")
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[ResourceService] Unable to load resource categories.", error);
    throw new Error("Unable to load resource categories.");
  }

  return data;
}

export async function listResources(
  filters: ResourceFilters,
): Promise<ResourceListResult> {
  const supabase = createSupabaseAdminClient();
  const companyId = await getActiveCompanyId();

  if (!companyId) {
    return { resources: [] };
  }

  const search = filters.search?.trim();
  const sort = parseSort(filters.sort);

  let query = supabase
    .from("resources")
    .select(
      "id, category_id, title, description, resource_type, url, icon, thumbnail, display_order, open_mode, is_featured, status, updated_at",
    )
    .eq("company_id", companyId);

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.resourceType && filters.resourceType !== "all") {
    query = query.eq("resource_type", filters.resourceType);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.featured === "true") {
    query = query.eq("is_featured", true);
  }

  if (filters.featured === "false") {
    query = query.eq("is_featured", false);
  }

  const { data, error } = await query.order(sort, {
    ascending: sort !== "created_at",
  });

  if (error) {
    console.error("[ResourceService] Unable to load resources.", error);
    throw new Error("Unable to load resources.");
  }

  const categories = await getResourceCategories();
  const categoryById = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  return {
    resources: data.map(
      (resource): ResourceListItem => ({
        id: resource.id,
        categoryId: resource.category_id,
        categoryName: categoryById.get(resource.category_id) ?? "Unknown",
        title: resource.title,
        description: resource.description ?? "",
        resourceType: resource.resource_type,
        url: resource.url ?? "",
        icon: resource.icon ?? "",
        thumbnail: resource.thumbnail ?? "",
        displayOrder: resource.display_order,
        openMode: resource.open_mode,
        isFeatured: resource.is_featured,
        status: resource.status,
        updatedAt: resource.updated_at,
      }),
    ),
  };
}

async function assertDisplayOrderAvailable(
  categoryId: string,
  displayOrder: number,
  currentId?: string,
) {
  const supabase = createSupabaseAdminClient();
  const companyId = await requireActiveCompanyId();
  let query = supabase
    .from("resources")
    .select("id")
    .eq("company_id", companyId)
    .eq("category_id", categoryId)
    .eq("display_order", displayOrder)
    .limit(1);

  if (currentId) {
    query = query.neq("id", currentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[ResourceService] Unable to validate display order.", error);
    throw new Error("Unable to validate display order.");
  }

  if (data.length > 0) {
    throw new Error("Display order already exists in this category.");
  }
}

async function getNextDisplayOrder(categoryId: string) {
  const supabase = createSupabaseAdminClient();
  const companyId = await requireActiveCompanyId();
  const { data, error } = await supabase
    .from("resources")
    .select("display_order")
    .eq("company_id", companyId)
    .eq("category_id", categoryId)
    .order("display_order", { ascending: false })
    .limit(1);

  if (error) {
    console.error("[ResourceService] Unable to calculate display order.", error);
    throw new Error("Unable to calculate display order.");
  }

  return (data[0]?.display_order ?? 0) + 1;
}

export async function createResource(values: ResourceFormValues) {
  const validated = ResourceValidationService.validate(values);
  const supabase = createSupabaseAdminClient();
  const companyId = await requireActiveCompanyId();

  await assertDisplayOrderAvailable(values.categoryId, validated.displayOrder);

  const { data, error } = await supabase
    .from("resources")
    .insert({
      company_id: companyId,
      category_id: values.categoryId,
      title: values.title.trim(),
      description: normalizeOptional(values.description),
      resource_type: validated.resourceType,
      url: normalizeOptional(values.url),
      icon: normalizeOptional(values.icon),
      thumbnail: normalizeOptional(values.thumbnail),
      display_order: validated.displayOrder,
      open_mode: validated.openMode,
      is_featured: values.isFeatured,
      status: validated.status,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[ResourceService] Unable to create resource.", error);
    throw new Error("Unable to create resource.");
  }

  await logActivity({
    companyId,
    module: "resources",
    action: "created",
    entityType: "resources",
    entityId: data.id,
    description: `Created resource ${values.title.trim()}`,
    metadata: {
      categoryId: values.categoryId,
      resourceType: validated.resourceType,
      status: validated.status,
    },
  });
}

export async function updateResource(id: string, values: ResourceFormValues) {
  const validated = ResourceValidationService.validate(values);
  const supabase = createSupabaseAdminClient();
  const companyId = await requireActiveCompanyId();

  await assertDisplayOrderAvailable(values.categoryId, validated.displayOrder, id);

  const { error } = await supabase
    .from("resources")
    .update({
      category_id: values.categoryId,
      title: values.title.trim(),
      description: normalizeOptional(values.description),
      resource_type: validated.resourceType,
      url: normalizeOptional(values.url),
      icon: normalizeOptional(values.icon),
      thumbnail: normalizeOptional(values.thumbnail),
      display_order: validated.displayOrder,
      open_mode: validated.openMode,
      is_featured: values.isFeatured,
      status: validated.status,
    })
    .eq("id", id);

  if (error) {
    throw new Error("Unable to update resource.");
  }

  await logActivity({
    companyId,
    module: "resources",
    action: "updated",
    entityType: "resources",
    entityId: id,
    description: `Updated resource ${values.title.trim()}`,
    metadata: {
      categoryId: values.categoryId,
      resourceType: validated.resourceType,
      status: validated.status,
    },
  });
}

export async function duplicateResource(id: string) {
  const supabase = createSupabaseAdminClient();
  const companyId = await requireActiveCompanyId();
  const { data: resource, error: loadError } = await supabase
    .from("resources")
    .select(
      "category_id, title, description, resource_type, url, icon, thumbnail, open_mode, is_featured, status",
    )
    .eq("company_id", companyId)
    .eq("id", id)
    .single();

  if (loadError || !resource) {
    throw new Error("Resource was not found.");
  }

  const displayOrder = await getNextDisplayOrder(resource.category_id);
  const { error } = await supabase.from("resources").insert({
    company_id: companyId,
    category_id: resource.category_id,
    title: `${resource.title} Copy`,
    description: resource.description,
    resource_type: resource.resource_type,
    url: resource.url,
    icon: resource.icon,
    thumbnail: resource.thumbnail,
    display_order: displayOrder,
    open_mode: resource.open_mode,
    is_featured: resource.is_featured,
    status: resource.status,
  });

  if (error) {
    console.error("[ResourceService] Unable to duplicate resource.", error);
    throw new Error("Unable to duplicate resource.");
  }
}

export async function setResourceStatus(
  id: string,
  status: Extract<ResourceStatus, "active" | "archived">,
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("resources")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[ResourceService] Unable to update resource status.", error);
    throw new Error("Unable to update resource status.");
  }
}

export const ResourceService = {
  getCategories: getResourceCategories,
  list: listResources,
  create: createResource,
  update: updateResource,
  duplicate: duplicateResource,
  setStatus: setResourceStatus,
};
