import { LogOut } from "lucide-react";

import { IconBadge } from "@/components/common/icon-badge";
import { LogoutButton } from "@/features/auth/components";

export function AccountSection() {
  return (
    <section className="app-card p-5">
      <div className="flex items-start gap-3">
        <IconBadge icon={LogOut} className="size-10 rounded-2xl" />
        <div className="min-w-0">
          <h2 className="font-semibold">Account</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-5">
            Sign out securely when you finish using this device.
          </p>
        </div>
      </div>
      <div className="mt-4">
        <LogoutButton className="border-border/80 bg-background/70 border shadow-[var(--shadow-soft)]" />
      </div>
    </section>
  );
}
