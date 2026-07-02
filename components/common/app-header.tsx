import type { ReactNode } from "react";
import Link from "next/link";
import { UserCircle } from "lucide-react";

import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { PageContainer } from "@/components/common/page-container";
import { LogoutButton } from "@/features/auth/components";

type AppHeaderProps = {
  actions?: ReactNode;
  showProfile?: boolean;
};

export function AppHeader({ actions, showProfile = false }: AppHeaderProps) {
  return (
    <header className="border-b bg-background/95">
      <PageContainer className="flex h-14 items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle />
          {showProfile ? (
            <Link
              href="/profile"
              className="inline-flex size-9 items-center justify-center rounded-md text-sm font-medium outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Profile"
              title="Profile"
            >
              <UserCircle className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
          <LogoutButton compact />
        </div>
      </PageContainer>
    </header>
  );
}
