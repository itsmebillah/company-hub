"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Archive, CalendarDays, Pencil, Plus, Star } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import type {
  CalendarActionState,
  HolidayCalendarFormValues,
  HolidayCalendarItem,
  HolidayEventFormValues,
  HolidayEventItem,
  HolidayType,
} from "@/features/company-calendar/types/calendar.types";

type AdminCalendarPageProps = {
  calendars: HolidayCalendarItem[];
  events: HolidayEventItem[];
  onCreateCalendar: (
    values: HolidayCalendarFormValues,
  ) => Promise<CalendarActionState>;
  onUpdateCalendar: (
    id: string,
    values: HolidayCalendarFormValues,
  ) => Promise<CalendarActionState>;
  onArchiveCalendar: (id: string) => Promise<CalendarActionState>;
  onSetDefaultCalendar: (id: string) => Promise<CalendarActionState>;
  onCreateEvent: (values: HolidayEventFormValues) => Promise<CalendarActionState>;
  onUpdateEvent: (
    id: string,
    values: HolidayEventFormValues,
  ) => Promise<CalendarActionState>;
  onArchiveEvent: (id: string) => Promise<CalendarActionState>;
};

const holidayTypes: Array<{ value: HolidayType; label: string }> = [
  { value: "public_holiday", label: "Public Holiday" },
  { value: "company_holiday", label: "Company Holiday" },
  { value: "optional_holiday", label: "Optional Holiday" },
];

function emptyCalendar(): HolidayCalendarFormValues {
  return {
    name: "",
    description: "",
    isDefault: false,
    status: "active",
  };
}

function calendarForm(calendar: HolidayCalendarItem): HolidayCalendarFormValues {
  return {
    name: calendar.name,
    description: calendar.description ?? "",
    isDefault: calendar.isDefault,
    status: calendar.status === "active" ? "active" : "inactive",
  };
}

function emptyEvent(calendarId: string): HolidayEventFormValues {
  return {
    calendarId,
    title: "",
    holidayType: "company_holiday",
    date: "",
    isWorkingDay: false,
    description: "",
    status: "active",
  };
}

function eventForm(event: HolidayEventItem): HolidayEventFormValues {
  return {
    calendarId: event.calendarId,
    title: event.title,
    holidayType: event.holidayType,
    date: event.date,
    isWorkingDay: event.isWorkingDay,
    description: event.description ?? "",
    status: event.status === "active" ? "active" : "inactive",
  };
}

