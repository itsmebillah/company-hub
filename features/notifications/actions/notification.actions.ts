"use server";

import { revalidatePath } from "next/cache";

import { NotificationService } from "@/features/notifications/services/notification.service";

export async function markNotificationReadAction(id: string) {
  try {
    await NotificationService.markCurrentUserNotificationRead(id);
    revalidatePath("/dashboard");
    revalidatePath("/resources");
    revalidatePath("/announcements");
    revalidatePath("/profile");
  } catch {
    return;
  }
}

export async function markAllNotificationsReadAction() {
  try {
    await NotificationService.markCurrentUserNotificationsRead();
    revalidatePath("/admin/dashboard");
    revalidatePath("/dashboard");
    revalidatePath("/resources");
    revalidatePath("/announcements");
    revalidatePath("/profile");
  } catch {
    return;
  }
}
