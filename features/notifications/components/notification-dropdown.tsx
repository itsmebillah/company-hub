"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Bell,
  BellRing,
  CalendarCheck,
  CheckCheck,
  ClipboardCheck,
  FileText,
  Megaphone,
  PackageOpen,
  Settings,
  Umbrella,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions/notification.actions";
import type {
  NotificationItem,
  NotificationSummary,
  NotificationType,
} from "@/features/notifications/types/notification.types";
import { cn } from "@/lib/utils";

type NotificationDropdownProps = {
  summary: NotificationSummary;
};

type NotificationSection = {
  title: "Today" | "Yesterday" | "Earlier";
  items: NotificationItem[];
};

const notificationIcons: Record<NotificationType, typeof Megaphone> = {
  announcement: Megaphone,
  resource: PackageOpen,
  attendance: CalendarCheck,
  leave: Umbrella,
  approval: ClipboardCheck,
  document: FileText,
  system: Settings,
};

function formatUnreadCount(count: number) {
  if (count <= 0) {
    return "";
  }

  return count > 99 ? "99+" : String(count);
}

function isSameDate(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function getSectionTitle(value: string): NotificationSection["title"] {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (Number.isNaN(date.getTime())) {
    return "Earlier";
  }

  if (isSameDate(date, today)) {
    return "Today";
  }

  if (isSameDate(date, yesterday)) {
    return "Yesterday";
  }

  return "Earlier";
}

function groupNotifications(items: NotificationItem[]): NotificationSection[] {
  const sections: NotificationSection[] = [
    { title: "Today", items: [] },
    { title: "Yesterday", items: [] },
    { title: "Earlier", items: [] },
  ];

  items.forEach((item) => {
    const section = sections.find(
      (current) => current.title === getSectionTitle(item.createdAt),
    );

    section?.items.push(item);
  });

  return sections.filter((section) => section.items.length > 0);
}

function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffInSeconds = Math.max(
    Math.floor((Date.now() - date.getTime()) / 1000),
    0,
  );

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function NotificationRow({ notification }: { notification: NotificationItem }) {
  const [, startTransition] = useTransition();
  const Icon = notificationIcons[notification.type];
  const content = (
    <div className="flex min-w-0 items-start gap-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg border",
          notification.isRead
            ? "bg-muted text-muted-foreground"
            : "border-primary/20 bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate text-sm",
              notification.isRead ? "font-medium" : "font-semibold",
            )}
          >
            {notification.title}
          </p>
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              notification.isRead ? "bg-transparent" : "bg-primary",
            )}
            aria-hidden="true"
          />
        </div>
        <p
          className={cn(
            "mt-1 line-clamp-2 text-xs",
            notification.isRead
              ? "text-muted-foreground"
              : "text-foreground/80",
          )}
        >
          {notification.message}
        </p>
        <p className="mt-1 text-[0.68rem] text-muted-foreground">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return (
      <a
        href={notification.actionUrl}
        className={cn(
          "block rounded-lg px-3 py-2.5 outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
          notification.isRead ? "opacity-75" : "bg-accent/40",
        )}
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
      className={cn(
        "block w-full rounded-lg px-3 py-2.5 text-left outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
        notification.isRead ? "opacity-75" : "bg-accent/40",
      )}
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
  const [isMarkingAll, startMarkAllTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const unreadLabel = formatUnreadCount(summary.unreadCount);
  const sections = useMemo(
    () => groupNotifications(summary.latest),
    [summary.latest],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="relative size-9"
        aria-label="Notifications"
        title="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((current) => !current)}
      >
        {unreadLabel ? (
          <BellRing className="size-4" aria-hidden="true" />
        ) : (
          <Bell className="size-4" aria-hidden="true" />
        )}
        {unreadLabel ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-[0.62rem] font-semibold leading-none text-destructive-foreground">
            {unreadLabel}
          </span>
        ) : null}
      </Button>

      {isOpen ? (
        <div
          className="fixed inset-x-2 top-16 z-50 overflow-hidden rounded-xl border bg-popover shadow-soft sm:absolute sm:right-0 sm:left-auto sm:top-11 sm:w-[min(24rem,calc(100vw-1rem))]"
          role="menu"
        >
          <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {summary.unreadCount > 0
                  ? `${summary.unreadCount} unread update${
                      summary.unreadCount === 1 ? "" : "s"
                    }`
                  : "You are all caught up"}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 px-2 text-xs"
              disabled={summary.unreadCount === 0 || isMarkingAll}
              onClick={() => {
                startMarkAllTransition(() => {
                  void markAllNotificationsReadAction();
                });
              }}
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
              Mark all
            </Button>
          </div>

          <div className="max-h-[calc(100dvh-5.5rem)] overflow-y-auto p-2 sm:max-h-[min(28rem,70vh)]">
            {sections.length === 0 ? (
              <div className="flex flex-col items-center px-3 py-10 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Bell className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-medium">No notifications yet</p>
                <p className="mt-1 max-w-56 text-xs text-muted-foreground">
                  Updates from announcements, resources, and future modules will
                  appear here.
                </p>
              </div>
            ) : (
              sections.map((section) => (
                <section key={section.title} className="py-1">
                  <h3 className="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((notification) => (
                      <NotificationRow
                        key={notification.id}
                        notification={notification}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>

          <div className="border-t p-2">
            <a
              href="/notifications"
              className="flex h-9 items-center justify-center rounded-md text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Full notification center coming later"
            >
              View all
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
