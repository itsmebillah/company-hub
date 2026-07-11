import type { ReactNode } from "react";

import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { appConfig } from "@/lib/config";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="app-shell flex min-h-svh flex-col">
      <header className="px-4 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-[92rem] items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-6xl">{children}</div>
      </main>
      <footer className="px-4 pb-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-xl rounded-full border border-white/20 bg-card/70 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md">
          <p>Version {appConfig.version}</p>
          <p className="mt-1">Copyright {new Date().getFullYear()} Company Hub</p>
        </div>
      </footer>
    </div>
  );
}
