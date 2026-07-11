import type { ReactNode } from "react";

import { AppFooter } from "@/components/common/app-footer";
import { AppHeader } from "@/components/common/app-header";
import { MobileBottomNav } from "@/components/common/mobile-bottom-nav";
import { PageContainer } from "@/components/common/page-container";
import { NativeNotificationBridge } from "@/features/notifications/components";
import { NotificationService } from "@/features/notifications/services/notification.service";

type AppLayoutProps = {
  children: ReactNode;
};

export async function AppLayout({ children }: AppLayoutProps) {
  const notificationSummary = await NotificationService.getCurrentUserSummary();

  return (
    <div className="app-shell flex min-h-svh flex-col">
      <AppHeader showProfile notificationSummary={notificationSummary} />
      <PageContainer className="flex-1 py-5 pb-28 sm:py-6 md:pb-8 lg:py-8">
        <main className="app-page">{children}</main>
      </PageContainer>
      <AppFooter />
      <MobileBottomNav />
      <NativeNotificationBridge summary={notificationSummary} />
    </div>
  );
}
