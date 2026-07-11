"use client";

import Link from "next/link";
import { useEffect } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
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
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        aria-label="Close navigation"
        onClick={() => onOpenChange(false)}
      />
      <aside className="relative flex h-full w-80 max-w-[86vw] flex-col border-r bg-background shadow-soft">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Logo href="/admin/dashboard" />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => onOpenChange(false)}
            aria-label="Close navigation"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <nav className="space-y-1 p-3">
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
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
