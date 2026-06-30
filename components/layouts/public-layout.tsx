import type { ReactNode } from "react";

import { AppFooter } from "@/components/common/app-footer";
import { AppHeader } from "@/components/common/app-header";

type PublicLayoutProps = {
  children: ReactNode;
};

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader />
      <div className="flex-1">{children}</div>
      <AppFooter />
    </div>
  );
}
