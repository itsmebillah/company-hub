import { NextResponse } from "next/server";

import { NotificationService } from "@/features/notifications/services/notification.service";
import type { NotificationTrackingEvent } from "@/features/notifications/types/notification.types";

function isTrackingEvent(value: unknown): value is NotificationTrackingEvent {
  return value === "delivered" || value === "opened";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      notificationId?: unknown;
      event?: unknown;
    };

    if (
      typeof payload.notificationId !== "string" ||
      payload.notificationId.trim().length === 0
    ) {
      return NextResponse.json(
        { message: "Notification ID is required." },
        { status: 400 },
      );
    }

    if (!isTrackingEvent(payload.event)) {
      return NextResponse.json(
        { message: "Notification event is invalid." },
        { status: 400 },
      );
    }

    const tracked = await NotificationService.trackCurrentUserNotification(
      payload.notificationId,
      payload.event,
    );

    if (!tracked) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[NotificationTrackingRoute] Unable to track notification.", error);

    return NextResponse.json(
      { message: "Unable to track notification." },
      { status: 500 },
    );
  }
}
