import { ServerCog } from "lucide-react";

export function SystemStatusCard() {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
          <ServerCog className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold">System Status</h2>
          <p className="text-sm text-muted-foreground">Placeholder</p>
        </div>
      </div>
      <div className="mt-6 space-y-3 text-sm">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span>Application</span>
          <span className="text-muted-foreground">--</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span>Database</span>
          <span className="text-muted-foreground">--</span>
        </div>
      </div>
    </section>
  );
}
