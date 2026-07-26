"use server";

import { revalidatePath } from "next/cache";

import { ReleaseService } from "@/features/releases/services/release.service";
import type { ReleaseStatus } from "@/features/releases/types/release.types";

export async function updateReleaseControlsAction(formData: FormData) {
  const releaseId = String(formData.get("releaseId") ?? "");
  const status = String(formData.get("status") ?? "") as ReleaseStatus;
  if (
    !releaseId ||
    !["draft", "published", "archived", "failed"].includes(status)
  ) {
    throw new Error("Invalid release controls.");
  }
  await ReleaseService.updateControls({
    releaseId,
    status,
    requiresUpdate: formData.get("requiresUpdate") === "on",
    showPopup: formData.get("showPopup") === "on",
  });
  revalidatePath("/platform/releases");
  revalidatePath("/releases");
}

export async function recordReleaseReceiptAction(
  releaseId: string,
  event: "dismissed" | "installed",
) {
  await ReleaseService.recordReceipt(releaseId, event);
}
