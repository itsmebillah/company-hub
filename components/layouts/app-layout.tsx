import type { ReactNode } from "react";

import { AppFooter } from "@/components/common/app-footer";
import { AppHeader } from "@/components/common/app-header";
import { PageContainer } from "@/components/common/page-container";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader showProfile />
      <PageContainer className="flex-1 py-6">{children}</PageContainer>
      <AppFooter />
    </div>
  );
}
