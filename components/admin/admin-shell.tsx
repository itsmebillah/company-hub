"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminMobileDrawer } from "@/components/admin/admin-mobile-drawer";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import type { NotificationSummary } from "@/features/notifications/types/notification.types";

type AdminShellProps = {
  children: ReactNode;
  notificationSummary: NotificationSummary;
};

export function AdminShell({ children, notificationSummary }: AdminShellProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-svh bg-background">
      <AdminMobileDrawer
        pathname={pathname}
        isOpen={isMobileDrawerOpen}
        onOpenChange={setIsMobileDrawerOpen}
      />
      <div className="flex min-h-svh">
        <AdminSidebar
          pathname={pathname}
          isCollapsed={isSidebarCollapsed}
          onCollapsedChange={setIsSidebarCollapsed}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader
            notificationSummary={notificationSummary}
            pathname={pathname}
            onMenuClick={() => setIsMobileDrawerOpen(true)}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
