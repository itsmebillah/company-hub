import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

type KPICardProps = {
  title: string;
  value: string;
  trend: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "violet";
};

const toneClasses = {
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  green:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  amber:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  violet:
    "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
};

export function KPICard({
  title,
  value,
  trend,
  icon: Icon,
  tone = "blue",
}: KPICardProps) {
  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-ring/60">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg",
            toneClasses[tone],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <TrendingUp className="size-3.5 text-emerald-600" aria-hidden="true" />
        <span>{trend}</span>
      </div>
    </article>
  );
}
