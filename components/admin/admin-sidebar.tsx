"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
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
        "hidden min-h-svh border-r bg-background transition-[width] duration-200 lg:flex lg:flex-col",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {isCollapsed ? (
          <Logo href="/admin/dashboard" className="[&>span:last-child]:sr-only" />
        ) : (
          <Logo href="/admin/dashboard" />
        )}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8"
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

      <nav className="flex-1 space-y-1 p-3">
        {adminNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground",
                isCollapsed && "justify-center px-0",
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className={cn(isCollapsed && "sr-only")}>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
