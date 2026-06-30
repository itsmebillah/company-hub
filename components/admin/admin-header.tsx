"use client";

import { Bell, Menu, UserCircle } from "lucide-react";

import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  adminNavigationFallback,
  adminNavigationItems,
} from "@/lib/navigation/admin-navigation";

type AdminHeaderProps = {
  pathname: string;
  onMenuClick: () => void;
};

function getPageTitle(pathname: string) {
  return (
    adminNavigationItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? adminNavigationFallback
  ).title;
}

export function AdminHeader({ pathname, onMenuClick }: AdminHeaderProps) {
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-9 lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">{title}</h1>
            <AdminBreadcrumb pathname={pathname} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-9"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="size-4" aria-hidden="true" />
          </Button>
          <ThemeToggle />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-9"
            aria-label="Profile menu"
            title="Profile menu"
          >
            <UserCircle className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  );
}
