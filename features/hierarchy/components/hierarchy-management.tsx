"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, ChevronRight, GitFork, Search, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getAllowedManagerRole } from "@/features/employees/constants/employee-rules";
import type { EmployeeRoleName } from "@/features/employees/types/employee.types";
import {
  buildHierarchyTree,
  getHierarchyProfile,
} from "@/features/hierarchy/utils/hierarchy-tree";
import type {
  BulkReassignInput,
  ChangeManagerInput,
  HierarchyActionState,
  HierarchyEmployee,
  HierarchyNode,
} from "@/features/hierarchy/types/hierarchy.types";
import { cn } from "@/lib/utils";

type HierarchyManagementProps = {
  employees: HierarchyEmployee[];
  onChangeManager: (input: ChangeManagerInput) => Promise<HierarchyActionState>;
  onBulkReassign: (input: BulkReassignInput) => Promise<HierarchyActionState>;
};

function roleRank(roleName: EmployeeRoleName) {
  return ["Admin", "Sales Head", "RSM", "TSO", "SR"].indexOf(roleName);
}

function TreeNode({
  node,
  depth,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
}: {
  node: HierarchyNode;
  depth: number;
  expandedIds: Set<string>;
  selectedId: string;
  onToggle: (id: string) => void;
  onSelect: (employee: HierarchyEmployee) => void;
}) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent",
          selectedId === node.id && "bg-accent text-accent-foreground",
        )}
        style={{ paddingLeft: `${depth * 18 + 8}px` }}
      >
        <button
          type="button"
          className="flex size-6 items-center justify-center rounded hover:bg-background"
          onClick={() => onToggle(node.id)}
          disabled={!hasChildren}
          aria-label={isExpanded ? "Collapse employee" : "Expand employee"}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="size-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="size-4" aria-hidden="true" />
            )
          ) : (
            <span className="size-4" />
          )}
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onSelect(node)}
        >
          <span className="block truncate font-medium">{node.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {node.roleName} · {node.employeeId}
          </span>
        </button>
      </div>
      {isExpanded
        ? node.children
            .sort((a, b) => roleRank(a.roleName) - roleRank(b.roleName) || a.name.localeCompare(b.name))
            .map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                expandedIds={expandedIds}
                selectedId={selectedId}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))
        : null}
    </div>
  );
}

export function HierarchyManagement({
  employees,
  onChangeManager,
  onBulkReassign,
}: HierarchyManagementProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(employees[0]?.id ?? "");
  const [managerId, setManagerId] = useState("");
  const [bulkManagerId, setBulkManagerId] = useState("");
  const [bulkEmployeeIds, setBulkEmployeeIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState(new Set(employees.map((employee) => employee.id)));
  const [message, setMessage] = useState("");

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return employees;
    }

    const matchingIds = new Set(
      employees
        .filter(
          (employee) =>
            employee.name.toLowerCase().includes(query) ||
            employee.employeeId.toLowerCase().includes(query) ||
            employee.roleName.toLowerCase().includes(query),
        )
        .map((employee) => employee.id),
    );

    return employees.filter(
      (employee) =>
        matchingIds.has(employee.id) ||
        (employee.managerId && matchingIds.has(employee.managerId)),
    );
  }, [employees, search]);

  const tree = useMemo(() => buildHierarchyTree(filteredEmployees), [filteredEmployees]);
  const selectedEmployee =
    employees.find((employee) => employee.id === selectedId) ?? employees[0];
  const selectedProfile = selectedEmployee
    ? getHierarchyProfile(selectedEmployee.id, employees)
    : null;
  const allowedManagerRole = selectedEmployee
    ? getAllowedManagerRole(selectedEmployee.roleName)
    : null;
  const managerOptions = employees.filter(
    (employee) =>
      allowedManagerRole &&
      employee.roleName === allowedManagerRole &&
      employee.status === "active" &&
      employee.id !== selectedEmployee?.id,
  );
  const bulkCandidates = employees.filter((employee) =>
    ["TSO", "SR"].includes(employee.roleName),
  );
  const selectedBulkRole = employees.find((employee) => bulkEmployeeIds.includes(employee.id))?.roleName;
  const bulkManagerOptions = employees.filter((employee) => {
    if (!selectedBulkRole) return false;
    const requiredRole = getAllowedManagerRole(selectedBulkRole);

    return employee.roleName === requiredRole && employee.status === "active";
  });

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function submitManagerChange() {
    if (!selectedEmployee) return;

    setMessage("");
    startTransition(async () => {
      const result = await onChangeManager({
        employeeId: selectedEmployee.id,
        managerId,
      });
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  function submitBulkReassign() {
    setMessage("");
    startTransition(async () => {
      const result = await onBulkReassign({
        employeeIds: bulkEmployeeIds,
        managerId: bulkManagerId,
      });
      setMessage(result.message);
      if (result.ok) {
        setBulkEmployeeIds([]);
        setBulkManagerId("");
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Hierarchy Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage reporting lines across Sales Head, RSM, TSO, and SR roles.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b p-4">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee, ID, or role"
                className="h-10 w-full rounded-md border bg-background pl-9 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>
          <div className="max-h-[640px] overflow-y-auto p-3">
            {tree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                expandedIds={expandedIds}
                selectedId={selectedEmployee?.id ?? ""}
                onToggle={toggleExpanded}
                onSelect={(employee) => {
                  setSelectedId(employee.id);
                  setManagerId(employee.managerId ?? "");
                }}
              />
            ))}
            {tree.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No employees found.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">Employee Profile</h2>
            {selectedProfile ? (
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-lg font-semibold">{selectedProfile.name}</p>
                  <p className="text-muted-foreground">
                    {selectedProfile.roleName} · {selectedProfile.employeeId}
                  </p>
                </div>
                <dl className="space-y-2">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Reports To</dt>
                    <dd>{selectedProfile.reportsTo ?? "None"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Direct Reports</dt>
                    <dd>{selectedProfile.directReports.length}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Hierarchy Path</dt>
                    <dd className="mt-1">
                      {selectedProfile.hierarchyPath.map((item) => item.name).join(" / ")}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Select an employee.</p>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">Change Manager</h2>
            <div className="mt-4 space-y-3">
              <select
                value={managerId}
                onChange={(event) => setManagerId(event.target.value)}
                disabled={!allowedManagerRole}
                className="h-10 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              >
                <option value="">
                  {allowedManagerRole ? `Select ${allowedManagerRole}` : "No manager allowed"}
                </option>
                {managerOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.employeeId})
                  </option>
                ))}
              </select>
              <Button
                type="button"
                className="w-full"
                disabled={isPending || !selectedEmployee}
                onClick={submitManagerChange}
              >
                <GitFork className="size-4" aria-hidden="true" />
                Update Manager
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">Bulk Reassign</h2>
            <div className="mt-4 space-y-3">
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                {bulkCandidates.map((employee) => (
                  <label key={employee.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={bulkEmployeeIds.includes(employee.id)}
                      onChange={(event) => {
                        setBulkEmployeeIds((current) =>
                          event.target.checked
                            ? [...current, employee.id]
                            : current.filter((id) => id !== employee.id),
                        );
                      }}
                    />
                    {employee.name} ({employee.roleName})
                  </label>
                ))}
              </div>
              <select
                value={bulkManagerId}
                onChange={(event) => setBulkManagerId(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select new manager</option>
                {bulkManagerOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.roleName})
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isPending}
                onClick={submitBulkReassign}
              >
                <UsersRound className="size-4" aria-hidden="true" />
                Reassign Selected
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {message ? (
        <div className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
          {message}
        </div>
      ) : null}
    </section>
  );
}
