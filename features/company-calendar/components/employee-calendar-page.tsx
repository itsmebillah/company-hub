import { CalendarDays } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import type { EmployeeCalendarPageData } from "@/features/company-calendar/types/calendar.types";

export function EmployeeCalendarPage({ data }: { data: EmployeeCalendarPageData }) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Company Calendar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          View company holidays, upcoming holidays, and today&apos;s working status.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Today&apos;s Status</p>
        <h2 className="mt-2 text-2xl font-semibold">{data.today.title}</h2>
        <p className="mt-1 text-sm capitalize text-muted-foreground">
          {data.today.status.replaceAll("_", " ")}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Upcoming Holidays</h2>
        {data.upcomingEvents.length === 0 ? (
          <EmptyState
            title="No upcoming holidays"
            description="Upcoming holidays will appear here when published."
            className="bg-card shadow-sm"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.upcomingEvents.map((event) => (
              <HolidayCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Company Holidays</h2>
        {data.events.length === 0 ? (
          <EmptyState
            title="No holidays published"
            description="The company calendar has no active holidays yet."
            className="bg-card shadow-sm"
          />
        ) : (
          <div className="grid gap-3">
            {data.events.map((event) => (
              <HolidayCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function HolidayCard({
  event,
}: {
  event: EmployeeCalendarPageData["events"][number];
}) {
  return (
    <article className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        <CalendarDays className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-semibold">{event.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {event.date} - {event.holidayType.replaceAll("_", " ")}
        </p>
        {event.description ? (
          <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
        ) : null}
      </div>
    </article>
  );
}
