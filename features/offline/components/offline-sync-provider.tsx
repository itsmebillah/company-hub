"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  checkInAction,
  checkOutAction,
} from "@/features/attendance/actions/attendance.actions";
import {
  listOfflineQueue,
  OFFLINE_QUEUE_UPDATED_EVENT,
  removeOfflineQueueItem,
  updateOfflineQueueItem,
} from "@/features/offline/utils/offline-queue";

const BACKGROUND_SYNC_TAG = "company-hub-sync-queue";

async function requestServiceWorkerSync() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const syncRegistration = registration as ServiceWorkerRegistration & {
      sync?: {
        register: (tag: string) => Promise<void>;
      };
    };

    if (syncRegistration.sync) {
      await syncRegistration.sync.register(BACKGROUND_SYNC_TAG);
    }
  } catch {
    // Background Sync is optional. The online event handles the fallback.
  }
}

export function OfflineSyncProvider() {
  const router = useRouter();
  const isSyncingRef = useRef(false);

  const syncQueue = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) {
      return;
    }

    isSyncingRef.current = true;

    try {
      const items = listOfflineQueue();

      for (const item of items) {
        if (item.type !== "attendance") {
          continue;
        }

        updateOfflineQueueItem(item.id, { status: "syncing", error: "" });

        const result =
          item.action === "check-in"
            ? await checkInAction(item.input)
            : await checkOutAction(item.input);

        if (result.ok) {
          removeOfflineQueueItem(item.id);
        } else {
          updateOfflineQueueItem(item.id, {
            status: "failed",
            error: result.message,
          });
        }
      }

      router.refresh();
    } finally {
      isSyncingRef.current = false;
    }
  }, [router]);

  useEffect(() => {
    function handleOnline() {
      void syncQueue();
    }

    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "COMPANY_HUB_SYNC_QUEUE") {
        void syncQueue();
      }
    }

    function handleQueueUpdated() {
      void requestServiceWorkerSync();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener(OFFLINE_QUEUE_UPDATED_EVENT, handleQueueUpdated);
    navigator.serviceWorker?.addEventListener("message", handleMessage);

    if (navigator.onLine) {
      void syncQueue();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener(OFFLINE_QUEUE_UPDATED_EVENT, handleQueueUpdated);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, [syncQueue]);

  return null;
}
