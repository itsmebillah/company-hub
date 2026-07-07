import type { Database } from "@/lib/supabase/types";

export type HolidayType = Database["public"]["Enums"]["holiday_type"];
export type CalendarStatus = Database["public"]["Enums"]["record_status"];

export type HolidayCalendarItem = {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  status: CalendarStatus;
};

export type HolidayEventItem = {
  id: string;
  calendarId: string;
  title: string;
  holidayType: HolidayType;
  date: string;
  isWorkingDay: boolean;
  description: string | null;
  status: CalendarStatus;
};

export type HolidayCalendarFormValues = {
  name: string;
  description: string;
  isDefault: boolean;
  status: Extract<CalendarStatus, "active" | "inactive">;
};

export type HolidayEventFormValues = {
  calendarId: string;
  title: string;
  holidayType: HolidayType;
  date: string;
  isWorkingDay: boolean;
  description: string;
  status: Extract<CalendarStatus, "active" | "inactive">;
};

export type CalendarDayStatus =
  | "working_day"
  | "holiday"
  | "optional_holiday";

export type CalendarDayInfo = {
  date: string;
  status: CalendarDayStatus;
  title: string;
  events: HolidayEventItem[];
};

export type CalendarActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

export type AdminCalendarPageData = {
  calendars: HolidayCalendarItem[];
  events: HolidayEventItem[];
};

export type EmployeeCalendarPageData = {
  today: CalendarDayInfo;
  upcomingEvents: HolidayEventItem[];
  events: HolidayEventItem[];
};
