import Link from "next/link";
import { CalendarCheck, ChevronRight } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Admin Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Centralize company-wide admin controls and shared workflow configuration.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/admin/settings/attendance"
          className="group rounded-xl border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarCheck className="size-5" aria-hidden="true" />
            </span>
            <ChevronRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
          </div>
          <h2 className="mt-4 text-base font-semibold">Attendance</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage assigned-location, company-location, remote, and hybrid attendance rules.
          </p>
        </Link>
      </div>
    </section>
  );
}
