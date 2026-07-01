"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions/logout.action";

type LogoutButtonProps = {
  compact?: boolean;
};

export function LogoutButton({ compact = false }: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        size={compact ? "icon" : "sm"}
        variant="ghost"
        className={compact ? "size-9" : "h-9"}
        aria-label="Log out"
        title="Log out"
      >
        <LogOut className="size-4" aria-hidden="true" />
        {compact ? <span className="sr-only">Log out</span> : <span>Logout</span>}
      </Button>
    </form>
  );
}
