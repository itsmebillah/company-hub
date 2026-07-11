"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, Settings, UserCircle } from "lucide-react";

import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { ProfilePhoto } from "@/components/common/profile-photo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components";
import type { AuthSessionProfile } from "@/features/auth/types/auth.types";
import { NotificationDropdown } from "@/features/notifications/components";
import type { NotificationSummary } from "@/features/notifications/types/notification.types";
import {
  adminNavigationFallback,
  adminNavigationItems,
} from "@/lib/navigation/admin-navigation";

type AdminHeaderProps = {
  profile: AuthSessionProfile;
  notificationSummary: NotificationSummary;
  pathname: string;
  onMenuClick: () => void;
};

function getPageTitle(pathname: string) {
  if (pathname === "/admin/profile") {
    return "Profile";
  }

  return (
    adminNavigationItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? adminNavigationFallback
  ).title;
}

export function AdminHeader({
  profile,
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
    <header className="sticky top-0 z-30 px-4 pt-3 sm:px-6 sm:pt-4">
      <div className="app-card app-card-subtle flex min-h-[4.5rem] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-10 border-white/30 bg-background/70 shadow-none md:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
              Admin Workspace
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {title}
            </h1>
            <div className="mt-1 hidden sm:block">
              <AdminBreadcrumb pathname={pathname} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <NotificationDropdown summary={notificationSummary} />
          <ThemeToggle />
          <div className="relative" ref={profileMenuRef}>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-10 border-white/30 bg-background/70 shadow-none"
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
                className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-[1.4rem] border bg-popover/95 p-1.5 text-popover-foreground shadow-[var(--shadow-card)] backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 rounded-2xl px-3 py-3">
                  <ProfilePhoto
                    src={profile.photoUrl}
                    name={profile.name}
                    className="size-11 border border-white/20 shadow-[var(--shadow-soft)]"
                    fallbackClassName="bg-primary/15 text-primary"
                  />
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold">
                      {profile.name}
                    </p>
                    <p className="break-words text-xs text-muted-foreground">
                      {profile.employeeId}
                    </p>
                  </div>
                </div>
                <div className="my-1 border-t border-border/70" />
                <Link
                  href="/admin/profile"
                  role="menuitem"
                  className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium outline-none hover:bg-accent focus-visible:bg-accent"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <UserCircle className="size-4" aria-hidden="true" />
                  View Profile
                </Link>
                <Link
                  href="/admin/settings"
                  role="menuitem"
                  className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium outline-none hover:bg-accent focus-visible:bg-accent"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Settings className="size-4" aria-hidden="true" />
                  Settings
                </Link>
                <div className="my-1 border-t border-border/70" />
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
