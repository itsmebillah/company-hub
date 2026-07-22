import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  Building2,
  LayoutDashboard,
  ShieldCheck,
  SlidersHorizontal,
  Settings,
  UsersRound,
} from "lucide-react";

import { LogoutButton } from "@/features/auth/components";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { getCurrentSystemAdmin } from "@/features/platform-control/services/system-admin.service";
import { PlatformAuditService } from "@/features/platform-control/services/platform-audit.service";
import { PlatformControlService } from "@/features/platform-control/services/platform-control.service";

const navigation = [
  { href: "/platform/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/platform/companies", label: "Companies", icon: Building2 },
  { href: "/platform/people", label: "People", icon: UsersRound },
  { href: "/platform/features", label: "Features", icon: SlidersHorizontal },
  { href: "/platform/audit", label: "Audit center", icon: Activity },
  { href: "/platform/settings", label: "Settings", icon: Settings },
];

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [admin, profile] = await Promise.all([
    getCurrentSystemAdmin(),
    getCurrentSessionProfile(),
  ]);
  if (!admin) {
    if (profile) {
      await PlatformAuditService.log({
        category: "security",
        action: "unauthorized_access",
        entityType: "platform_route",
        status: "denied",
        description: "A non-System-Admin user attempted platform access.",
        companyId: profile.companyId,
      });
    }
    redirect(
      profile
        ? profile.roleName === "Admin"
          ? "/admin/dashboard"
          : "/dashboard"
        : "/login",
    );
  }
  const platformSettings = await PlatformControlService.getSettings();

  return (
    <div className="app-shell min-h-svh">
      <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/platform/dashboard"
            className="flex min-w-0 items-center gap-3 font-semibold"
          >
            <span className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-2xl">
              <ShieldCheck className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate">
                {platformSettings.platformName} Control Center
              </span>
              <span className="text-muted-foreground block truncate text-xs font-normal">
                {admin.displayName}
              </span>
            </span>
          </Link>
          <LogoutButton compact />
        </div>
        <nav
          className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6"
          aria-label="Platform navigation"
        >
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="bg-card hover:border-primary/40 hover:bg-accent inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
