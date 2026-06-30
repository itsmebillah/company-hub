import type { ReactNode } from "react";

import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { PageContainer } from "@/components/common/page-container";

type AppHeaderProps = {
  actions?: ReactNode;
};

export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header className="border-b bg-background/95">
      <PageContainer className="flex h-14 items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle />
        </div>
      </PageContainer>
    </header>
  );
}
