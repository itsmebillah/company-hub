"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminMobileDrawer } from "@/components/admin/admin-mobile-drawer";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import type { AuthSessionProfile } from "@/features/auth/types/auth.types";
import { NativeNotificationBridge } from "@/features/notifications/components";
import type { NotificationSummary } from "@/features/notifications/types/notification.types";
import type { SchemaVersionStatus } from "@/features/schema-version/services/schema-version.service";

type AdminShellProps = {
  children: ReactNode;
  profile: AuthSessionProfile;
  notificationSummary: NotificationSummary;
  schemaStatus: SchemaVersionStatus;
};

export function AdminShell({
  children,
  profile,
  notificationSummary,
  schemaStatus,
}: AdminShellProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="app-shell min-h-svh overflow-x-hidden">
      <AdminMobileDrawer
        pathname={pathname}
        isOpen={isMobileDrawerOpen}
        onOpenChange={setIsMobileDrawerOpen}
      />
      <div className="flex min-h-svh max-w-full">
        <AdminSidebar
          pathname={pathname}
          isCollapsed={isSidebarCollapsed}
          onCollapsedChange={setIsSidebarCollapsed}
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <AdminHeader
            profile={profile}
            notificationSummary={notificationSummary}
            pathname={pathname}
            onMenuClick={() => setIsMobileDrawerOpen(true)}
          />
          <main className="flex-1 overflow-x-hidden px-4 pb-8 pt-4 sm:px-6 lg:px-8">
            <div className="min-w-0 space-y-5">
              {schemaStatus.state !== "current" ? (
                <section className="app-card border-amber-300/70 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/35 dark:text-amber-100">
                  <p className="font-semibold">
                    {schemaStatus.message ?? "Database schema is outdated."}
                  </p>
                  {schemaStatus.pendingMigrations.length > 0 ? (
                    <p className="mt-1 text-amber-900 dark:text-amber-200">
                      Pending migrations: {schemaStatus.pendingMigrations.join(", ")}
                    </p>
                  ) : null}
                </section>
              ) : null}
              <div className="app-page">{children}</div>
            </div>
          </main>
        </div>
      </div>
      <NativeNotificationBridge summary={notificationSummary} />
    </div>
  );
}
