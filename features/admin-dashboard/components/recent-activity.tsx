import { Clock3, History } from "lucide-react";
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
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Recent Activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Newest company changes from core operational modules.
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <History className="size-5" aria-hidden="true" />
        </div>
      </div>

      {items.length > 0 ? (
        <ol className="mt-5 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span className="mt-1 size-2 rounded-full bg-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    {item.module ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-secondary-foreground">
                        {item.module}
                      </span>
                    ) : null}
                    {item.action ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
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
                  <span className="text-xs text-muted-foreground">
                    {item.time}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed bg-background p-6 text-center">
          <Clock3 className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No recent activity</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Recent company changes will appear here once activity is recorded.
          </p>
        </div>
      )}
    </section>
  );
}
