"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  OPEN_MODES,
  RESOURCE_TYPES,
} from "@/features/resources/constants/resource-options";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(resource);

  function updateValue<Key extends keyof ResourceFormValues>(
    key: Key,
    value: ResourceFormValues[Key],
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
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center px-4 py-6 backdrop-blur-sm">
      <div className="bg-card shadow-soft max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">
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
            onClick={onClose}
            aria-label="Close"
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

          <label className="space-y-2">
            <span className="text-sm font-medium">Icon</span>
            <input
              value={values.icon}
              onChange={(event) => updateValue("icon", event.target.value)}
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
              placeholder="URL, initials, or short label"
              disabled={isSubmitting}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Thumbnail</span>
            <input
              value={values.thumbnail}
              onChange={(event) => updateValue("thumbnail", event.target.value)}
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
              placeholder="Optional thumbnail URL"
              disabled={isSubmitting}
            />
          </label>

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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || categories.length === 0}
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
    </div>
  );
}
