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
    <section className="rounded-xl border bg-card p-6 shadow-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{companyName}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Welcome back, {userName}
          </h1>
        </div>
        <div className="rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground">
          {currentDate}
        </div>
      </div>
    </section>
  );
}
