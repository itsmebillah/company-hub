"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ANNOUNCEMENT_PRIORITIES } from "@/features/announcements/constants/announcement-options";
import type {
  AnnouncementActionState,
  AnnouncementFormValues,
  AnnouncementListItem,
} from "@/features/announcements/types/announcement.types";

type AnnouncementFormProps = {
  announcement?: AnnouncementListItem | null;
  onClose: () => void;
  onSubmit: (values: AnnouncementFormValues) => Promise<AnnouncementActionState>;
};

const defaultValues: AnnouncementFormValues = {
  title: "",
  description: "",
  content: "",
  bannerUrl: "",
  priority: "normal",
  publishFrom: "",
  publishUntil: "",
  status: "active",
  targetAudience: "company",
};

function toValues(announcement?: AnnouncementListItem | null) {
  if (!announcement) {
    return defaultValues;
  }

  return {
    ...defaultValues,
    title: announcement.title,
    description: announcement.description,
    bannerUrl: announcement.bannerUrl,
    priority: announcement.priority,
    publishFrom: announcement.publishFrom
      ? announcement.publishFrom.slice(0, 16)
      : "",
    publishUntil: announcement.publishUntil
      ? announcement.publishUntil.slice(0, 16)
      : "",
    status: announcement.status,
  };
}

export function AnnouncementForm({
  announcement,
  onClose,
  onSubmit,
}: AnnouncementFormProps) {
  const [values, setValues] = useState<AnnouncementFormValues>(
    toValues(announcement),
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(announcement);

  function updateValue<Key extends keyof AnnouncementFormValues>(
    key: Key,
    value: AnnouncementFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const result = await onSubmit(values);

    if (!result.ok) {
      setIsSubmitting(false);
      setMessage(result.message);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              {isEdit ? "Edit Announcement" : "Create Announcement"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Schedule internal communication for employees.
            </p>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Title</span>
            <input
              value={values.title}
              onChange={(event) => updateValue("title", event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Short Description</span>
            <textarea
              value={values.description}
              onChange={(event) =>
                updateValue("description", event.target.value)
              }
              className="min-h-20 w-full rounded-md border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Content</span>
            <textarea
              value={values.content}
              onChange={(event) => updateValue("content", event.target.value)}
              className="min-h-32 w-full rounded-md border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Rich text editor shell: formatted content will be enhanced in a later editor sprint."
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Banner Image</span>
            <input
              value={values.bannerUrl}
              onChange={(event) => updateValue("bannerUrl", event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Optional banner URL"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Priority</span>
            <select
              value={values.priority}
              onChange={(event) =>
                updateValue(
                  "priority",
                  event.target.value as AnnouncementFormValues["priority"],
                )
              }
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ANNOUNCEMENT_PRIORITIES.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Status</span>
            <select
              value={values.status}
              onChange={(event) =>
                updateValue(
                  "status",
                  event.target.value as AnnouncementFormValues["status"],
                )
              }
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Publish From</span>
            <input
              type="datetime-local"
              value={values.publishFrom}
              onChange={(event) =>
                updateValue("publishFrom", event.target.value)
              }
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Publish Until</span>
            <input
              type="datetime-local"
              value={values.publishUntil}
              onChange={(event) =>
                updateValue("publishUntil", event.target.value)
              }
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <fieldset className="space-y-2 md:col-span-2">
            <legend className="text-sm font-medium">Target Audience</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ["company", "Entire Company"],
                ["roles", "Selected Roles"],
                ["employees", "Selected Employees"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className="flex h-11 items-center gap-2 rounded-md border bg-background px-3 text-sm"
                >
                  <input
                    type="radio"
                    checked={values.targetAudience === value}
                    onChange={() =>
                      updateValue(
                        "targetAudience",
                        value as AnnouncementFormValues["targetAudience"],
                      )
                    }
                    disabled={value !== "company"}
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Existing schema stores company-wide announcements. Role and
              employee targeting are prepared in the UI and require a future
              audience table to persist.
            </p>
          </fieldset>

          {message ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive md:col-span-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{message}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-3 border-t pt-4 md:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
