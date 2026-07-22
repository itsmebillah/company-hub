"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { AlertCircle, ImagePlus, Loader2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnnouncementImage } from "@/features/announcements/components/announcement-image";
import { ANNOUNCEMENT_PRIORITIES } from "@/features/announcements/constants/announcement-options";
import { NOTIFICATION_PRIORITY_OPTIONS } from "@/features/notifications/constants/notification-priority";
import type {
  AnnouncementActionState,
  AnnouncementAudienceOptions,
  AnnouncementFormValues,
  AnnouncementListItem,
} from "@/features/announcements/types/announcement.types";
import { ANNOUNCEMENT_IMAGES_BUCKET } from "@/lib/media";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AnnouncementFormProps = {
  companyId: string;
  announcement?: AnnouncementListItem | null;
  audienceOptions: AnnouncementAudienceOptions;
  onClose: () => void;
  onSubmit: (values: AnnouncementFormValues) => Promise<AnnouncementActionState>;
};

const defaultValues: AnnouncementFormValues = {
  title: "",
  description: "",
  content: "",
  bannerUrl: "",
  priority: "normal",
  notificationPriority: "normal",
  publishFrom: "",
  publishUntil: "",
  status: "active",
  targetAudience: "company",
  roleIds: [],
  employeeIds: [],
};

function toValues(
  announcement?: AnnouncementListItem | null,
): AnnouncementFormValues {
  if (!announcement) {
    return defaultValues;
  }

  return {
    ...defaultValues,
    title: announcement.title,
    description: announcement.description,
    bannerUrl: announcement.bannerUrl,
    priority: announcement.priority,
    notificationPriority: "normal",
    publishFrom: announcement.publishFrom
      ? announcement.publishFrom.slice(0, 16)
      : "",
    publishUntil: announcement.publishUntil
      ? announcement.publishUntil.slice(0, 16)
      : "",
    status: announcement.status,
    targetAudience: announcement.targetAudience,
    roleIds: announcement.roleIds,
    employeeIds: announcement.employeeIds,
  };
}

function getAnnouncementImagePath(companyId: string, file: File) {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, "-");

  return `${companyId}/announcements/${Date.now()}-${safeName}`;
}

export function AnnouncementForm({
  companyId,
  announcement,
  audienceOptions,
  onClose,
  onSubmit,
}: AnnouncementFormProps) {
  const [values, setValues] = useState<AnnouncementFormValues>(
    toValues(announcement),
  );
  const [message, setMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(announcement);

  function updateValue<Key extends keyof AnnouncementFormValues>(
    key: Key,
    value: AnnouncementFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleSelection(
    key: "roleIds" | "employeeIds",
    id: string,
    checked: boolean,
  ) {
    setValues((current) => {
      const currentIds = current[key];
      const nextIds = checked
        ? Array.from(new Set([...currentIds, id]))
        : currentIds.filter((item) => item !== id);

      return { ...current, [key]: nextIds };
    });
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadMessage("Please choose a valid image file.");
      return;
    }

    setIsUploadingImage(true);
    setUploadMessage("");

    const storagePath = getAnnouncementImagePath(companyId, file);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.storage
      .from(ANNOUNCEMENT_IMAGES_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: true,
      });

    setIsUploadingImage(false);

    if (error) {
      setUploadMessage("Unable to upload image. Please try another image.");
      return;
    }

    updateValue("bannerUrl", storagePath);
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

          <div className="space-y-3 md:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="min-w-0 flex-1 space-y-2">
                <span className="text-sm font-medium">Banner Image</span>
                <input
                  value={values.bannerUrl}
                  onChange={(event) =>
                    updateValue("bannerUrl", event.target.value)
                  }
                  className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="announcement-images path or existing public URL"
                />
              </label>
              <div className="flex gap-2">
                <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium">
                  {isUploadingImage ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ImagePlus className="size-4" aria-hidden="true" />
                  )}
                  {isUploadingImage ? "Uploading" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={isUploadingImage}
                    onChange={handleImageChange}
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!values.bannerUrl || isUploadingImage}
                  onClick={() => {
                    setUploadMessage("");
                    updateValue("bannerUrl", "");
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            </div>
            {values.bannerUrl ? (
              <AnnouncementImage
                src={values.bannerUrl}
                className="aspect-video w-full rounded-xl"
              />
            ) : null}
            {uploadMessage ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>{uploadMessage}</p>
              </div>
            ) : null}
          </div>

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
            <span className="text-sm font-medium">Notification Priority</span>
            <select
              value={values.notificationPriority}
              onChange={(event) =>
                updateValue(
                  "notificationPriority",
                  event.target.value as AnnouncementFormValues["notificationPriority"],
                )
              }
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {NOTIFICATION_PRIORITY_OPTIONS.map((priority) => (
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
                  />
                  {label}
                </label>
              ))}
            </div>

            {values.targetAudience === "roles" ? (
              <div className="grid max-h-48 gap-2 overflow-y-auto rounded-md border bg-background p-3 sm:grid-cols-2">
                {audienceOptions.roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={values.roleIds.includes(role.id)}
                      onChange={(event) =>
                        toggleSelection("roleIds", role.id, event.target.checked)
                      }
                    />
                    {role.label}
                  </label>
                ))}
                {audienceOptions.roles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active roles found.
                  </p>
                ) : null}
              </div>
            ) : null}

            {values.targetAudience === "employees" ? (
              <div className="grid max-h-56 gap-2 overflow-y-auto rounded-md border bg-background p-3 sm:grid-cols-2">
                {audienceOptions.employees.map((employee) => (
                  <label
                    key={employee.id}
                    className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={values.employeeIds.includes(employee.id)}
                      onChange={(event) =>
                        toggleSelection(
                          "employeeIds",
                          employee.id,
                          event.target.checked,
                        )
                      }
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-medium">{employee.label}</span>
                      {employee.description ? (
                        <span className="block text-xs text-muted-foreground">
                          {employee.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
                {audienceOptions.employees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active employees found.
                  </p>
                ) : null}
              </div>
            ) : null}
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
