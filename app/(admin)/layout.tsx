import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin";
import { getPostLoginRedirectPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { NotificationService } from "@/features/notifications/services/notification.service";
import { SchemaVersionService } from "@/features/schema-version/services/schema-version.service";
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

  const [notificationSummary, schemaStatus] = await Promise.all([
    NotificationService.getCurrentAdminSummary(),
    SchemaVersionService.getStatus(),
  ]);

  return (
    <AdminShell
      profile={profile}
      notificationSummary={notificationSummary}
      notificationScope={{
        type: "company",
        companyId: profile.companyId,
      }}
      schemaStatus={schemaStatus}
    >
      {children}
    </AdminShell>
  );
}
