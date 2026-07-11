import "server-only";

import { logActivity } from "@/features/activity/utils/activity-log";
import type {
  AdminCalendarPageData,
  CalendarDayInfo,
  EmployeeCalendarPageData,
  HolidayCalendarFormValues,
  HolidayCalendarItem,
  HolidayEventFormValues,
  HolidayEventItem,
  HolidayType,
} from "@/features/company-calendar/types/calendar.types";
import { getAppDateString } from "@/lib/datetime";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function normalizeOptional(value: string) {
  const nextValue = value.trim();

  return nextValue.length > 0 ? nextValue : null;
}

function assertHolidayType(value: string): asserts value is HolidayType {
  if (
    value !== "public_holiday" &&
    value !== "company_holiday" &&
    value !== "optional_holiday"
  ) {
    throw new Error("Holiday type is invalid.");
  }
}

async function getActiveCompanyId() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    console.error("[CalendarService] Unable to load company.", error);
    throw new Error("Unable to load company information.");
  }

  const companyId = data[0]?.id;

  if (!companyId) {
    throw new Error("Company was not found.");
  }

  return companyId;
}

function toCalendar(row: {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  status: HolidayCalendarItem["status"];
}): HolidayCalendarItem {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    description: row.description,
    isDefault: row.is_default,
    status: row.status,
  };
}

function toEvent(row: {
  id: string;
  calendar_id: string;
  title: string;
  holiday_type: HolidayType;
  date: string;
  is_working_day: boolean;
  description: string | null;
  status: HolidayEventItem["status"];
}): HolidayEventItem {
  return {
    id: row.id,
    calendarId: row.calendar_id,
    title: row.title,
    holidayType: row.holiday_type,
    date: row.date,
    isWorkingDay: row.is_working_day,
    description: row.description,
    status: row.status,
  };
}

function validateCalendar(values: HolidayCalendarFormValues) {
  if (!values.name.trim()) {
    throw new Error("Calendar name is required.");
  }

  if (values.status !== "active" && values.status !== "inactive") {
    throw new Error("Calendar status is invalid.");
  }
}

function validateEvent(values: HolidayEventFormValues) {
  if (!values.calendarId) {
    throw new Error("Calendar is required.");
  }

  if (!values.title.trim()) {
    throw new Error("Holiday title is required.");
  }

  if (!values.date) {
    throw new Error("Holiday date is required.");
  }

  assertHolidayType(values.holidayType);

  if (values.status !== "active" && values.status !== "inactive") {
    throw new Error("Holiday status is invalid.");
  }
}

async function listCalendars(companyId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("holiday_calendars")
    .select("id, company_id, name, description, is_default, status")
    .eq("company_id", companyId)
    .neq("status", "archived")
    .order("name", { ascending: true });

  if (error) {
    console.error("[CalendarService] Unable to load calendars.", error);
    throw new Error("Unable to load holiday calendars.");
  }

  return data.map(toCalendar);
}

