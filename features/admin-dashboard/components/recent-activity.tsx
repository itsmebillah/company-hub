import { Clock3, History } from "lucide-react";

import { IconBadge } from "@/components/common/icon-badge";
import { cn } from "@/lib/utils";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  module?: string;
  action?: string;
};

type RecentActivityProps = {
  items?: ActivityItem[];
};

export function RecentActivity({ items = [] }: RecentActivityProps) {
  return (
    <section className="rounded-[1.45rem] border bg-card/95 p-3.5 shadow-[var(--shadow-card)] sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Activity
          </p>
          <h2 className="text-sm font-semibold sm:text-base">Recent Activity</h2>
        </div>
        <IconBadge icon={History} className="size-10" />
      </div>

      {items.length > 0 ? (
        <ol className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex min-h-[4.25rem] gap-3 rounded-2xl border border-white/20 bg-background/65 px-3 py-2.5"
            >
              <span className="mt-2 size-2.5 rounded-full bg-primary shadow-[0_0_0_6px_rgba(37,99,235,0.08)]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="line-clamp-1 text-sm font-medium">
                      {item.title}
                    </p>
                    {item.module ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-wide text-secondary-foreground">
                        {item.module}
                      </span>
                    ) : null}
                    {item.action ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-wide",
                          item.action === "approved"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : item.action === "rejected"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
                        )}
                      >
                        {item.action}
                      </span>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.time}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed bg-background/70 p-4 text-center">
          <Clock3 className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">No recent activity</p>
        </div>
      )}
    </section>
  );
}
