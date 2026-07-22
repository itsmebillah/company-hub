"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AlertCircle, ImagePlus, Loader2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  OPEN_MODES,
  RESOURCE_TYPES,
} from "@/features/resources/constants/resource-options";
import { RESOURCE_ICON_OPTIONS } from "@/features/resources/constants/resource-icons";
import {
  removeResourceImageUploadAction,
  uploadResourceImageAction,
} from "@/features/resources/actions/resource-image.actions";
import { ResourceVisual } from "@/features/resources/ui/resource-visual";
import type {
  ResourceActionState,
  ResourceCategoryOption,
  ResourceFormValues,
  ResourceListItem,
} from "@/features/resources/types/resource.types";

type ResourceFormProps = {
  resource?: ResourceListItem | null;
  categories: ResourceCategoryOption[];
  onClose: () => void;
  onSubmit: (values: ResourceFormValues) => Promise<ResourceActionState>;
};

const defaultValues: ResourceFormValues = {
  categoryId: "",
  title: "",
  description: "",
  resourceType: "",
  url: "",
  icon: "",
  thumbnail: "",
  displayOrder: "1",
  openMode: "new_tab",
  isFeatured: false,
  status: "active",
};

function toValues(resource?: ResourceListItem | null): ResourceFormValues {
  if (!resource) {
    return defaultValues;
  }

  return {
    categoryId: resource.categoryId,
    title: resource.title,
    description: resource.description,
    resourceType: resource.resourceType,
    url: resource.url,
    icon: resource.icon,
    thumbnail: resource.thumbnail,
    displayOrder: String(resource.displayOrder),
    openMode: resource.openMode,
    isFeatured: resource.isFeatured,
    status: resource.status,
  };
}

