import type { AttendanceCheckInput } from "@/features/attendance/types/attendance.types";

export type OfflineQueueStatus = "pending" | "syncing" | "failed";

export type OfflineAttendanceQueueItem = {
  id: string;
  type: "attendance";
  action: "check-in" | "check-out";
  input: AttendanceCheckInput;
  attendanceDate: string;
  createdAt: string;
  status: OfflineQueueStatus;
  error?: string;
};

export type OfflineQueueItem = OfflineAttendanceQueueItem;

const OFFLINE_QUEUE_KEY = "company-hub:offline-sync-queue";
export const OFFLINE_QUEUE_UPDATED_EVENT = "company-hub:offline-queue-updated";

function emitQueueUpdated() {
  window.dispatchEvent(new Event(OFFLINE_QUEUE_UPDATED_EVENT));
}

export function createOfflineQueueId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function listOfflineQueue(): OfflineQueueItem[] {
  try {
    const rawValue = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(items: OfflineQueueItem[]) {
  window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items));
  emitQueueUpdated();
}

export function enqueueOfflineItem(item: OfflineQueueItem) {
  const items = listOfflineQueue();
  saveOfflineQueue([...items, item]);
}

export function removeOfflineQueueItem(id: string) {
  saveOfflineQueue(listOfflineQueue().filter((item) => item.id !== id));
}

export function updateOfflineQueueItem(
  id: string,
  patch: Partial<OfflineQueueItem>,
) {
  saveOfflineQueue(
    listOfflineQueue().map((item) =>
      item.id === id ? ({ ...item, ...patch } as OfflineQueueItem) : item,
    ),
  );
}

export function countOfflineQueueItems() {
  return listOfflineQueue().length;
}
