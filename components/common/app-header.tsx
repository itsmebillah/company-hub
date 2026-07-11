"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle } from "lucide-react";

import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { PageContainer } from "@/components/common/page-container";
import { LogoutButton } from "@/features/auth/components";
import { NotificationDropdown } from "@/features/notifications/components";
import type { NotificationSummary } from "@/features/notifications/types/notification.types";
import { appNavigationItems } from "@/lib/navigation/app-navigation";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  actions?: ReactNode;
  notificationSummary?: NotificationSummary;
  showProfile?: boolean;
};

export function AppHeader({
  actions,
  notificationSummary,
  showProfile = false,
}: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 px-0 pt-3 sm:pt-4">
      <PageContainer className="space-y-3">
        <div className="app-card app-card-subtle flex flex-col gap-4 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-4">
              <Logo />
              <div className="hidden min-w-0 lg:block">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary">
                  Employee Workspace
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Designed for fast company updates, daily actions, and focus.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {actions}
              {notificationSummary ? (
                <NotificationDropdown summary={notificationSummary} />
              ) : null}
              <ThemeToggle />
              {showProfile ? (
                <Link
                  href="/profile"
                  className={cn(
                    "inline-flex size-10 items-center justify-center rounded-2xl border border-white/30 bg-background/70 shadow-none backdrop-blur-md outline-none transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring",
                    pathname === "/profile" && "border-primary/40 bg-primary/10 text-primary",
                  )}
                  aria-label="Profile"
                  title="Profile"
                >
                  <UserCircle className="size-[1.125rem]" aria-hidden="true" />
                </Link>
              ) : null}
              <LogoutButton compact />
            </div>
          </div>

          <nav
            className="hidden flex-wrap items-center gap-2 md:flex"
            aria-label="Workspace navigation"
          >
            {appNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold text-muted-foreground transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-accent/60 hover:text-foreground",
                    isActive &&
                      "border-primary/30 bg-primary/10 text-primary shadow-[0_18px_30px_-24px_rgba(37,99,235,0.7)]",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </PageContainer>
    </header>
  );
}
