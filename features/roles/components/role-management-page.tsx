"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Power, PowerOff, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { RoleForm } from "@/features/roles/components/role-form";
import type {
  RoleActionState,
  RoleFormValues,
  RoleListItem,
} from "@/features/roles/types/role.types";

type RoleManagementPageProps = {
  roles: RoleListItem[];
  onCreate: (values: RoleFormValues) => Promise<RoleActionState>;
  onUpdate: (id: string, values: RoleFormValues) => Promise<RoleActionState>;
  onActivate: (id: string) => Promise<RoleActionState>;
  onDeactivate: (id: string) => Promise<RoleActionState>;
};

export function RoleManagementPage({
  roles,
  onCreate,
  onUpdate,
  onActivate,
  onDeactivate,
}: RoleManagementPageProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleListItem | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function closeForm() {
    setIsCreating(false);
    setEditingRole(null);
    router.refresh();
  }

  function runStatusAction(
    action: (id: string) => Promise<RoleActionState>,
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
          <h1 className="text-2xl font-semibold">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Manage employee roles used by hierarchy and resource permissions.
          </p>
        </div>
        <Button type="button" onClick={() => setIsCreating(true)}>
          <Plus className="size-4" aria-hidden="true" />
          New Role
        </Button>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {isPending ? (
        <p className="text-sm text-muted-foreground">Updating role...</p>
      ) : null}

      {roles.length === 0 ? (
        <EmptyState
          title="No roles found"
          description="Create a role before adding employees."
          className="bg-card shadow-sm"
          action={
            <Button type="button" onClick={() => setIsCreating(true)}>
              <ShieldCheck className="size-4" aria-hidden="true" />
              Create Role
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-4 py-3 font-medium">{role.name}</td>
                    <td className="px-4 py-3">{role.displayOrder}</td>
                    <td className="px-4 py-3">
                      {role.isSystemRole ? "System" : "Custom"}
                    </td>
                    <td className="px-4 py-3 capitalize">{role.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingRole(role)}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            role.status === "active"
                              ? runStatusAction(onDeactivate, role.id)
                              : runStatusAction(onActivate, role.id)
                          }
                        >
                          {role.status === "active" ? (
                            <PowerOff className="size-4" aria-hidden="true" />
                          ) : (
                            <Power className="size-4" aria-hidden="true" />
                          )}
                          {role.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-3 lg:hidden">
            {roles.map((role) => (
              <article key={role.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{role.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Order {role.displayOrder} ·{" "}
                      {role.isSystemRole ? "System" : "Custom"}
                    </p>
                  </div>
                  <span className="rounded-full border px-2.5 py-1 text-xs capitalize">
                    {role.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingRole(role)}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      role.status === "active"
                        ? runStatusAction(onDeactivate, role.id)
                        : runStatusAction(onActivate, role.id)
                    }
                  >
                    {role.status === "active" ? (
                      <PowerOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Power className="size-4" aria-hidden="true" />
                    )}
                    {role.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {isCreating || editingRole ? (
        <RoleForm
          role={editingRole}
          onClose={closeForm}
          onSubmit={
            editingRole
              ? (values) => onUpdate(editingRole.id, values)
              : onCreate
          }
        />
      ) : null}
    </section>
  );
}
