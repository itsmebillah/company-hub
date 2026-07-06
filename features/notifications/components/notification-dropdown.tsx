"use client";

import { useState, useTransition } from "react";
import { Bell, Circle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { markNotificationReadAction } from "@/features/notifications/actions/notification.actions";
import type {
  NotificationItem,
  NotificationSummary,
} from "@/features/notifications/types/notification.types";
import { cn } from "@/lib/utils";

type NotificationDropdownProps = {
  summary: NotificationSummary;
};

function formatUnreadCount(count: number) {
  if (count <= 0) {
    return "";
  }

  return count > 99 ? "99+" : String(count);
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function NotificationRow({ notification }: { notification: NotificationItem }) {
  const [, startTransition] = useTransition();
  const content = (
    <div className="flex min-w-0 items-start gap-3">
      <span
        className={cn(
          "mt-1.5 size-2 shrink-0 rounded-full",
          notification.isRead ? "bg-muted" : "bg-primary",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{notification.title}</p>
          {!notification.isRead ? (
            <Circle className="size-2 shrink-0 fill-primary text-primary" />
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {notification.message}
        </p>
        <p className="mt-1 text-[0.68rem] text-muted-foreground">
          {formatTime(notification.createdAt)}
        </p>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return (
      <a
        href={notification.actionUrl}
        className="block rounded-lg px-3 py-2 transition hover:bg-accent"
        onClick={() => {
          if (!notification.isRead) {
            startTransition(() => {
              void markNotificationReadAction(notification.id);
            });
          }
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className="block w-full rounded-lg px-3 py-2 text-left transition hover:bg-accent"
      onClick={() => {
        if (!notification.isRead) {
          startTransition(() => {
            void markNotificationReadAction(notification.id);
          });
        }
      }}
    >
      {content}
    </button>
  );
}

export function NotificationDropdown({ summary }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadLabel = formatUnreadCount(summary.unreadCount);

  return (
    <div className="relative">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="relative size-9"
        aria-label="Notifications"
        title="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Bell className="size-4" aria-hidden="true" />
        {unreadLabel ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-[0.62rem] font-semibold leading-none text-destructive-foreground">
            {unreadLabel}
          </span>
        ) : null}
      </Button>

      {isOpen ? (
        <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-1rem))] overflow-hidden rounded-xl border bg-popover shadow-soft">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              Latest updates from Company Hub
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {summary.latest.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              summary.latest.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                />
              ))
            )}
          </div>

          <div className="border-t px-4 py-3 text-center">
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground"
              disabled
              title="Full notification center coming later"
            >
              View all
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
