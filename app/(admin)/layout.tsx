import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin";
import { getPostLoginRedirectPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { NotificationService } from "@/features/notifications/services/notification.service";
import { ROLE_NAMES } from "@/lib/auth/permissions";

export default async function AdminRouteGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const profile = await getCurrentSessionProfile();

  if (!profile || profile.status !== "active") {
    redirect("/login");
  }

  if (profile.roleName !== ROLE_NAMES.admin) {
    redirect(getPostLoginRedirectPath(profile.roleName));
  }

  const notificationSummary =
    await NotificationService.getCurrentAdminSummary();

  return (
    <AdminShell profile={profile} notificationSummary={notificationSummary}>
      {children}
    </AdminShell>
  );
}
