import type { ReactNode } from "react";

import { AppFooter } from "@/components/common/app-footer";
import { AppHeader } from "@/components/common/app-header";
import { PageContainer } from "@/components/common/page-container";
import { NotificationService } from "@/features/notifications/services/notification.service";

type AppLayoutProps = {
  children: ReactNode;
};

export async function AppLayout({ children }: AppLayoutProps) {
  const notificationSummary =
    await NotificationService.getCurrentUserSummary();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader showProfile notificationSummary={notificationSummary} />
      <PageContainer className="flex-1 py-6">{children}</PageContainer>
      <AppFooter />
    </div>
  );
}
