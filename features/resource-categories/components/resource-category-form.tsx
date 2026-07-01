"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  ResourceCategoryActionState,
  ResourceCategoryFormValues,
  ResourceCategoryListItem,
} from "@/features/resource-categories/types/resource-category.types";

type ResourceCategoryFormProps = {
  category?: ResourceCategoryListItem | null;
  onClose: () => void;
  onSubmit: (
    values: ResourceCategoryFormValues,
  ) => Promise<ResourceCategoryActionState>;
};

const defaultValues: ResourceCategoryFormValues = {
  name: "",
  icon: "",
  color: "#2563EB",
  displayOrder: "1",
  status: "active",
};

function toValues(
  category?: ResourceCategoryListItem | null,
): ResourceCategoryFormValues {
  if (!category) {
    return defaultValues;
  }

  return {
    name: category.name,
    icon: category.icon,
    color: category.color,
    displayOrder: String(category.displayOrder),
    status: category.status,
  };
}

export function ResourceCategoryForm({
  category,
  onClose,
  onSubmit,
}: ResourceCategoryFormProps) {
  const [values, setValues] = useState<ResourceCategoryFormValues>(
    toValues(category),
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue<Key extends keyof ResourceCategoryFormValues>(
    key: Key,
    value: ResourceCategoryFormValues[Key],
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
      <div className="w-full max-w-xl rounded-xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              {category ? "Edit Category" : "Create Category"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Categories group resources for employees.
            </p>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Name</span>
            <input
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Icon</span>
            <input
              value={values.icon}
              onChange={(event) => updateValue("icon", event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Optional short label"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Color</span>
            <input
              type="color"
              value={values.color}
              onChange={(event) => updateValue("color", event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-2"
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
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Status</span>
            <select
              value={values.status}
              onChange={(event) =>
                updateValue(
                  "status",
                  event.target.value as ResourceCategoryFormValues["status"],
                )
              }
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>

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
