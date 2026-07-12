"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Archive, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import type {
  LeaveActionState,
  LeaveTypeFormValues,
  LeaveTypeItem,
} from "@/features/leave/types/leave.types";

type LeaveTypesPageProps = {
  leaveTypes: LeaveTypeItem[];
  onCreate: (values: LeaveTypeFormValues) => Promise<LeaveActionState>;
  onUpdate: (id: string, values: LeaveTypeFormValues) => Promise<LeaveActionState>;
  onArchive: (id: string) => Promise<LeaveActionState>;
};

function emptyForm(): LeaveTypeFormValues {
  return {
    name: "",
    code: "",
    color: "#2563EB",
    isPaid: true,
    annualLimit: "",
    requiresApproval: true,
    status: "active",
  };
}

function formFromType(type: LeaveTypeItem): LeaveTypeFormValues {
  return {
    name: type.name,
    code: type.code,
    color: type.color ?? "#2563EB",
    isPaid: type.isPaid,
    annualLimit: type.annualLimit === null ? "" : String(type.annualLimit),
    requiresApproval: type.requiresApproval,
    status: type.status === "active" ? "active" : "inactive",
  };
}

export function LeaveTypesPage({
  leaveTypes,
  onCreate,
  onUpdate,
  onArchive,
}: LeaveTypesPageProps) {
  const router = useRouter();
  const [form, setForm] = useState<LeaveTypeFormValues | null>(null);
  const [editing, setEditing] = useState<LeaveTypeItem | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function close() {
    setForm(null);
    setEditing(null);
    router.refresh();
  }

  function run(action: () => Promise<LeaveActionState>, closeOnSuccess = false) {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      setMessage(result.message);
      if (result.ok && closeOnSuccess) {
        close();
      } else if (result.ok) {
        router.refresh();
      }
    });
  }

  function toggleStatus(type: LeaveTypeItem) {
    run(() =>
      onUpdate(type.id, {
        ...formFromType(type),
        status: type.status === "active" ? "inactive" : "active",
      }),
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leave Types</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure paid/unpaid leave types and annual limits.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setForm(emptyForm())}>
          <Plus className="size-4" aria-hidden="true" />
          Add Leave Type
        </Button>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {isPending ? <p className="text-sm text-muted-foreground">Working...</p> : null}

      {leaveTypes.length === 0 ? (
        <EmptyState
          title="No leave types found"
          description="Create leave types before employees submit requests."
          className="bg-card shadow-sm"
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_140px_120px_auto] gap-4 border-b bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground md:grid">
            <span>Name</span>
            <span>Paid/Unpaid</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y">
            {leaveTypes.map((type) => (
              <article key={type.id} className="px-4 py-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_140px_120px_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: type.color ?? "#64748b" }}
                      />
                      <h2 className="truncate font-semibold">{type.name}</h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {type.code} - Limit: {type.annualLimit ?? "No limit"}
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                      {type.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                  <div>
                    <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                      {type.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(type);
                        setForm(formFromType(type));
                      }}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(type)}
                    >
                      {type.status === "active" ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => run(() => onArchive(type.id))}
                    >
                      <Archive className="size-4" aria-hidden="true" />
                      Archive
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {form ? (
        <LeaveTypeForm
          values={form}
          onChange={setForm}
          onClose={close}
          onSubmit={() =>
            run(
              () => (editing ? onUpdate(editing.id, form) : onCreate(form)),
              true,
            )
          }
        />
      ) : null}
    </section>
  );
}

function LeaveTypeForm({
  values,
  onChange,
  onClose,
  onSubmit,
}: {
  values: LeaveTypeFormValues;
  onChange: (values: LeaveTypeFormValues) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  function update<Key extends keyof LeaveTypeFormValues>(
    key: Key,
    value: LeaveTypeFormValues[Key],
  ) {
    onChange({ ...values, [key]: value });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="mx-auto my-6 max-w-xl space-y-4 rounded-xl border bg-card p-5 shadow-lg"
      >
        <h2 className="text-xl font-semibold">Leave Type</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input className="h-11 rounded-md border bg-background px-3" placeholder="Name" value={values.name} onChange={(e) => update("name", e.target.value)} />
          <input className="h-11 rounded-md border bg-background px-3 uppercase" placeholder="Code" value={values.code} onChange={(e) => update("code", e.target.value)} />
          <input type="color" className="h-11 rounded-md border bg-background px-2" value={values.color} onChange={(e) => update("color", e.target.value)} />
          <input className="h-11 rounded-md border bg-background px-3" inputMode="numeric" placeholder="Annual Limit" value={values.annualLimit} onChange={(e) => update("annualLimit", e.target.value)} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={values.isPaid} onChange={(e) => update("isPaid", e.target.checked)} /> Paid</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={values.requiresApproval} onChange={(e) => update("requiresApproval", e.target.checked)} /> Requires approval</label>
          <select className="h-11 rounded-md border bg-background px-3" value={values.status} onChange={(e) => update("status", e.target.value === "active" ? "active" : "inactive")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
}