export function AdminCalendarPage({
  calendars,
  events,
  onCreateCalendar,
  onUpdateCalendar,
  onArchiveCalendar,
  onSetDefaultCalendar,
  onCreateEvent,
  onUpdateEvent,
  onArchiveEvent,
}: AdminCalendarPageProps) {
  const router = useRouter();
  const [calendarFormValues, setCalendarFormValues] =
    useState<HolidayCalendarFormValues | null>(null);
  const [editingCalendar, setEditingCalendar] =
    useState<HolidayCalendarItem | null>(null);
  const [eventFormValues, setEventFormValues] =
    useState<HolidayEventFormValues | null>(null);
  const [editingEvent, setEditingEvent] = useState<HolidayEventItem | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const defaultCalendarId = calendars.find((calendar) => calendar.isDefault)?.id;

  function run(action: () => Promise<CalendarActionState>, closeForms = false) {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      setMessage(result.message);

      if (result.ok) {
        if (closeForms) {
          setCalendarFormValues(null);
          setEditingCalendar(null);
          setEventFormValues(null);
          setEditingEvent(null);
        }
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Holiday Calendar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Define company holidays, optional holidays, and working-day exceptions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setCalendarFormValues(emptyCalendar())}>
            <Plus className="size-4" aria-hidden="true" />
            Create Calendar
          </Button>
          <Button
            type="button"
            disabled={calendars.length === 0}
            onClick={() => setEventFormValues(emptyEvent(defaultCalendarId ?? calendars[0]?.id ?? ""))}
          >
            <Plus className="size-4" aria-hidden="true" />
            Create Holiday
          </Button>
        </div>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {isPending ? <p className="text-sm text-muted-foreground">Saving calendar...</p> : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Calendars</h2>
        {calendars.length === 0 ? (
          <EmptyState
            title="No holiday calendars found"
            description="Create a default calendar before adding holidays."
            className="bg-card shadow-sm"
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {calendars.map((calendar) => (
              <article key={calendar.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{calendar.name}</h3>
                      {calendar.isDefault ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                          <Star className="size-3" aria-hidden="true" />
                          Default
                        </span>
                      ) : null}
                      <span className="rounded-full border px-2 py-0.5 text-xs capitalize">
                        {calendar.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {calendar.description ?? "No description"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => {
                    setEditingCalendar(calendar);
                    setCalendarFormValues(calendarForm(calendar));
                  }}>
                    <Pencil className="size-4" /> Edit
                  </Button>
                  <Button type="button" size="sm" variant="outline" disabled={calendar.isDefault} onClick={() => run(() => onSetDefaultCalendar(calendar.id))}>
                    <Star className="size-4" /> Set Default
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => run(() => onArchiveCalendar(calendar.id))}>
                    <Archive className="size-4" /> Archive
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Holiday Events</h2>
          <span className="text-xs text-muted-foreground">
            Future import foundation: prepared, no automatic import yet.
          </span>
        </div>
        {events.length === 0 ? (
          <EmptyState
            title="No holidays found"
            description="Create a holiday or working-day exception."
            className="bg-card shadow-sm"
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="divide-y">
              {events.map((event) => (
                <article key={event.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <CalendarDays className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {event.date} - {event.holidayType.replaceAll("_", " ")} -{" "}
                        {event.isWorkingDay ? "Working day" : "Holiday"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => {
                      setEditingEvent(event);
                      setEventFormValues(eventForm(event));
                    }}>
                      <Pencil className="size-4" /> Edit
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => run(() => onArchiveEvent(event.id))}>
                      <Archive className="size-4" /> Archive
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {calendarFormValues ? (
        <CalendarForm
          values={calendarFormValues}
          onChange={setCalendarFormValues}
          onClose={() => {
            setCalendarFormValues(null);
            setEditingCalendar(null);
          }}
          onSubmit={() =>
            run(
              () =>
                editingCalendar
                  ? onUpdateCalendar(editingCalendar.id, calendarFormValues)
                  : onCreateCalendar(calendarFormValues),
              true,
            )
          }
        />
      ) : null}

      {eventFormValues ? (
        <EventForm
          calendars={calendars}
          values={eventFormValues}
          onChange={setEventFormValues}
          onClose={() => {
            setEventFormValues(null);
            setEditingEvent(null);
          }}
          onSubmit={() =>
            run(
              () =>
                editingEvent
                  ? onUpdateEvent(editingEvent.id, eventFormValues)
                  : onCreateEvent(eventFormValues),
              true,
            )
          }
        />
      ) : null}
    </section>
  );
}

function CalendarForm({
  values,
  onChange,
  onClose,
  onSubmit,
}: {
  values: HolidayCalendarFormValues;
  onChange: (values: HolidayCalendarFormValues) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="mx-auto my-10 max-w-xl space-y-4 rounded-xl border bg-card p-5 shadow-lg">
        <h2 className="text-xl font-semibold">Holiday Calendar</h2>
        <input value={values.name} onChange={(event) => onChange({ ...values, name: event.target.value })} placeholder="Calendar name" className="h-11 w-full rounded-md border bg-background px-3" />
        <textarea value={values.description} onChange={(event) => onChange({ ...values, description: event.target.value })} placeholder="Description" rows={3} className="w-full rounded-md border bg-background p-3" />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.isDefault} onChange={(event) => onChange({ ...values, isDefault: event.target.checked })} />
            Set as default
          </label>
          <select value={values.status} onChange={(event) => onChange({ ...values, status: event.target.value === "active" ? "active" : "inactive" })} className="h-11 rounded-md border bg-background px-3">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Calendar</Button>
        </div>
      </form>
    </div>
  );
}

function EventForm({
  calendars,
  values,
  onChange,
  onClose,
  onSubmit,
}: {
  calendars: HolidayCalendarItem[];
  values: HolidayEventFormValues;
  onChange: (values: HolidayEventFormValues) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="mx-auto my-10 max-w-xl space-y-4 rounded-xl border bg-card p-5 shadow-lg">
        <h2 className="text-xl font-semibold">Holiday Event</h2>
        <select value={values.calendarId} onChange={(event) => onChange({ ...values, calendarId: event.target.value })} className="h-11 w-full rounded-md border bg-background px-3">
          {calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.name}</option>)}
        </select>
        <input value={values.title} onChange={(event) => onChange({ ...values, title: event.target.value })} placeholder="Holiday title" className="h-11 w-full rounded-md border bg-background px-3" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="date" value={values.date} onChange={(event) => onChange({ ...values, date: event.target.value })} className="h-11 rounded-md border bg-background px-3" />
          <select value={values.holidayType} onChange={(event) => onChange({ ...values, holidayType: event.target.value as HolidayType })} className="h-11 rounded-md border bg-background px-3">
            {holidayTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.isWorkingDay} onChange={(event) => onChange({ ...values, isWorkingDay: event.target.checked })} />
            Mark as working day
          </label>
          <select value={values.status} onChange={(event) => onChange({ ...values, status: event.target.value === "active" ? "active" : "inactive" })} className="h-11 rounded-md border bg-background px-3">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <textarea value={values.description} onChange={(event) => onChange({ ...values, description: event.target.value })} placeholder="Description" rows={3} className="w-full rounded-md border bg-background p-3" />
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Holiday</Button>
        </div>
      </form>
    </div>
  );
}
