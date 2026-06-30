import { Clock3 } from "lucide-react";

export function ActivityCard() {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
          <Clock3 className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">Placeholder</p>
        </div>
      </div>
      <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Activity will appear here.
      </div>
    </section>
  );
}
