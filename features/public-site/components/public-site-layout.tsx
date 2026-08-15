import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/common/logo";
import { PageContainer } from "@/components/common/page-container";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";

export function PublicSiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell flex min-h-svh flex-col">
      <header className="relative z-10 px-0 pt-3 sm:pt-4">
        <PageContainer>
          <div className="app-card app-card-subtle flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <Logo />
            <div className="flex items-center gap-1 sm:gap-2">
              <nav
                className="hidden items-center gap-1 sm:flex"
                aria-label="Public navigation"
              >
                <Button asChild variant="ghost" size="sm">
                  <Link href="/privacy">Privacy</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/terms">Terms</Link>
                </Button>
              </nav>
              <ThemeToggle />
              <Button asChild size="sm">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="pt-4 pb-6">
        <PageContainer>
          <div className="app-card app-card-subtle flex flex-col gap-4 px-5 py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-foreground font-semibold">Company Hub</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Secure employee operations in one workspace.
              </p>
            </div>
            <nav
              className="flex flex-wrap gap-x-5 gap-y-2"
              aria-label="Legal navigation"
            >
              <Link
                className="text-muted-foreground hover:text-foreground"
                href="/privacy"
              >
                Privacy Policy
              </Link>
              <Link
                className="text-muted-foreground hover:text-foreground"
                href="/terms"
              >
                Terms of Service
              </Link>
              <Link
                className="text-muted-foreground hover:text-foreground"
                href="/login"
              >
                Login to Company Hub
              </Link>
            </nav>
          </div>
        </PageContainer>
      </footer>
    </div>
  );
}
