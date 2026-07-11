import { Building2, CalendarDays, Layers3, Shield } from "lucide-react";

import type { DashboardSystemStatus } from "@/features/admin-dashboard/types/dashboard.types";
import { cn } from "@/lib/utils";
import { getRenderableImageSrc } from "@/lib/media";

type ExecutiveOverviewProps = {
  companyName: string;
  companyLogo?: string | null;
  currentDate: string;
  totalModules: number;
  systemStatus: DashboardSystemStatus;
};

const statusTone = {
  healthy:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  warning:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  error: "bg-destructive/10 text-destructive ring-destructive/30",
};

const statusLabel = {
  healthy: "Healthy",
  warning: "Needs Attention",
  error: "Error",
};

export function ExecutiveOverview({
  companyName,
  companyLogo,
  currentDate,
  totalModules,
  systemStatus,
}: ExecutiveOverviewProps) {
  const logoSrc = getRenderableImageSrc(companyLogo);

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Admin Overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Company identity, module coverage, and overall platform readiness.
          </p>
        </div>
        <span
          className={cn(
            "w-fit rounded-full px-2.5 py-1 text-xs font-medium ring-1",
            statusTone[systemStatus],
          )}
        >
          {statusLabel[systemStatus]}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <img
                src={logoSrc ?? companyLogo}
                alt=""
                className="size-11 rounded-lg border object-cover"
              />
            ) : (
              <div className="flex size-11 items-center justify-center rounded-lg bg-secondary">
                <Building2 className="size-5" aria-hidden="true" />
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Company</p>
              <p className="break-words font-medium">{companyName}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-secondary">
              <CalendarDays className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Date</p>
              <p className="font-medium">{currentDate}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-secondary">
              <Layers3 className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Modules</p>
              <p className="font-medium">{totalModules}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-secondary">
              <Shield className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">System Status</p>
              <p className="font-medium">{statusLabel[systemStatus]}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
