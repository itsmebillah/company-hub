"use server";

import { revalidatePath } from "next/cache";

import {
  createResource,
  duplicateResource,
  setResourceStatus,
  updateResource,
} from "@/features/resources/services/resource.service";
import type {
  ResourceActionState,
  ResourceFormValues,
} from "@/features/resources/types/resource.types";

const RESOURCES_PATH = "/admin/resources";

export async function createResourceAction(
  values: ResourceFormValues,
): Promise<ResourceActionState> {
  try {
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
    await setResourceStatus(id, "active");
    revalidatePath(RESOURCES_PATH);
    revalidatePath("/dashboard");
    revalidatePath("/resources");

    return { ok: true, message: "Resource restored." };
  } catch {
    return { ok: false, message: "Unable to restore resource." };
  }
}
