import { CalendarDays, Megaphone, PackageCheck } from "lucide-react";

type SummaryPanelProps = {
  currentDate: string;
  version: string;
};

export function SummaryPanel({ currentDate, version }: SummaryPanelProps) {
  return (
    <aside className="space-y-4">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            <CalendarDays className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Today&apos;s Summary</h2>
            <p className="text-sm text-muted-foreground">{currentDate}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Open tasks</p>
            <p className="mt-1 text-xl font-semibold">0</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Alerts</p>
            <p className="mt-1 text-xl font-semibold">0</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <Megaphone className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Latest Announcement</h2>
            <p className="text-sm text-muted-foreground">
              No announcement published yet.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <PackageCheck className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold">System Version</h2>
            <p className="text-sm text-muted-foreground">v{version}</p>
          </div>
        </div>
      </section>
    </aside>
  );
}
