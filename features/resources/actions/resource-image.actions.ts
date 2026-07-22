"use server";

import { ResourceImageService } from "@/features/resources/services/resource-image.service";

export async function uploadResourceImageAction(formData: FormData) {
  try {
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("Choose an image to upload.");
    }

    const path = await ResourceImageService.upload(file);

    return { ok: true as const, message: "Image uploaded.", path };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error ? error.message : "Unable to upload image.",
      path: "",
    };
  }
}

export async function removeResourceImageUploadAction(path: string) {
  try {
    await ResourceImageService.removeUploaded(path);
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
}
