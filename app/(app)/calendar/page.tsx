import { EmployeeCalendarPage } from "@/features/company-calendar/components";
import { CalendarService } from "@/features/company-calendar/services/calendar.service";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const data = await CalendarService.getEmployeePageData();

  return <EmployeeCalendarPage data={data} />;
}
