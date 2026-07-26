"use server";

import { revalidatePath } from "next/cache";

import {
  createResource,
  deleteResource,
  duplicateResource,
  getResourceFeatureKey,
  setResourceStatus,
  updateResource,
} from "@/features/resources/services/resource.service";
import { requireCompanyAdmin } from "@/features/auth/services/authorization.service";
import type {
  ResourceActionState,
  ResourceFormValues,
} from "@/features/resources/types/resource.types";
import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";

const RESOURCES_PATH = "/admin/resources";

export async function createResourceAction(
  values: ResourceFormValues,
): Promise<ResourceActionState> {
  try {
    await requireCompanyAdmin(values.isFeatured ? "quick_links" : "resources");
    await createResource(values);
    revalidatePath(RESOURCES_PATH);
    revalidatePath("/dashboard");
    revalidatePath("/resources");

    return { ok: true, message: "Resource created." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to create resource.",
    };
  }
}

export async function updateResourceAction(
  id: string,
  values: ResourceFormValues,
): Promise<ResourceActionState> {
  try {
    await requireCompanyAdmin();
    await FeatureAccessService.requireForCurrentCompany(
      await getResourceFeatureKey(id),
    );
    await FeatureAccessService.requireForCurrentCompany(
      values.isFeatured ? "quick_links" : "resources",
    );
    await updateResource(id, values);
    revalidatePath(RESOURCES_PATH);
    revalidatePath("/dashboard");
    revalidatePath("/resources");

    return { ok: true, message: "Resource updated." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to update resource.",
    };
  }
}

export async function archiveResourceAction(
  id: string,
): Promise<ResourceActionState> {
  try {
    await requireCompanyAdmin();
    await FeatureAccessService.requireForCurrentCompany(
      await getResourceFeatureKey(id),
    );
    await setResourceStatus(id, "archived");
    revalidatePath(RESOURCES_PATH);
    revalidatePath("/dashboard");
    revalidatePath("/resources");

    return { ok: true, message: "Resource archived." };
  } catch {
    return { ok: false, message: "Unable to archive resource." };
  }
}

export async function duplicateResourceAction(
  id: string,
): Promise<ResourceActionState> {
  try {
    await requireCompanyAdmin();
    await FeatureAccessService.requireForCurrentCompany(
      await getResourceFeatureKey(id),
    );
    await duplicateResource(id);
    revalidatePath(RESOURCES_PATH);
    revalidatePath("/dashboard");
    revalidatePath("/resources");

    return { ok: true, message: "Resource duplicated." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to duplicate resource.",
    };
  }
}

export async function restoreResourceAction(
  id: string,
): Promise<ResourceActionState> {
  try {
    await requireCompanyAdmin();
    await FeatureAccessService.requireForCurrentCompany(
      await getResourceFeatureKey(id),
    );
    await setResourceStatus(id, "active");
    revalidatePath(RESOURCES_PATH);
    revalidatePath("/dashboard");
    revalidatePath("/resources");

    return { ok: true, message: "Resource restored." };
  } catch {
    return { ok: false, message: "Unable to restore resource." };
  }
}

export async function deleteResourceAction(
  id: string,
): Promise<ResourceActionState> {
  try {
    await requireCompanyAdmin();
    await FeatureAccessService.requireForCurrentCompany(
      await getResourceFeatureKey(id),
    );
    await deleteResource(id);
    revalidatePath(RESOURCES_PATH);
    revalidatePath("/dashboard");
    revalidatePath("/resources");
    return { ok: true, message: "Resource deleted." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to delete resource.",
    };
  }
}
