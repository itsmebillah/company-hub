"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import type { AdminNavigationItem } from "@/lib/navigation/admin-navigation";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  pathname: string;
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
  items: AdminNavigationItem[];
};

export function AdminSidebar({
  pathname,
  isCollapsed,
  onCollapsedChange,
  items,
}: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden min-h-svh px-3 py-3 transition-[width] duration-200 md:flex md:flex-col",
        isCollapsed ? "w-24" : "w-72",
      )}
    >
      <div className="app-card app-card-subtle flex min-h-[calc(100svh-1.5rem)] flex-col overflow-hidden px-3 py-3">
        <div className="bg-background/55 flex h-16 items-center justify-between rounded-2xl border border-white/20 px-3">
          {isCollapsed ? (
            <Logo
              href="/admin/dashboard"
              className="[&>span:last-child]:sr-only"
            />
          ) : (
            <Logo href="/admin/dashboard" />
          )}
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="bg-background/70 size-9 border-white/20 shadow-none"
            onClick={() => onCollapsedChange(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="size-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>

        <div className={cn("px-3 pt-5 pb-4", isCollapsed && "px-1")}>
          <p
            className={cn(
              "text-primary/80 text-[0.68rem] font-semibold tracking-[0.22em] uppercase",
              isCollapsed && "sr-only",
            )}
          >
            Company Admin Console
          </p>
          <p
            className={cn(
              "text-muted-foreground mt-1 text-xs leading-5",
              isCollapsed && "sr-only",
            )}
          >
            Centralized controls for people, operations, and internal tools.
          </p>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-1 pb-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group text-muted-foreground hover:bg-accent/70 hover:text-foreground flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition duration-200 hover:-translate-y-0.5",
                  isActive &&
                    "bg-primary/10 text-primary shadow-[0_18px_28px_-24px_rgba(37,99,235,0.78)]",
                  isCollapsed && "justify-center px-0",
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <span
                  className={cn(
                    "bg-background/75 text-muted-foreground group-hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-2xl border border-white/20 transition",
                    isActive && "border-primary/20 bg-primary/12 text-primary",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                </span>
                <span className={cn(isCollapsed && "sr-only")}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
