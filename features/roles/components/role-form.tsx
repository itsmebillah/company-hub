"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  RoleActionState,
  RoleFormValues,
  RoleListItem,
} from "@/features/roles/types/role.types";

type RoleFormProps = {
  role?: RoleListItem | null;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => Promise<RoleActionState>;
};

const defaultValues: RoleFormValues = {
  name: "",
  displayOrder: "1",
  status: "active",
};

function toValues(role?: RoleListItem | null): RoleFormValues {
  if (!role) {
    return defaultValues;
  }

  return {
    name: role.name,
    displayOrder: String(role.displayOrder),
    status: role.status,
  };
}

export function RoleForm({ role, onClose, onSubmit }: RoleFormProps) {
  const [values, setValues] = useState<RoleFormValues>(toValues(role));
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue<Key extends keyof RoleFormValues>(
    key: Key,
    value: RoleFormValues[Key],
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
              {role ? "Edit Role" : "Create Role"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure role name, order, and availability.
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
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Role Name</span>
            <input
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              disabled={isSubmitting || (role?.isSystemRole && !role.canRename)}
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
            {role?.isSystemRole && !role.canRename ? (
              <p className="text-xs text-muted-foreground">
                System role names are protected by configuration.
              </p>
            ) : null}
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
              disabled={isSubmitting}
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Status</span>
            <select
              value={values.status}
              onChange={(event) =>
                updateValue("status", event.target.value as RoleFormValues["status"])
              }
              disabled={isSubmitting}
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          {message ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive md:col-span-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>{message}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-3 border-t pt-4 md:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Save Role
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
