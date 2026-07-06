import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin";
import { NotificationService } from "@/features/notifications/services/notification.service";

export default async function AdminRouteGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const notificationSummary =
    await NotificationService.getCurrentAdminSummary();

  return (
    <AdminShell notificationSummary={notificationSummary}>{children}</AdminShell>
  );
}