export function ResourceForm({
  resource,
  categories,
  onClose,
  onSubmit,
}: ResourceFormProps) {
  const [values, setValues] = useState<ResourceFormValues>(toValues(resource));
  const [message, setMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [pendingUploadedPath, setPendingUploadedPath] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const isEdit = Boolean(resource);

  useEffect(() => {
    setPortalElement(document.body);
  }, []);

  function updateValue<Key extends keyof ResourceFormValues>(
    key: Key,
    value: ResourceFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function removePendingUpload(path: string) {
    if (path) {
      await removeResourceImageUploadAction(path);
    }
  }

  async function handleClose() {
    await removePendingUpload(pendingUploadedPath);
    onClose();
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      !["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(
        file.type,
      )
    ) {
      setUploadMessage("Choose a PNG, JPG, SVG, or WebP image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadMessage("Quick Link images must be 2 MB or smaller.");
      return;
    }

    setIsUploading(true);
    setUploadMessage("");
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadResourceImageAction(formData);
    setIsUploading(false);

    if (!result.ok) {
      setUploadMessage(result.message);
      return;
    }

    await removePendingUpload(pendingUploadedPath);
    setPendingUploadedPath(result.path);
    updateValue("thumbnail", result.path);
  }

  async function handleRemoveImage() {
    setUploadMessage("");
    await removePendingUpload(pendingUploadedPath);
    setPendingUploadedPath("");
    updateValue("thumbnail", "");
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

    setPendingUploadedPath("");
    onClose();
  }

  if (!portalElement) {
    return null;
  }

  return createPortal(
    <div className="bg-background/80 fixed inset-0 z-[90] flex items-center justify-center px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-form-title"
        className="bg-card shadow-soft relative z-[91] max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 id="resource-form-title" className="text-lg font-semibold">
              {isEdit ? "Edit Resource" : "Create Resource"}
            </h2>
            <p className="text-muted-foreground text-sm">
              Configure the resource employees can open from Company Hub.
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => void handleClose()}
            aria-label="Close"
            disabled={isUploading || isSubmitting}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-medium">Category</span>
            <select
              value={values.categoryId}
              onChange={(event) =>
                updateValue("categoryId", event.target.value)
              }
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
              disabled={isSubmitting}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Title</span>
            <input
              value={values.title}
              onChange={(event) => updateValue("title", event.target.value)}
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
              disabled={isSubmitting}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Description</span>
            <textarea
              value={values.description}
              onChange={(event) =>
                updateValue("description", event.target.value)
              }
              className="bg-background focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 outline-none focus-visible:ring-2"
              disabled={isSubmitting}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Resource Type</span>
            <select
              value={values.resourceType}
              onChange={(event) =>
                updateValue(
                  "resourceType",
                  event.target.value as ResourceFormValues["resourceType"],
                )
              }
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
              disabled={isSubmitting}
            >
              <option value="">Select type</option>
              {RESOURCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">URL</span>
            <input
              value={values.url}
              onChange={(event) => updateValue("url", event.target.value)}
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
              placeholder={
                values.resourceType === "internal"
                  ? "Optional for internal resources"
                  : "https://"
              }
              disabled={isSubmitting}
            />
          </label>

          <div className="space-y-3 md:col-span-2">
            <span className="text-sm font-medium">Quick Link Visual</span>
            <div className="bg-background/70 grid gap-4 rounded-2xl border p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
              <ResourceVisual
                icon={values.icon}
                customImage={values.thumbnail}
                url={values.url}
                title={values.title || "Quick Link"}
                className="size-20 justify-self-center sm:size-24"
              />
              <div className="min-w-0 space-y-3">
                <label className="block space-y-2">
                  <span className="text-muted-foreground text-xs font-medium">
                    Built-in fallback icon
                  </span>
                  <select
                    value={values.icon}
                    onChange={(event) =>
                      updateValue("icon", event.target.value)
                    }
                    className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
                    disabled={isSubmitting || isUploading}
                  >
                    <option value="">Company Hub default</option>
                    {values.icon &&
                    !RESOURCE_ICON_OPTIONS.some(
                      (option) => option.value === values.icon,
                    ) ? (
                      <option value={values.icon}>
                        Existing icon ({values.icon})
                      </option>
                    ) : null}
                    {RESOURCE_ICON_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-2">
                  <label className="bg-background hover:bg-muted inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition">
                    {isUploading ? (
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <ImagePlus className="size-4" aria-hidden="true" />
                    )}
                    {isUploading
                      ? "Uploading"
                      : values.thumbnail
                        ? "Replace image"
                        : "Upload image"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp,.png,.jpg,.jpeg,.svg,.webp"
                      className="sr-only"
                      disabled={isSubmitting || isUploading}
                      onChange={handleImageChange}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={!values.thumbnail || isSubmitting || isUploading}
                    onClick={() => void handleRemoveImage()}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remove image
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs leading-5">
                  Uploaded image first, then website favicon, then the selected
                  icon. PNG, JPG, SVG, or WebP up to 2 MB.
                </p>
              </div>
            </div>
            {uploadMessage ? (
              <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border p-3 text-sm">
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <p>{uploadMessage}</p>
              </div>
            ) : null}
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium">Display Order</span>
            <input
              type="number"
              min="1"
              value={values.displayOrder}
              onChange={(event) =>
                updateValue("displayOrder", event.target.value)
              }
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
              disabled={isSubmitting}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Open Mode</span>
            <select
              value={values.openMode}
              onChange={(event) =>
                updateValue(
                  "openMode",
                  event.target.value as ResourceFormValues["openMode"],
                )
              }
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
              disabled={isSubmitting}
            >
              {OPEN_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
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
                  event.target.value as ResourceFormValues["status"],
                )
              }
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
              disabled={isSubmitting}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="bg-background flex items-center gap-3 rounded-md border px-3 py-3 md:col-span-2">
            <input
              type="checkbox"
              checked={values.isFeatured}
              onChange={(event) =>
                updateValue("isFeatured", event.target.checked)
              }
              className="size-4"
              disabled={isSubmitting}
            />
            <span className="text-sm font-medium">Featured resource</span>
          </label>

          {message ? (
            <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border p-3 text-sm md:col-span-2">
              <AlertCircle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p>{message}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-3 border-t pt-4 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleClose()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading || categories.length === 0}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Save Resource
            </Button>
          </div>
        </form>

        {categories.length === 0 ? (
          <div className="text-muted-foreground flex flex-col gap-3 border-t px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              No categories found. Create a category before adding resources.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/resources/categories">Create Category</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>,
    portalElement,
  );
}
