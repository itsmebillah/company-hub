"use client";

import { useState, useTransition } from "react";
import { Archive, Eye, Megaphone, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import {
  AnnouncementPriorityBadge,
  AnnouncementStatusBadge,
} from "@/features/announcements/components/announcement-badges";
import { AnnouncementForm } from "@/features/announcements/components/announcement-form";
import { AnnouncementPreview } from "@/features/announcements/components/announcement-preview";
import { ANNOUNCEMENT_PRIORITIES } from "@/features/announcements/constants/announcement-options";
import type {
  AnnouncementActionState,
  AnnouncementFormValues,
  AnnouncementListItem,
  AnnouncementListResult,
} from "@/features/announcements/types/announcement.types";

type AnnouncementManagementPageProps = {
  result: AnnouncementListResult;
  filters: {
    search: string;
    status: string;
    priority: string;
    target: string;
  };
  onCreate: (values: AnnouncementFormValues) => Promise<AnnouncementActionState>;
  onUpdate: (
    id: string,
    values: AnnouncementFormValues,
  ) => Promise<AnnouncementActionState>;
  onArchive: (id: string) => Promise<AnnouncementActionState>;
  onRestore: (id: string) => Promise<AnnouncementActionState>;
};

function formatDate(value: string) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AnnouncementManagementPage({
  result,
  filters,
  onCreate,
  onUpdate,
  onArchive,
  onRestore,
}: AnnouncementManagementPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<AnnouncementListItem | null>(null);
  const [previewAnnouncement, setPreviewAnnouncement] =
    useState<AnnouncementListItem | null>(null);
  const [message, setMessage] = useState("");

  function updateFilters(nextFilters: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { ...filters, ...nextFilters };

    Object.entries(merged).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    router.replace(`/admin/announcements?${params.toString()}`);
  }

  function closeForm() {
    setIsCreating(false);
    setEditingAnnouncement(null);
    router.refresh();
  }

  function runStatusAction(
    action: (id: string) => Promise<AnnouncementActionState>,
    id: string,
  ) {
    setMessage("");
    startTransition(async () => {
      const result = await action(id);
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Announcements</h1>
          <p className="text-sm text-muted-foreground">
            Create, schedule, and manage internal communications.
          </p>
        </div>
        <Button type="button" onClick={() => setIsCreating(true)}>
          <Plus className="size-4" />
          New Announcement
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={filters.search}
              onChange={(event) => updateFilters({ search: event.target.value })}
              placeholder="Search title or description"
              className="h-11 w-full rounded-md border bg-background pl-9 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <select
            value={filters.status}
            onChange={(event) => updateFilters({ status: event.target.value })}
            className="h-11 rounded-md border bg-background px-3"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={filters.priority}
            onChange={(event) => updateFilters({ priority: event.target.value })}
            className="h-11 rounded-md border bg-background px-3"
          >
            <option value="">All priorities</option>
            {ANNOUNCEMENT_PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
          <select
            value={filters.target}
            onChange={(event) => updateFilters({ target: event.target.value })}
            className="h-11 rounded-md border bg-background px-3"
          >
            <option value="">All targets</option>
            <option value="company">Entire Company</option>
          </select>
        </div>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {isPending ? (
        <p className="text-sm text-muted-foreground">Updating announcement...</p>
      ) : null}

      {result.announcements.length === 0 ? (
        <EmptyState
          title="No announcements found"
          description="Create an announcement or adjust the current filters."
          className="bg-card shadow-sm"
          action={
            <Button type="button" onClick={() => setIsCreating(true)}>
              <Megaphone className="size-4" />
              Create Announcement
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Publish From</th>
                  <th className="px-4 py-3 font-medium">Publish Until</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.announcements.map((announcement) => (
                  <tr key={announcement.id} className="border-b last:border-0">
                    <td className="max-w-96 px-4 py-3">
                      <p className="font-medium">{announcement.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {announcement.description || "No description"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <AnnouncementPriorityBadge priority={announcement.priority} />
                    </td>
                    <td className="px-4 py-3">{formatDate(announcement.publishFrom)}</td>
                    <td className="px-4 py-3">{formatDate(announcement.publishUntil)}</td>
                    <td className="px-4 py-3">
                      <AnnouncementStatusBadge status={announcement.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button type="button" size="icon" variant="ghost" onClick={() => setPreviewAnnouncement(announcement)}>
                          <Eye className="size-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" onClick={() => setEditingAnnouncement(announcement)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            announcement.status === "archived"
                              ? runStatusAction(onRestore, announcement.id)
                              : runStatusAction(onArchive, announcement.id)
                          }
                        >
                          {announcement.status === "archived" ? (
                            <RotateCcw className="size-4" />
                          ) : (
                            <Archive className="size-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 lg:hidden">
            {result.announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-xl border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{announcement.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {announcement.description || "No description"}
                    </p>
                  </div>
                  <AnnouncementStatusBadge status={announcement.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <AnnouncementPriorityBadge priority={announcement.priority} />
                  <span className="rounded-full border px-2.5 py-1 text-xs">
                    {formatDate(announcement.publishFrom)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Button type="button" variant="outline" onClick={() => setPreviewAnnouncement(announcement)}>
                    Preview
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingAnnouncement(announcement)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      announcement.status === "archived"
                        ? runStatusAction(onRestore, announcement.id)
                        : runStatusAction(onArchive, announcement.id)
                    }
                  >
                    {announcement.status === "archived" ? "Restore" : "Archive"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {isCreating || editingAnnouncement ? (
        <AnnouncementForm
          announcement={editingAnnouncement}
          onClose={closeForm}
          onSubmit={
            editingAnnouncement
              ? (values) => onUpdate(editingAnnouncement.id, values)
              : onCreate
          }
        />
      ) : null}

      <AnnouncementPreview
        announcement={previewAnnouncement}
        onClose={() => setPreviewAnnouncement(null)}
      />
    </section>
  );
}
