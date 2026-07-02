import { Megaphone } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import {
  AnnouncementPriorityBadge,
  AnnouncementStatusBadge,
} from "@/features/announcements/components/announcement-badges";
import type { AnnouncementListResult } from "@/features/announcements/types/announcement.types";
import { getRenderableImageSrc } from "@/lib/media";

type EmployeeAnnouncementsPageProps = {
  result: AnnouncementListResult;
};

function formatDate(value: string) {
  if (!value) {
    return "Available now";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function EmployeeAnnouncementsPage({
  result,
}: EmployeeAnnouncementsPageProps) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Announcements</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Latest company updates and internal communication.
        </p>
      </div>

      {result.announcements.length === 0 ? (
        <EmptyState
          title="No announcements available"
          description="There are no active announcements for you right now."
          className="bg-card shadow-sm"
        />
      ) : (
        <div className="grid gap-4">
          {result.announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="overflow-hidden rounded-xl border bg-card shadow-sm"
            >
              {getRenderableImageSrc(announcement.bannerUrl) ? (
                <img
                  src={getRenderableImageSrc(announcement.bannerUrl) ?? ""}
                  alt=""
                  className="aspect-[4/1] w-full object-cover"
                />
              ) : null}
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <AnnouncementPriorityBadge priority={announcement.priority} />
                  <AnnouncementStatusBadge status={announcement.status} />
                </div>
                <div className="mt-4 flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Megaphone className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">
                      {announcement.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(announcement.publishFrom)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {announcement.description || "No content provided."}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
