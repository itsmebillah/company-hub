"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { primaryMobileAppNavigationItems } from "@/lib/navigation/app-navigation";
import { cn } from "@/lib/utils";
import type { FeatureKey } from "@/features/platform-control/types/platform.types";

export type MobileBottomNavItem = {
  title: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  featureKey?: FeatureKey;
};

type MobileBottomNavProps = {
  items?: MobileBottomNavItem[];
  ariaLabel?: string;
  className?: string;
  enabledFeatures?: FeatureKey[];
};

export function MobileBottomNav({
  items = primaryMobileAppNavigationItems,
  ariaLabel = "Primary workspace navigation",
  className = "md:hidden",
  enabledFeatures,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const enabledFeatureSet = enabledFeatures ? new Set(enabledFeatures) : null;
  const visibleItems = enabledFeatureSet
    ? items.filter(
        (item) => !item.featureKey || enabledFeatureSet.has(item.featureKey),
      )
    : items;
  const itemClassName =
    "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[0.68rem] font-semibold tracking-wide text-muted-foreground transition duration-200";
  const activeClassName =
    "bg-primary text-primary-foreground shadow-[0_16px_24px_-18px_rgba(37,99,235,0.95)]";

  return (
    <nav className={cn("app-floating-nav", className)} aria-label={ariaLabel}>
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.isActive ??
          Boolean(
            item.href &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`)),
          );

        return item.href ? (
          <Link
            key={item.href}
            href={item.href}
            className={cn(itemClassName, isActive && activeClassName)}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-[1.125rem]" aria-hidden="true" />
            <span className="truncate">{item.title}</span>
          </Link>
        ) : (
          <button
            key={item.title}
            type="button"
            className={cn(itemClassName, isActive && activeClassName)}
            onClick={item.onClick}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-[1.125rem]" aria-hidden="true" />
            <span className="truncate">{item.title}</span>
          </button>
        );
      })}
    </nav>
  );
}
