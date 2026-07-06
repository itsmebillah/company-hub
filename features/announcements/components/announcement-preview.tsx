import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AnnouncementPriorityBadge,
  AnnouncementStatusBadge,
} from "@/features/announcements/components/announcement-badges";
import { AnnouncementImage } from "@/features/announcements/components/announcement-image";
import type { AnnouncementListItem } from "@/features/announcements/types/announcement.types";

type AnnouncementPreviewProps = {
  announcement: AnnouncementListItem | null;
  onClose: () => void;
};

function formatWindow(announcement: AnnouncementListItem) {
  const from = announcement.publishFrom
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(announcement.publishFrom))
    : "Immediately";
  const until = announcement.publishUntil
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(announcement.publishUntil))
    : "No end date";

  return `${from} - ${until}`;
}

export function AnnouncementPreview({
  announcement,
  onClose,
}: AnnouncementPreviewProps) {
  if (!announcement) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close announcement preview"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-lg overflow-y-auto border-l bg-background shadow-soft">
        <div className="flex h-14 items-center justify-between border-b px-5">
          <h2 className="font-semibold">Preview</h2>
          <Button type="button" size="icon" variant="ghost" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="p-5">
          <AnnouncementImage
            src={announcement.bannerUrl}
            className="mb-5 aspect-video w-full rounded-xl"
          />
          <div className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap gap-2">
              <AnnouncementPriorityBadge priority={announcement.priority} />
              <AnnouncementStatusBadge status={announcement.status} />
            </div>
            <h1 className="mt-4 text-2xl font-semibold">
              {announcement.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatWindow(announcement)}
            </p>
            <div className="mt-5 whitespace-pre-wrap text-sm leading-6">
              {announcement.description || "No content provided."}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
