"use server";

import { revalidatePath } from "next/cache";

import { ResourceCategoryService } from "@/features/resource-categories/services/resource-category.service";
import type {
  ResourceCategoryActionState,
  ResourceCategoryFormValues,
} from "@/features/resource-categories/types/resource-category.types";

const CATEGORIES_PATH = "/admin/resources/categories";

export async function createResourceCategoryAction(
  values: ResourceCategoryFormValues,
): Promise<ResourceCategoryActionState> {
  try {
    await ResourceCategoryService.create(values);
    revalidatePath(CATEGORIES_PATH);
    revalidatePath("/admin/resources");

    return { ok: true, message: "Category created." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to create category.",
    };
  }
}

export async function updateResourceCategoryAction(
  id: string,
  values: ResourceCategoryFormValues,
): Promise<ResourceCategoryActionState> {
  try {
    await ResourceCategoryService.update(id, values);
    revalidatePath(CATEGORIES_PATH);
    revalidatePath("/admin/resources");

    return { ok: true, message: "Category updated." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to update category.",
    };
  }
}

export async function archiveResourceCategoryAction(
  id: string,
): Promise<ResourceCategoryActionState> {
  try {
    await ResourceCategoryService.setStatus(id, "archived");
    revalidatePath(CATEGORIES_PATH);
    revalidatePath("/admin/resources");

    return { ok: true, message: "Category archived." };
  } catch {
    return { ok: false, message: "Unable to archive category." };
  }
}

export async function restoreResourceCategoryAction(
  id: string,
): Promise<ResourceCategoryActionState> {
  try {
    await ResourceCategoryService.setStatus(id, "active");
    revalidatePath(CATEGORIES_PATH);
    revalidatePath("/admin/resources");

    return { ok: true, message: "Category restored." };
  } catch {
    return { ok: false, message: "Unable to restore category." };
  }
}
