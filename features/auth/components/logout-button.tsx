"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions/logout.action";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  compact?: boolean;
  className?: string;
};

export function LogoutButton({
  compact = false,
  className,
}: LogoutButtonProps) {
  return (
    <form action={logoutAction} className={compact ? undefined : "w-full"}>
      <Button
        type="submit"
        size={compact ? "icon" : "sm"}
        variant="ghost"
        className={cn(
          compact ? "size-9" : "h-11 w-full justify-center",
          className,
        )}
        aria-label="Log out"
        title="Log out"
      >
        <LogOut className="size-4" aria-hidden="true" />
        {compact ? (
          <span className="sr-only">Log out</span>
        ) : (
          <span>Logout</span>
        )}
      </Button>
    </form>
  );
}
