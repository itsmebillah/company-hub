"use client";

import { Download, Smartphone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/features/pwa/hooks/use-pwa-install";

type PwaInstallCardProps = {
  companyId: string;
  onboardingVersion: number;
};

export function PwaInstallCard({
  companyId,
  onboardingVersion,
}: PwaInstallCardProps) {
  const {
    shouldShowInstallCard,
    isInstallAvailable,
    isIosInstallAvailable,
    promptInstall,
    dismissInstall,
  } = usePwaInstall({ companyId, onboardingVersion });

  if (!shouldShowInstallCard) {
    return null;
  }

  return (
    <aside className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-sm rounded-[1.35rem] border bg-card/95 p-3 shadow-[var(--shadow-card)] backdrop-blur md:bottom-4">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Smartphone className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Install Company Hub</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Install Company Hub for a faster, app-like experience.
              </p>
            </div>
            <button
              type="button"
              className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Dismiss install prompt"
              onClick={dismissInstall}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {isIosInstallAvailable ? (
            <p className="mt-2 rounded-2xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              On iPhone or iPad, open Share and choose Add to Home Screen.
            </p>
          ) : null}

          <div className="mt-3 flex gap-2">
            {isInstallAvailable ? (
              <Button
                type="button"
                size="sm"
                className="h-9 flex-1"
                onClick={() => {
                  void promptInstall();
                }}
              >
                <Download className="size-4" aria-hidden="true" />
                Install
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 flex-1"
              onClick={dismissInstall}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
