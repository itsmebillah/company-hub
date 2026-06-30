import type { ReactNode } from "react";

import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { appConfig } from "@/lib/config";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="px-4 py-5 text-center text-xs text-muted-foreground">
        <p>Version {appConfig.version}</p>
        <p className="mt-1">Copyright {new Date().getFullYear()} Company Hub</p>
      </footer>
    </div>
  );
}
