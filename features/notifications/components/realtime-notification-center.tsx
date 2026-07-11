"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { NativeNotificationBridge } from "@/features/notifications/components/native-notification-bridge";
import { NotificationDropdown } from "@/features/notifications/components/notification-dropdown";
import {
  getCurrentAdminNotificationSummaryAction,
  getCurrentNotificationSummaryAction,
} from "@/features/notifications/actions/notification.actions";
import type {
  NotificationItem,
  NotificationSummary,
  RealtimeNotificationScope,
} from "@/features/notifications/types/notification.types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type NotificationRow =
  Database["public"]["Tables"]["notifications"]["Row"];

type RealtimeNotificationCenterProps = {
  initialSummary: NotificationSummary;
  scope: RealtimeNotificationScope;
};

function toNotificationItem(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    actionUrl: row.action_url,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

function sortLatest(first: NotificationItem, second: NotificationItem) {
  return (
    new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );
}

function upsertLatest(
  latest: NotificationItem[],
  notification: NotificationItem,
) {
  const existingIndex = latest.findIndex((item) => item.id === notification.id);
  const nextLatest =
    existingIndex >= 0
      ? latest.map((item) =>
          item.id === notification.id ? notification : item,
        )
      : [notification, ...latest];

  return nextLatest.sort(sortLatest).slice(0, 5);
}

function getFilter(scope: RealtimeNotificationScope) {
  if (scope.type === "employee") {
    return `employee_id=eq.${scope.employeeId}`;
  }

  return `company_id=eq.${scope.companyId}`;
}

function getChannelName(scope: RealtimeNotificationScope) {
  if (scope.type === "employee") {
    return `notifications:employee:${scope.employeeId}`;
  }

  return `notifications:company:${scope.companyId}`;
}

function isNotificationRow(value: unknown): value is NotificationRow {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "company_id" in value &&
      "type" in value &&
      "title" in value &&
      "message" in value,
  );
}

export function RealtimeNotificationCenter({
  initialSummary,
  scope,
}: RealtimeNotificationCenterProps) {
  const [summary, setSummary] = useState(initialSummary);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  const syncSummary = useCallback(async () => {
    try {
      const nextSummary =
        scope.type === "company"
          ? await getCurrentAdminNotificationSummaryAction()
          : await getCurrentNotificationSummaryAction();

      setSummary(nextSummary);
    } catch (error) {
      console.error(
        "[RealtimeNotificationCenter] Unable to synchronize notifications.",
        error,
      );
    }
  }, [scope.type]);

  const handleInsertPayload = useCallback(
    (payload: RealtimePostgresChangesPayload<NotificationRow>) => {
      const row = payload.new;

      if (!isNotificationRow(row)) {
        return;
      }

      const notification = toNotificationItem(row);

      setSummary((currentSummary) => {
        const latest = upsertLatest(currentSummary.latest, notification);
        const isAlreadyKnown = currentSummary.latest.some(
          (item) => item.id === notification.id,
        );
        const unreadCount =
          !isAlreadyKnown && !notification.isRead
            ? currentSummary.unreadCount + 1
            : currentSummary.unreadCount;

        return {
          latest,
          unreadCount: Math.max(unreadCount, 0),
        };
      });
    },
    [],
  );

  useEffect(() => {
    const channel = supabase
      .channel(getChannelName(scope))
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: getFilter(scope),
        },
        handleInsertPayload,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: getFilter(scope),
        },
        () => {
          void syncSummary();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void syncSummary();
        }
      });

    function handleOnline() {
      void syncSummary();
    }

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
      void supabase.removeChannel(channel);
    };
  }, [handleInsertPayload, scope, supabase, syncSummary]);

  const handleNotificationRead = useCallback((id: string) => {
    setSummary((currentSummary) => ({
      latest: currentSummary.latest.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
      unreadCount: Math.max(currentSummary.unreadCount - 1, 0),
    }));
  }, []);

  const handleAllNotificationsRead = useCallback(() => {
    setSummary((currentSummary) => ({
      latest: currentSummary.latest.map((notification) => ({
        ...notification,
        isRead: true,
      })),
      unreadCount: 0,
    }));
  }, []);

  return (
    <>
      <NotificationDropdown
        summary={summary}
        onNotificationRead={handleNotificationRead}
        onAllNotificationsRead={handleAllNotificationsRead}
      />
      <NativeNotificationBridge summary={summary} />
    </>
  );
}
