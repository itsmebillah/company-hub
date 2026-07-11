"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CloudOff, Loader2 } from "lucide-react";

import {
  countOfflineQueueItems,
  OFFLINE_QUEUE_UPDATED_EVENT,
} from "@/features/offline/utils/offline-queue";
import { cn } from "@/lib/utils";

function getIsOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function OfflineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    function syncState() {
      setIsOnline(getIsOnline());
      setQueuedCount(countOfflineQueueItems());
    }

    syncState();
    window.addEventListener("online", syncState);
    window.addEventListener("offline", syncState);
    window.addEventListener(OFFLINE_QUEUE_UPDATED_EVENT, syncState);

    return () => {
      window.removeEventListener("online", syncState);
      window.removeEventListener("offline", syncState);
      window.removeEventListener(OFFLINE_QUEUE_UPDATED_EVENT, syncState);
    };
  }, []);

  if (isOnline && queuedCount === 0) {
    return null;
  }

  const Icon = isOnline ? (queuedCount > 0 ? Loader2 : CheckCircle2) : CloudOff;

  return (
    <div
      className={cn(
        "fixed left-1/2 top-3 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-soft)] backdrop-blur",
        isOnline
          ? "border-emerald-500/30 bg-emerald-50/95 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
          : "border-rose-500/30 bg-rose-50/95 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300",
      )}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={cn("size-3.5", queuedCount > 0 && isOnline && "animate-spin")}
        aria-hidden="true"
      />
      {isOnline
        ? queuedCount > 0
          ? `Syncing ${queuedCount}`
          : "Online"
        : queuedCount > 0
          ? `Offline Mode - ${queuedCount} pending`
          : "Offline Mode"}
    </div>
  );
}
