import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  Cloud,
  FileSpreadsheet,
  ShieldCheck,
  Users,
} from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { PublicSiteLayout } from "@/features/public-site/components/public-site-layout";

const capabilities = [
  {
    icon: Users,
    title: "Employee operations",
    description:
      "A focused workspace for employee records, company updates, leave, calendars, and day-to-day administration.",
  },
  {
    icon: CalendarCheck2,
    title: "Attendance management",
    description:
      "Secure attendance workflows support server-validated time, approved locations, work modes, and administrator review.",
  },
  {
    icon: ShieldCheck,
    title: "Protected attendance media",
    description:
      "Attendance selfies remain private, are available only to authorized administrators, and use controlled recovery handling.",
  },
  {
    icon: FileSpreadsheet,
    title: "Reliable reporting",
    description:
      "Approved reporting data can be synchronized to a configured Google Sheets workbook with retry and reconciliation safeguards.",
  },
] as const;

export function PublicHomePage() {
  return (
    <PublicSiteLayout>
      <main>
        <PageContainer className="py-12 sm:py-16 lg:py-24">
          <section className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
            <div>
              <p className="app-page-eyebrow">One secure company workspace</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Employee operations, attendance, and reporting—kept together.
              </h1>
              <p className="text-muted-foreground mt-6 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8">
                Company Hub helps organizations manage people, attendance,
                leave, company information, and operational reporting through
                one role-aware workspace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/login">
                    Login to Company Hub
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/privacy">Read our Privacy Policy</Link>
                </Button>
              </div>
              <p className="text-muted-foreground mt-4 text-xs leading-5">
                Company Hub accounts are provided by participating
                organizations. There is no public employee registration.
              </p>
            </div>

            <aside
              className="app-card app-card-subtle relative overflow-hidden p-6 sm:p-8"
              aria-label="Secure integration summary"
            >
              <div className="bg-primary/15 pointer-events-none absolute -top-16 -right-16 size-48 rounded-full blur-3xl" />
              <div className="app-icon-wrap text-primary size-14">
                <Cloud className="size-7" aria-hidden="true" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold">
                Controlled Google integrations
              </h2>
              <p className="text-muted-foreground mt-3 text-sm leading-6">
                Google Drive provides restricted permanent storage for
                attendance media. Google Sheets receives only approved reporting
                datasets; operational records remain governed by Company Hub.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Server-side credentials and role-based access",
                  "Durable synchronization with retry and recovery",
                  "No public employee, attendance, or dashboard data",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <ShieldCheck
                      className="text-primary mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
          </section>

          <section
            className="mt-16 sm:mt-20"
            aria-labelledby="capabilities-title"
          >
            <div className="max-w-2xl">
              <p className="app-page-eyebrow">Built for focused operations</p>
              <h2
                id="capabilities-title"
                className="mt-3 text-3xl font-semibold"
              >
                Practical tools with clear access boundaries
              </h2>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="app-card app-card-subtle p-5 sm:p-6"
                >
                  <div className="app-icon-wrap text-primary size-11">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="app-card mt-16 flex flex-col gap-5 p-6 sm:mt-20 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="text-2xl font-semibold">
                Already have a Company Hub account?
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                Continue to the protected employee workspace using the
                credentials provided by your organization.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href="/login">Login to Company Hub</Link>
            </Button>
          </section>
        </PageContainer>
      </main>
    </PublicSiteLayout>
  );
}