async function listEvents(calendarIds: string[], activeOnly = false) {
  if (calendarIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("holiday_events")
    .select(
      "id, calendar_id, title, holiday_type, date, is_working_day, description, status",
    )
    .in("calendar_id", calendarIds)
    .order("date", { ascending: true });

  if (activeOnly) {
    query = query.eq("status", "active");
  } else {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) {
    console.error("[CalendarService] Unable to load events.", error);
    throw new Error("Unable to load holiday events.");
  }

  return data.map(toEvent);
}

async function getDefaultCalendar(companyId: string) {
  const calendars = await listCalendars(companyId);

  return (
    calendars.find(
      (calendar) => calendar.isDefault && calendar.status === "active",
    ) ??
    calendars.find((calendar) => calendar.status === "active") ??
    null
  );
}

export const CalendarService = {
  async getAdminPageData(): Promise<AdminCalendarPageData> {
    const companyId = await getActiveCompanyId();
    const calendars = await listCalendars(companyId);
    const events = await listEvents(calendars.map((calendar) => calendar.id));

    return { calendars, events };
  },

  async getEmployeePageData(): Promise<EmployeeCalendarPageData> {
    const companyId = await getActiveCompanyId();
    const today = getAppDateString();
    const calendar = await getDefaultCalendar(companyId);

    if (!calendar) {
      return {
        today: {
          date: today,
          status: "working_day",
          title: "Working Day",
          events: [],
        },
        upcomingEvents: [],
        events: [],
      };
    }

    const events = await listEvents([calendar.id], true);
    const todayInfo = await this.getDateInfo(companyId, today);
    const upcomingEvents = events
      .filter((event) => event.date >= today && !event.isWorkingDay)
      .slice(0, 5);

    return { today: todayInfo, upcomingEvents, events };
  },

  async getDateInfo(
    companyId: string,
    date: string,
  ): Promise<CalendarDayInfo> {
    const calendar = await getDefaultCalendar(companyId);

    if (!calendar) {
      return {
        date,
        status: "working_day",
        title: "Working Day",
        events: [],
      };
    }

    const events = (await listEvents([calendar.id], true)).filter(
      (event) => event.date === date,
    );
    const nonWorkingEvent = events.find((event) => !event.isWorkingDay);

    if (!nonWorkingEvent) {
      return {
        date,
        status: "working_day",
        title: "Working Day",
        events,
      };
    }

    return {
      date,
      status:
        nonWorkingEvent.holidayType === "optional_holiday"
          ? "optional_holiday"
          : "holiday",
      title: nonWorkingEvent.title,
      events,
    };
  },

  async countWorkingDays(
    companyId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    let workingDays = 0;

    for (
      const cursor = new Date(start);
      cursor <= end;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const date = cursor.toISOString().slice(0, 10);
      const info = await this.getDateInfo(companyId, date);

      if (info.status === "working_day" || info.status === "optional_holiday") {
        workingDays += 1;
      }
    }

    return workingDays;
  },

  async createCalendar(values: HolidayCalendarFormValues) {
    validateCalendar(values);

    const companyId = await getActiveCompanyId();
    const supabase = createSupabaseAdminClient();

    if (values.isDefault) {
      await supabase
        .from("holiday_calendars")
        .update({ is_default: false })
        .eq("company_id", companyId);
    }

    const { error } = await supabase.from("holiday_calendars").insert({
      company_id: companyId,
      name: values.name.trim(),
      description: normalizeOptional(values.description),
      is_default: values.isDefault,
      status: values.status,
    });

    if (error) {
      throw new Error("Unable to create holiday calendar.");
    }
  },

  async updateCalendar(id: string, values: HolidayCalendarFormValues) {
    validateCalendar(values);

    const companyId = await getActiveCompanyId();
    const supabase = createSupabaseAdminClient();

    if (values.isDefault) {
      await supabase
        .from("holiday_calendars")
        .update({ is_default: false })
        .eq("company_id", companyId)
        .neq("id", id);
    }

    const { error } = await supabase
      .from("holiday_calendars")
      .update({
        name: values.name.trim(),
        description: normalizeOptional(values.description),
        is_default: values.isDefault,
        status: values.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) {
      throw new Error("Unable to update holiday calendar.");
    }
  },

  async archiveCalendar(id: string) {
    const companyId = await getActiveCompanyId();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("holiday_calendars")
      .update({
        status: "archived",
        is_default: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) {
      throw new Error("Unable to archive holiday calendar.");
    }
  },

  async setDefaultCalendar(id: string) {
    const companyId = await getActiveCompanyId();
    const supabase = createSupabaseAdminClient();
    await supabase
      .from("holiday_calendars")
      .update({ is_default: false })
      .eq("company_id", companyId);

    const { error } = await supabase
      .from("holiday_calendars")
      .update({ is_default: true, status: "active" })
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) {
      throw new Error("Unable to set default holiday calendar.");
    }
  },

  async createEvent(values: HolidayEventFormValues) {
    validateEvent(values);

    const companyId = await getActiveCompanyId();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("holiday_events")
      .insert({
        calendar_id: values.calendarId,
        title: values.title.trim(),
        holiday_type: values.holidayType,
        date: values.date,
        is_working_day: values.isWorkingDay,
        description: normalizeOptional(values.description),
        status: values.status,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error("Unable to create holiday.");
    }

    await logActivity({
      companyId,
      module: "calendar",
      action: "created",
      entityType: "holiday_events",
      entityId: data.id,
      description: `Created holiday ${values.title.trim()}`,
    });
  },

  async updateEvent(id: string, values: HolidayEventFormValues) {
    validateEvent(values);

    const companyId = await getActiveCompanyId();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("holiday_events")
      .update({
        calendar_id: values.calendarId,
        title: values.title.trim(),
        holiday_type: values.holidayType,
        date: values.date,
        is_working_day: values.isWorkingDay,
        description: normalizeOptional(values.description),
        status: values.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error("Unable to update holiday.");
    }

    await logActivity({
      companyId,
      module: "calendar",
      action: "updated",
      entityType: "holiday_events",
      entityId: id,
      description: `Updated holiday ${values.title.trim()}`,
    });
  },

  async archiveEvent(id: string) {
    const companyId = await getActiveCompanyId();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("holiday_events")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error("Unable to archive holiday.");
    }

    await logActivity({
      companyId,
      module: "calendar",
      action: "archived",
      entityType: "holiday_events",
      entityId: id,
      description: "Archived holiday",
    });
  },

  async prepareHolidayReminder(_eventId: string) {
    return {
      ready: true,
      scheduled: false,
    };
  },
};
