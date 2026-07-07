import {
  archiveHolidayCalendarAction,
  archiveHolidayEventAction,
  createHolidayCalendarAction,
  createHolidayEventAction,
  setDefaultHolidayCalendarAction,
  updateHolidayCalendarAction,
  updateHolidayEventAction,
} from "@/features/company-calendar/actions/calendar.actions";
import { AdminCalendarPage } from "@/features/company-calendar/components";
import { CalendarService } from "@/features/company-calendar/services/calendar.service";

export const dynamic = "force-dynamic";

export default async function AdminCalendarRoutePage() {
  const data = await CalendarService.getAdminPageData();

  return (
    <AdminCalendarPage
      calendars={data.calendars}
      events={data.events}
      onCreateCalendar={createHolidayCalendarAction}
      onUpdateCalendar={updateHolidayCalendarAction}
      onArchiveCalendar={archiveHolidayCalendarAction}
      onSetDefaultCalendar={setDefaultHolidayCalendarAction}
      onCreateEvent={createHolidayEventAction}
      onUpdateEvent={updateHolidayEventAction}
      onArchiveEvent={archiveHolidayEventAction}
    />
  );
}
