"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminMobileDrawer } from "@/components/admin/admin-mobile-drawer";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import type { AuthSessionProfile } from "@/features/auth/types/auth.types";
import type { NotificationSummary } from "@/features/notifications/types/notification.types";

type AdminShellProps = {
  children: ReactNode;
  profile: AuthSessionProfile;
  notificationSummary: NotificationSummary;
};

export function AdminShell({
  children,
  profile,
  notificationSummary,
}: AdminShellProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-svh overflow-x-hidden bg-background">
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
          <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
            <div className="min-w-0">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
