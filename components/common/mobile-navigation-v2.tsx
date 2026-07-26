"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  LayoutDashboard,
  Megaphone,
  Menu,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { LogoutButton } from "@/features/auth/components";
import { NavigationIcon } from "@/components/common/navigation-icon";
import type { FeatureKey } from "@/features/platform-control/types/platform.types";
import {
  resolveNavigation,
  type NavigationGroupKey,
  type NavigationRole,
} from "@/lib/navigation/navigation-engine";
import { cn } from "@/lib/utils";

const groupDetails: Record<
  NavigationGroupKey,
  { label: string; description: string; icon: LucideIcon }
> = {
  hub: {
    label: "Hub",
    description: "Knowledge, resources, and company tools",
    icon: BookOpen,
  },
  updates: {
    label: "Updates",
    description: "Announcements and notifications",
    icon: Megaphone,
  },
  me: {
    label: "Me",
    description: "Profile, attendance, leave, and preferences",
    icon: UserRound,
  },
  more: {
    label: "More",
    description: "More tools available to your role",
    icon: Menu,
  },
};

type MobileNavigationV2Props = {
  role: NavigationRole;
  enabledFeatures?: FeatureKey[];
  updatesBadge?: number;
};

function provideHapticFeedback() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(10);
  }
}

export function MobileNavigationV2({
  role,
  enabledFeatures = [],
  updatesBadge = 0,
}: MobileNavigationV2Props) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<NavigationGroupKey | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const navigation = useMemo(
    () => resolveNavigation(role, enabledFeatures),
    [role, enabledFeatures],
  );

  useEffect(() => {
    if (!openGroup) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenGroup(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [openGroup]);

  useEffect(() => setOpenGroup(null), [pathname]);

  const open = (group: NavigationGroupKey) => {
    provideHapticFeedback();
    setOpenGroup(group);
  };

  return (
    <>
      <nav
        className="mobile-nav-v2 xl:hidden"
        aria-label="Primary mobile navigation"
        data-navigation-role={role}
      >
        <Link
          href={navigation.dashboardHref}
          className={cn(
            "mobile-nav-fab group",
            pathname === navigation.dashboardHref && "is-active",
          )}
          onClick={provideHapticFeedback}
          aria-label="Open Dashboard"
          aria-current={
            pathname === navigation.dashboardHref ? "page" : undefined
          }
        >
          <span className="mobile-nav-fab-ripple" aria-hidden="true" />
          <LayoutDashboard className="size-6" aria-hidden="true" />
          <span className="sr-only">Dashboard</span>
        </Link>

        <div className="mobile-nav-v2-grid">
          {(Object.keys(groupDetails) as NavigationGroupKey[]).map((key) => {
            const details = groupDetails[key];
            const Icon = details.icon;
            const isActive = navigation.groups[key].some(
              (item) =>
                pathname === item.href.split("#")[0].split("?")[0] ||
                pathname.startsWith(
                  `${item.href.split("#")[0].split("?")[0]}/`,
                ),
            );
            return (
              <button
                key={key}
                type="button"
                className={cn("mobile-nav-v2-item", isActive && "is-active")}
                onClick={() => open(key)}
                aria-label={`Open ${details.label} menu`}
                aria-expanded={openGroup === key}
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden="true" />
                  {key === "updates" && updatesBadge > 0 ? (
                    <span
                      className="mobile-nav-badge"
                      aria-label={`${updatesBadge} unread updates`}
                    >
                      {updatesBadge > 99 ? "99+" : updatesBadge}
                    </span>
                  ) : null}
                </span>
                <span>{details.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {openGroup ? (
        <div className="fixed inset-0 z-[80] xl:hidden">
          <button
            type="button"
            className="bg-foreground/25 absolute inset-0 backdrop-blur-[2px]"
            onClick={() => setOpenGroup(null)}
            aria-label="Close navigation menu"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-panel-title"
            className="mobile-nav-panel"
          >
            <div className="bg-border mx-auto mb-3 h-1.5 w-12 rounded-full" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="mobile-navigation-panel-title"
                  className="text-xl font-semibold"
                >
                  {groupDetails[openGroup].label}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {groupDetails[openGroup].description}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="focus-visible:ring-ring bg-background/70 flex size-11 shrink-0 items-center justify-center rounded-2xl border focus-visible:ring-2 focus-visible:outline-none"
                onClick={() => setOpenGroup(null)}
                aria-label="Close menu"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {navigation.groups[openGroup].length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {navigation.groups[openGroup].map((item) => {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="group focus-visible:ring-ring bg-card/80 hover:border-primary/35 flex min-h-24 min-w-0 flex-col justify-between rounded-2xl border p-3 shadow-[var(--shadow-soft)] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <span className="app-icon-wrap text-primary size-10">
                        <NavigationIcon name={item.icon} className="size-5" />
                      </span>
                      <span className="mt-3 text-sm leading-5 font-semibold">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground mt-5 rounded-2xl border border-dashed p-5 text-sm">
                No tools are currently available in this section.
              </p>
            )}

            {openGroup === "me" ? (
              <div className="mt-3">
                <LogoutButton />
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
