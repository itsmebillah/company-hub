import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

type SystemStatusItem = {
  label: string;
  description: string;
  status: "healthy" | "error";
  icon: LucideIcon;
};

type SystemStatusProps = {
  items: SystemStatusItem[];
};

const badgeClasses = {
  healthy:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  error:
    "bg-destructive/10 text-destructive ring-destructive/30",
};

const statusLabels = {
  healthy: "Healthy",
  error: "Error",
};

export function SystemStatus({ items }: SystemStatusProps) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">System Status</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live platform health checks for core services.
          </p>
        </div>
        <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                  <Icon className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                  badgeClasses[item.status],
                )}
              >
                {statusLabels[item.status]}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
