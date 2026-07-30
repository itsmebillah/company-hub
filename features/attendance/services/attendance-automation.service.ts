import "server-only";

import type { AttendanceAutomationEvent } from "@/features/attendance/types/attendance-events";
import type { AttendanceRecord } from "@/features/attendance/types/attendance.types";
import { NotificationService } from "@/features/notifications/services/notification.service";

export type AttendanceAutomationHandler = (
  event: AttendanceAutomationEvent,
) => Promise<void>;

const notificationHandler: AttendanceAutomationHandler = async (event) => {
  if (event.type === "attendance.updated") {
    return;
  }

  await NotificationService.create({
    companyId: event.companyId,
    employeeId: event.employeeId,
    type: "attendance",
    title:
      event.type === "attendance.created"
        ? "Attendance check-in recorded"
        : "Attendance completed",
    message:
      event.type === "attendance.created"
        ? `Check-in recorded for ${event.attendanceDate}.`
        : `Check-out recorded for ${event.attendanceDate}.`,
    actionUrl: "/attendance",
  });
};

const handlers: readonly AttendanceAutomationHandler[] = [notificationHandler];

function createEventBase(record: AttendanceRecord) {
  return {
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    companyId: record.companyId,
    employeeId: record.employeeId,
    attendanceId: record.id,
    attendanceDate: record.attendanceDate,
    record,
  };
}

async function dispatch(event: AttendanceAutomationEvent) {
  const results = await Promise.allSettled(
    handlers.map((handler) => handler(event)),
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error(
        "[AttendanceAutomationService] Attendance event handler failed.",
        {
          eventId: event.eventId,
          eventType: event.type,
          attendanceId: event.attendanceId,
          reason: result.reason,
        },
      );
    }
  });
}

export const AttendanceAutomationService = {
  async attendanceCreated(record: AttendanceRecord) {
    await dispatch({
      ...createEventBase(record),
      type: "attendance.created",
    });
  },

  async attendanceCompleted(record: AttendanceRecord) {
    const eventBase = createEventBase(record);

    await Promise.all([
      dispatch({
        ...eventBase,
        eventId: crypto.randomUUID(),
        type: "attendance.updated",
        changedFields: ["checkOut", "workingMinutes", "status"],
      }),
      dispatch({
        ...eventBase,
        type: "attendance.completed",
      }),
    ]);
  },
};
