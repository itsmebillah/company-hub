"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { adminNavigationItems } from "@/lib/navigation/admin-navigation";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  pathname: string;
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
};

export function AdminSidebar({
  pathname,
  isCollapsed,
  onCollapsedChange,
}: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden min-h-svh px-3 py-3 transition-[width] duration-200 md:flex md:flex-col",
        isCollapsed ? "w-24" : "w-72",
      )}
    >
      <div className="app-card app-card-subtle flex min-h-[calc(100svh-1.5rem)] flex-col overflow-hidden px-3 py-3">
        <div className="flex h-16 items-center justify-between rounded-2xl border border-white/20 bg-background/55 px-3">
          {isCollapsed ? (
            <Logo href="/admin/dashboard" className="[&>span:last-child]:sr-only" />
          ) : (
            <Logo href="/admin/dashboard" />
          )}
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-9 border-white/20 bg-background/70 shadow-none"
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

        <div className={cn("px-3 pb-4 pt-5", isCollapsed && "px-1")}>
          <p
            className={cn(
              "text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/80",
              isCollapsed && "sr-only",
            )}
          >
            Admin Console
          </p>
          <p
            className={cn(
              "mt-1 text-xs leading-5 text-muted-foreground",
              isCollapsed && "sr-only",
            )}
          >
            Centralized controls for people, operations, and internal tools.
          </p>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-1 pb-2">
          {adminNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-muted-foreground transition duration-200 hover:-translate-y-0.5 hover:bg-accent/70 hover:text-foreground",
                  isActive &&
                    "bg-primary/10 text-primary shadow-[0_18px_28px_-24px_rgba(37,99,235,0.78)]",
                  isCollapsed && "justify-center px-0",
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-background/75 text-muted-foreground transition group-hover:text-foreground",
                    isActive && "border-primary/20 bg-primary/12 text-primary",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                </span>
                <span className={cn(isCollapsed && "sr-only")}>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
