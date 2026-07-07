"use server";

import { revalidatePath } from "next/cache";

import { CalendarService } from "@/features/company-calendar/services/calendar.service";
import type {
  CalendarActionState,
  HolidayCalendarFormValues,
  HolidayEventFormValues,
} from "@/features/company-calendar/types/calendar.types";

const ADMIN_CALENDAR_PATH = "/admin/calendar";

function failure(error: unknown, fallback: string): CalendarActionState {
  return {
    ok: false,
    message: error instanceof Error ? error.message : fallback,
  };
}

export async function createHolidayCalendarAction(
  values: HolidayCalendarFormValues,
): Promise<CalendarActionState> {
  try {
    await CalendarService.createCalendar(values);
    revalidatePath(ADMIN_CALENDAR_PATH);
    return { ok: true, message: "Calendar created." };
  } catch (error) {
    return failure(error, "Unable to create calendar.");
  }
}

export async function updateHolidayCalendarAction(
  id: string,
  values: HolidayCalendarFormValues,
): Promise<CalendarActionState> {
  try {
    await CalendarService.updateCalendar(id, values);
    revalidatePath(ADMIN_CALENDAR_PATH);
    return { ok: true, message: "Calendar updated." };
  } catch (error) {
    return failure(error, "Unable to update calendar.");
  }
}

export async function archiveHolidayCalendarAction(
  id: string,
): Promise<CalendarActionState> {
  try {
    await CalendarService.archiveCalendar(id);
    revalidatePath(ADMIN_CALENDAR_PATH);
    return { ok: true, message: "Calendar archived." };
  } catch (error) {
    return failure(error, "Unable to archive calendar.");
  }
}

export async function setDefaultHolidayCalendarAction(
  id: string,
): Promise<CalendarActionState> {
  try {
    await CalendarService.setDefaultCalendar(id);
    revalidatePath(ADMIN_CALENDAR_PATH);
    return { ok: true, message: "Default calendar updated." };
  } catch (error) {
    return failure(error, "Unable to set default calendar.");
  }
}

export async function createHolidayEventAction(
  values: HolidayEventFormValues,
): Promise<CalendarActionState> {
  try {
    await CalendarService.createEvent(values);
    revalidatePath(ADMIN_CALENDAR_PATH);
    revalidatePath("/calendar");
    return { ok: true, message: "Holiday created." };
  } catch (error) {
    return failure(error, "Unable to create holiday.");
  }
}

export async function updateHolidayEventAction(
  id: string,
  values: HolidayEventFormValues,
): Promise<CalendarActionState> {
  try {
    await CalendarService.updateEvent(id, values);
    revalidatePath(ADMIN_CALENDAR_PATH);
    revalidatePath("/calendar");
    return { ok: true, message: "Holiday updated." };
  } catch (error) {
    return failure(error, "Unable to update holiday.");
  }
}

export async function archiveHolidayEventAction(
  id: string,
): Promise<CalendarActionState> {
  try {
    await CalendarService.archiveEvent(id);
    revalidatePath(ADMIN_CALENDAR_PATH);
    revalidatePath("/calendar");
    return { ok: true, message: "Holiday archived." };
  } catch (error) {
    return failure(error, "Unable to archive holiday.");
  }
}
