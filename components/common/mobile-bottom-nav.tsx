"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { primaryMobileAppNavigationItems } from "@/lib/navigation/app-navigation";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="app-floating-nav md:hidden"
      aria-label="Primary workspace navigation"
    >
      {primaryMobileAppNavigationItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[0.68rem] font-semibold tracking-wide text-muted-foreground transition duration-200",
              isActive &&
                "bg-primary text-primary-foreground shadow-[0_16px_24px_-18px_rgba(37,99,235,0.95)]",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-[1.125rem]" aria-hidden="true" />
            <span className="truncate">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
