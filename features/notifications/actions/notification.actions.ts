"use server";

import { revalidatePath } from "next/cache";

import { NotificationService } from "@/features/notifications/services/notification.service";
import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";
import { requireCompanyAdmin } from "@/features/auth/services/authorization.service";

export async function markNotificationReadAction(id: string) {
  try {
    await FeatureAccessService.requireForCurrentCompany("notifications");
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
    await FeatureAccessService.requireForCurrentCompany("notifications");
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

export async function getCurrentNotificationSummaryAction() {
  await FeatureAccessService.requireForCurrentCompany("notifications");
  return NotificationService.getCurrentUserSummary();
}

export async function getCurrentAdminNotificationSummaryAction() {
  await requireCompanyAdmin("notifications");
  return NotificationService.getCurrentAdminSummary();
}
