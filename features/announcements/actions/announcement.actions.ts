"use server";

import { revalidatePath } from "next/cache";

import { AnnouncementService } from "@/features/announcements/services/announcement.service";
import { requireCompanyAdmin } from "@/features/auth/services/authorization.service";
import type {
  AnnouncementActionState,
  AnnouncementFormValues,
} from "@/features/announcements/types/announcement.types";

const ADMIN_ANNOUNCEMENTS_PATH = "/admin/announcements";

export async function createAnnouncementAction(
  values: AnnouncementFormValues,
): Promise<AnnouncementActionState> {
  try {
    await requireCompanyAdmin("announcements");
    await AnnouncementService.create(values);
    revalidatePath(ADMIN_ANNOUNCEMENTS_PATH);
    revalidatePath("/announcements");

    return { ok: true, message: "Announcement created." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create announcement.",
    };
  }
}

export async function updateAnnouncementAction(
  id: string,
  values: AnnouncementFormValues,
): Promise<AnnouncementActionState> {
  try {
    await requireCompanyAdmin("announcements");
    await AnnouncementService.update(id, values);
    revalidatePath(ADMIN_ANNOUNCEMENTS_PATH);
    revalidatePath("/announcements");

    return { ok: true, message: "Announcement updated." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update announcement.",
    };
  }
}

export async function archiveAnnouncementAction(
  id: string,
): Promise<AnnouncementActionState> {
  try {
    await requireCompanyAdmin("announcements");
    await AnnouncementService.setStatus(id, "archived");
    revalidatePath(ADMIN_ANNOUNCEMENTS_PATH);
    revalidatePath("/announcements");

    return { ok: true, message: "Announcement archived." };
  } catch {
    return { ok: false, message: "Unable to archive announcement." };
  }
}

export async function restoreAnnouncementAction(
  id: string,
): Promise<AnnouncementActionState> {
  try {
    await requireCompanyAdmin("announcements");
    await AnnouncementService.setStatus(id, "active");
    revalidatePath(ADMIN_ANNOUNCEMENTS_PATH);
    revalidatePath("/announcements");

    return { ok: true, message: "Announcement restored." };
  } catch {
    return { ok: false, message: "Unable to restore announcement." };
  }
}
