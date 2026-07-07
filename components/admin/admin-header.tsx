"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, Settings, UserCircle } from "lucide-react";

import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components";
import { NotificationDropdown } from "@/features/notifications/components";
import type { NotificationSummary } from "@/features/notifications/types/notification.types";
import {
  adminNavigationFallback,
  adminNavigationItems,
} from "@/lib/navigation/admin-navigation";

type AdminHeaderProps = {
  notificationSummary: NotificationSummary;
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

export function AdminHeader({
  notificationSummary,
  pathname,
  onMenuClick,
}: AdminHeaderProps) {
  const title = getPageTitle(pathname);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
          <NotificationDropdown summary={notificationSummary} />
          <ThemeToggle />
          <div className="relative" ref={profileMenuRef}>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-9"
              aria-label="Profile menu"
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
              title="Profile menu"
              onClick={() => setIsProfileOpen((current) => !current)}
            >
              <UserCircle className="size-5" aria-hidden="true" />
            </Button>
            {isProfileOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
              >
                <Link
                  href="/profile"
                  role="menuitem"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none hover:bg-accent focus-visible:bg-accent"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <UserCircle className="size-4" aria-hidden="true" />
                  View Profile
                </Link>
                <Link
                  href="/admin/settings"
                  role="menuitem"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none hover:bg-accent focus-visible:bg-accent"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Settings className="size-4" aria-hidden="true" />
                  Settings
                </Link>
                <div className="my-1 border-t" />
                <div className="px-1 py-1">
                  <LogoutButton compact />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
