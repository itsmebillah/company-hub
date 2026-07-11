"use client";

import { CheckCircle2, Download, MonitorSmartphone, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/features/pwa/hooks/use-pwa-install";

type PwaInstallSettingsCardProps = {
  companyId: string;
  onboardingVersion: number;
};

export function PwaInstallSettingsCard({
  companyId,
  onboardingVersion,
}: PwaInstallSettingsCardProps) {
  const {
    isInstalled,
    isInstallAvailable,
    isIosInstallAvailable,
    promptInstall,
  } = usePwaInstall({ companyId, onboardingVersion });

  return (
    <section id="application" className="app-card scroll-mt-24 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MonitorSmartphone className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Application</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Install Company Hub for a faster, app-like experience on this
              device.
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold">
          {isInstalled ? (
            <CheckCircle2 className="size-3.5 text-emerald-600" />
          ) : (
            <Smartphone className="size-3.5 text-muted-foreground" />
          )}
          {isInstalled ? "Installed" : "Browser Mode"}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/20 bg-background/75 p-4">
        {isInstalled ? (
          <p className="text-sm text-muted-foreground">
            Company Hub is already installed on this browser or device.
          </p>
        ) : isInstallAvailable ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Installation is available for this browser.
            </p>
            <Button
              type="button"
              className="h-10"
              onClick={() => {
                void promptInstall();
              }}
            >
              <Download className="size-4" aria-hidden="true" />
              Install App
            </Button>
          </div>
        ) : isIosInstallAvailable ? (
          <p className="text-sm leading-6 text-muted-foreground">
            On iPhone or iPad, open Share and choose Add to Home Screen.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            App installation is not available in this browser right now.
          </p>
        )}
      </div>
    </section>
  );
}
