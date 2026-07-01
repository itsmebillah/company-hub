import { Megaphone } from "lucide-react";

import { AnnouncementPriorityBadge } from "@/features/announcements/components/announcement-badges";
import type { DashboardAnnouncement } from "@/features/admin-dashboard/types/dashboard.types";

type RecentAnnouncementsProps = {
  announcements: DashboardAnnouncement[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function RecentAnnouncements({
  announcements,
}: RecentAnnouncementsProps) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Recent Announcements</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest internal communication records.
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
          <Megaphone className="size-5" aria-hidden="true" />
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed bg-background p-6 text-center">
          <Megaphone className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No Announcements</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Announcements will appear here after they are created.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {announcement.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(announcement.publishDate)}
                </p>
              </div>
              <AnnouncementPriorityBadge priority={announcement.priority} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
