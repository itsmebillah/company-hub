import { Building2, CalendarDays } from "lucide-react";

type DashboardHeaderProps = {
  companyName: string;
  userName: string;
  currentDate: string;
};

export function DashboardHeader({
  companyName,
  userName,
  currentDate,
}: DashboardHeaderProps) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4 p-6">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Building2 className="size-7" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              {companyName}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
              Good day, {userName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Monitor company operations and open the core admin workspaces from
              one place.
            </p>
          </div>
        </div>
        <div className="border-t bg-secondary/40 p-6 md:border-l md:border-t-0">
          <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm">
            <CalendarDays
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="font-medium">{currentDate}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
