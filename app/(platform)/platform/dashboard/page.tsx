import Link from "next/link";
import {
  Building2,
  CalendarCheck,
  CirclePause,
  Megaphone,
  MousePointerClick,
  ShieldAlert,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { PlatformControlService } from "@/features/platform-control/services/platform-control.service";
import { requireSystemAdminPage } from "@/features/platform-control/services/system-admin.service";

export default async function PlatformDashboardPage() {
  await requireSystemAdminPage();
  const data = await PlatformControlService.getDashboard();
  const activeCompanies = data.companies.filter(
    (item) => item.platform_status === "active",
  ).length;
  const inactiveCompanies = data.companies.filter(
    (item) => item.platform_status !== "active",
  ).length;
  const activeFeatures = data.features.filter(
    (item) => item.state === "enabled",
  ).length;
  const metrics = [
    ["Companies", String(data.companies.length), Building2],
    ["Active companies", String(activeCompanies), Building2],
    ["Inactive companies", String(inactiveCompanies), CirclePause],
    ["Employees", String(data.activeEmployees), Users],
    ["Company admins", String(data.activeAdmins), ShieldAlert],
    ["Attendance today", String(data.todayAttendance), CalendarCheck],
    ["Active announcements", String(data.activeAnnouncements), Megaphone],
    [
      "Platform features",
      `${activeFeatures}/${data.features.length} enabled`,
      SlidersHorizontal,
    ],
    [
      "Feature requests (30 days)",
      String(data.featureRequests30Days),
      MousePointerClick,
    ],
  ] as const;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-primary text-sm font-semibold">
          System administration
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Platform health and activity
        </h1>
        <p className="text-muted-foreground mt-2">
          Cross-company operational visibility with explicit controls.
        </p>
      </div>
      <section className="grid gap-3 min-[360px]:grid-cols-2 lg:grid-cols-3">
        {metrics.map(([label, value, Icon]) => (
          <article key={label} className="app-card p-4 sm:p-5">
            <Icon className="text-primary size-5" />
            <p className="mt-4 text-2xl font-bold">{value}</p>
            <p className="text-muted-foreground text-sm">{label}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="app-card p-4 sm:p-5">
          <h2 className="font-semibold">Quick actions</h2>
          <div className="mt-4 grid gap-2 min-[360px]:grid-cols-2">
            {[
              ["Create company", "/platform/companies"],
              ["Manage people", "/platform/people"],
              ["Manage features", "/platform/features"],
              ["Platform settings", "/platform/settings"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="hover:border-primary/40 hover:bg-accent flex min-h-11 items-center rounded-xl border px-3 text-sm font-semibold transition"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="app-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Recent companies</h2>
            <Link
              href="/platform/companies"
              className="text-primary text-sm font-semibold"
            >
              View all
            </Link>
          </div>
          <div className="mt-3 divide-y">
            {data.recentCompanies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <span className="min-w-0">
                  <strong className="block truncate">{company.name}</strong>
                  <span className="text-muted-foreground text-xs">
                    {company.employee_count ?? 0} employees
                  </span>
                </span>
                <span className="bg-accent rounded-full px-2.5 py-1 text-xs uppercase">
                  {company.platform_status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section>
        <div className="app-card p-4 sm:p-5">
          <h2 className="font-semibold">Platform health</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>Database</dt>
              <dd
                className={
                  data.databaseHealthy ? "text-emerald-600" : "text-destructive"
                }
              >
                {data.databaseHealthy ? "Connected" : "Unavailable"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Feature engine</dt>
              <dd className="text-emerald-600">Operational</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
