"use client";

import { useEffect, useMemo, useState } from "react";
import { BellOff, X } from "lucide-react";

import type {
  NotificationItem,
  NotificationSummary,
} from "@/features/notifications/types/notification.types";

type NativeNotificationBridgeProps = {
  summary: NotificationSummary;
};

type NativeNotificationOptions = NotificationOptions & {
  timestamp?: number;
  vibrate?: number[];
};

const SHOWN_NOTIFICATIONS_KEY = "company-hub:native-notifications:shown";
const APP_ICON = "/icon.svg";
const APP_BADGE = "/icon.svg";

function isNativeNotificationSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

function getStoredIds() {
  try {
    const rawValue = window.localStorage.getItem(SHOWN_NOTIFICATIONS_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return new Set<string>(Array.isArray(parsedValue) ? parsedValue : []);
  } catch {
    return new Set<string>();
  }
}

function storeShownIds(ids: Set<string>) {
  try {
    window.localStorage.setItem(
      SHOWN_NOTIFICATIONS_KEY,
      JSON.stringify(Array.from(ids).slice(-100)),
    );
  } catch {
    // Local storage is a convenience cache only. Notification display should
    // continue even if the browser blocks storage.
  }
}

function getNotificationBody(notification: NotificationItem) {
  return notification.message
    ? `${notification.title}: ${notification.message}`
    : notification.title;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    return registration;
  } catch (error) {
    console.error(
      "[NativeNotificationBridge] Unable to register service worker.",
      error,
    );
    return null;
  }
}

async function showNativeNotification(
  registration: ServiceWorkerRegistration | null,
  notification: NotificationItem,
) {
  const targetUrl = notification.actionUrl ?? "/";
  const options: NativeNotificationOptions = {
    body: getNotificationBody(notification),
    icon: APP_ICON,
    badge: APP_BADGE,
    tag: notification.id,
    timestamp: Date.now(),
    data: {
      url: targetUrl,
      notificationId: notification.id,
    },
    vibrate: [120, 60, 120],
  };

  if (registration?.showNotification) {
    await registration.showNotification("Company Hub", options);
    return;
  }

  const browserNotification = new Notification("Company Hub", options);
  browserNotification.onclick = () => {
    window.focus();
    window.location.assign(targetUrl);
    browserNotification.close();
  };
}

export function NativeNotificationBridge({
  summary,
}: NativeNotificationBridgeProps) {
  const [showDeniedHelper, setShowDeniedHelper] = useState(false);
  const unreadNotifications = useMemo(
    () => summary.latest.filter((notification) => !notification.isRead),
    [summary.latest],
  );

  useEffect(() => {
    if (!isNativeNotificationSupported()) {
      return;
    }

    let isMounted = true;

    async function prepareNotifications() {
      const registration = await registerServiceWorker();

      if (!isMounted || !("Notification" in window)) {
        return;
      }

      if (Notification.permission === "denied") {
        setShowDeniedHelper(true);
        return;
      }

      if (Notification.permission === "default") {
        return;
      }

      const shownIds = getStoredIds();
      const unseenNotifications = unreadNotifications.filter(
        (notification) => !shownIds.has(notification.id),
      );

      for (const notification of unseenNotifications) {
        try {
          await showNativeNotification(registration, notification);
          shownIds.add(notification.id);
        } catch (error) {
          console.error(
            "[NativeNotificationBridge] Unable to show native notification.",
            error,
          );
        }
      }

      storeShownIds(shownIds);
    }

    void prepareNotifications();

    return () => {
      isMounted = false;
    };
  }, [unreadNotifications]);

  if (!showDeniedHelper) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-sm items-start gap-3 rounded-2xl border bg-popover/95 p-3 text-sm text-popover-foreground shadow-[var(--shadow-card)] backdrop-blur md:bottom-4">
      <BellOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p className="min-w-0 flex-1">
        Browser notifications are blocked. You can enable them later from your
        browser site settings.
      </p>
      <button
        type="button"
        className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Dismiss notification permission message"
        onClick={() => setShowDeniedHelper(false)}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
