"use client";

import Link from "next/link";
import { useEffect } from "react";
import { X } from "lucide-react";

import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { adminNavigationItems } from "@/lib/navigation/admin-navigation";
import { cn } from "@/lib/utils";

type AdminMobileDrawerProps = {
  pathname: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function AdminMobileDrawer({
  pathname,
  isOpen,
  onOpenChange,
}: AdminMobileDrawerProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onOpenChange]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-background/82 backdrop-blur-md"
        aria-label="Close navigation"
        onClick={() => onOpenChange(false)}
      />
      <aside className="relative m-3 flex h-[calc(100%-1.5rem)] w-80 max-w-[88vw] flex-col overflow-hidden rounded-[1.75rem] border bg-card/95 p-3 shadow-[var(--shadow-raised)] backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between rounded-2xl border border-white/20 bg-background/60 px-3">
          <Logo href="/admin/dashboard" />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-9 border-white/20 bg-background/75 shadow-none"
            onClick={() => onOpenChange(false)}
            aria-label="Close navigation"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="px-3 pb-4 pt-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary">
            Admin Navigation
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Move between company operations without leaving the workspace shell.
          </p>
        </div>

        <nav className="space-y-1.5 overflow-y-auto px-1 pb-2">
          {adminNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent/70 hover:text-foreground",
                  isActive &&
                    "bg-primary/10 text-primary shadow-[0_18px_28px_-24px_rgba(37,99,235,0.78)]",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-2xl border border-white/20 bg-background/75",
                    isActive && "border-primary/20 bg-primary/12",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {item.title}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
