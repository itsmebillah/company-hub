import "server-only";

import { requireCurrentCompanyId } from "@/features/auth/services/current-employee-context.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ResourceCategoryValidationService } from "@/features/resource-categories/services/resource-category-validation.service";
import type {
  ResourceCategoryFormValues,
  ResourceCategoryListItem,
  ResourceCategoryStatus,
} from "@/features/resource-categories/types/resource-category.types";

function normalizeOptional(value: string) {
  const nextValue = value.trim();

  return nextValue.length > 0 ? nextValue : null;
}

async function assertCategoryUnique(
  name: string,
  displayOrder: number,
  currentId?: string,
) {
  const supabase = createSupabaseAdminClient();
  const companyId = await requireCurrentCompanyId();
  let nameQuery = supabase
    .from("resource_categories")
    .select("id")
    .eq("company_id", companyId)
    .eq("name", name)
    .limit(1);
  let orderQuery = supabase
    .from("resource_categories")
    .select("id")
    .eq("company_id", companyId)
    .eq("display_order", displayOrder)
    .limit(1);

  if (currentId) {
    nameQuery = nameQuery.neq("id", currentId);
    orderQuery = orderQuery.neq("id", currentId);
  }

  const [nameResult, orderResult] = await Promise.all([
    nameQuery,
    orderQuery,
  ]);

  if (nameResult.error || orderResult.error) {
    console.error("[ResourceCategoryService] Unable to validate category.", {
      nameError: nameResult.error,
      orderError: orderResult.error,
    });
    throw new Error("Unable to validate category.");
  }

  if (nameResult.data.length > 0) {
    throw new Error("Category name already exists.");
  }

  if (orderResult.data.length > 0) {
    throw new Error("Display order already exists.");
  }
}

export const ResourceCategoryService = {
  async list(): Promise<ResourceCategoryListItem[]> {
    const supabase = createSupabaseAdminClient();
    const companyId = await requireCurrentCompanyId();

    const { data, error } = await supabase
      .from("resource_categories")
      .select("id, name, icon, color, display_order, status")
      .eq("company_id", companyId)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[ResourceCategoryService] Unable to load categories.", error);
      throw new Error("Unable to load resource categories.");
    }

    return data.map((category) => ({
      id: category.id,
      name: category.name,
      icon: category.icon ?? "",
      color: category.color ?? "#2563EB",
      displayOrder: category.display_order,
      status: category.status,
    }));
  },

  async create(values: ResourceCategoryFormValues) {
    const validated = ResourceCategoryValidationService.validate(values);
    const supabase = createSupabaseAdminClient();
    const companyId = await requireCurrentCompanyId();

    await assertCategoryUnique(validated.name, validated.displayOrder);

    const { error } = await supabase.from("resource_categories").insert({
      company_id: companyId,
      name: validated.name,
      icon: normalizeOptional(validated.icon),
      color: normalizeOptional(validated.color),
      display_order: validated.displayOrder,
      status: validated.status,
    });

    if (error) {
      console.error("[ResourceCategoryService] Unable to create category.", error);
      throw new Error("Unable to create resource category.");
    }
  },

  async update(id: string, values: ResourceCategoryFormValues) {
    const validated = ResourceCategoryValidationService.validate(values);
    const supabase = createSupabaseAdminClient();
    const companyId = await requireCurrentCompanyId();

    await assertCategoryUnique(validated.name, validated.displayOrder, id);

    const { error } = await supabase
      .from("resource_categories")
      .update({
        name: validated.name,
        icon: normalizeOptional(validated.icon),
        color: normalizeOptional(validated.color),
        display_order: validated.displayOrder,
        status: validated.status,
      })
      .eq("company_id", companyId)
      .eq("id", id);

    if (error) {
      console.error("[ResourceCategoryService] Unable to update category.", error);
      throw new Error("Unable to update resource category.");
    }
  },

  async setStatus(
    id: string,
    status: Extract<ResourceCategoryStatus, "active" | "archived">,
  ) {
    const supabase = createSupabaseAdminClient();
    const companyId = await requireCurrentCompanyId();
    const { error } = await supabase
      .from("resource_categories")
      .update({ status })
      .eq("company_id", companyId)
      .eq("id", id);

    if (error) {
      console.error("[ResourceCategoryService] Unable to update category status.", error);
      throw new Error("Unable to update category status.");
    }
  },
};
