"use client";

import { useState, useTransition } from "react";
import { Check, Eye, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { LeaveStatusBadge } from "@/features/leave/components/leave-status-badge";
import type {
  LeaveActionState,
  LeaveRequestFormValues,
  LeaveRequestItem,
  LeaveTypeItem,
} from "@/features/leave/types/leave.types";

type LeaveRequestsPageProps = {
  requests: LeaveRequestItem[];
  leaveTypes: LeaveTypeItem[];
  filters: { search: string; status: string; leaveTypeId: string };
  onApprove: (
    id: string,
    values?: LeaveRequestFormValues,
  ) => Promise<LeaveActionState>;
  onReject: (id: string, reason: string) => Promise<LeaveActionState>;
};

export function LeaveRequestsPage({
  requests,
  leaveTypes,
  filters,
  onApprove,
  onReject,
}: LeaveRequestsPageProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<LeaveRequestItem | null>(null);
  const [rejecting, setRejecting] = useState<LeaveRequestItem | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<LeaveActionState>) {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      setMessage(result.message);
      if (result.ok) {
        setRejecting(null);
        setReason("");
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Leave Requests</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review, approve, and reject employee leave requests.
        </p>
      </div>

      <form className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
        <input name="search" defaultValue={filters.search} placeholder="Search employee" className="h-11 rounded-md border bg-background px-3" />
        <select name="status" defaultValue={filters.status} className="h-11 rounded-md border bg-background px-3">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select name="leaveTypeId" defaultValue={filters.leaveTypeId} className="h-11 rounded-md border bg-background px-3">
          <option value="">All types</option>
          {leaveTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
        <Button type="submit">Apply</Button>
      </form>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {isPending ? <p className="text-sm text-muted-foreground">Updating request...</p> : null}

      {requests.length === 0 ? (
        <EmptyState title="No leave requests found" description="Leave requests will appear here after employees submit them." className="bg-card shadow-sm" />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Employee</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Days</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3"><p className="font-medium">{request.employeeName}</p><p className="text-xs text-muted-foreground">{request.employeeCode}</p></td>
                    <td className="px-4 py-3">{request.leaveTypeName}</td>
                    <td className="px-4 py-3">{request.startDate} to {request.endDate}</td>
                    <td className="px-4 py-3">{request.totalDays}</td>
                    <td className="px-4 py-3"><LeaveStatusBadge status={request.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" type="button" onClick={() => setSelected(request)}><Eye className="size-4" />View</Button>
                        {request.status === "pending" ? <>
                          <Button size="sm" variant="outline" type="button" onClick={() => run(() => onApprove(request.id))}><Check className="size-4" />Approve</Button>
                          <Button size="sm" variant="outline" type="button" onClick={() => setRejecting(request)}><X className="size-4" />Reject</Button>
                        </> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 lg:hidden">
            {requests.map((request) => <RequestCard key={request.id} request={request} onView={() => setSelected(request)} />)}
          </div>
        </div>
      )}

      {selected ? (
        <RequestDetail
          request={selected}
          onClose={() => setSelected(null)}
          onApprove={(values) => run(() => onApprove(selected.id, values))}
          onReject={() => setRejecting(selected)}
          isPending={isPending}
        />
      ) : null}
      {rejecting ? (
        <div className="fixed inset-0 z-50 bg-background/80 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-20 max-w-md rounded-xl border bg-card p-5 shadow-lg">
            <h2 className="text-lg font-semibold">Reject Leave Request</h2>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="mt-4 w-full rounded-md border bg-background p-3" placeholder="Reason" />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
              <Button type="button" onClick={() => run(() => onReject(rejecting.id, reason))}>Reject</Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RequestCard({ request, onView }: { request: LeaveRequestItem; onView: () => void }) {
  return (
    <article className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="font-semibold">{request.employeeName}</h2><p className="text-sm text-muted-foreground">{request.leaveTypeName} - {request.totalDays} day(s)</p></div>
        <LeaveStatusBadge status={request.status} />
      </div>
      <p className="mt-3 text-sm">{request.startDate} to {request.endDate}</p>
      <Button className="mt-3" size="sm" variant="outline" type="button" onClick={onView}>View</Button>
    </article>
  );
}

function RequestDetail({
  request,
  onClose,
  onApprove,
  onReject,
  isPending,
}: {
  request: LeaveRequestItem;
  onClose: () => void;
  onApprove: (values?: LeaveRequestFormValues) => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<LeaveRequestFormValues>({
    leaveTypeId: request.leaveTypeId,
    startDate: request.startDate,
    endDate: request.endDate,
    reason: request.reason ?? "",
  });
  const canAct = request.status === "pending";

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="max-h-svh overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+6.25rem)] pt-[calc(env(safe-area-inset-top)+5.75rem)] sm:hidden">
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-[1.5rem] border bg-card shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-3 border-b bg-card/95 px-4 py-3">
            <h2 className="min-w-0 text-lg font-semibold">
              ← Leave Request Details
            </h2>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing((current) => !current)}
                disabled={!canAct || isPending}
              >
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="grid gap-3 text-sm">
              <DetailItem label="Employee" value={request.employeeName} />
              <DetailItem label="Type" value={request.leaveTypeName} />
              {isEditing ? (
                <div className="grid gap-3 rounded-2xl border bg-background/75 p-3">
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">
                      Start Date
                    </span>
                    <input
                      type="date"
                      value={editValues.startDate}
                      onChange={(event) =>
                        setEditValues((current) => ({
                          ...current,
                          startDate: event.target.value,
                        }))
                      }
                      className="mt-1 min-h-10 rounded-xl border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">
                      End Date
                    </span>
                    <input
                      type="date"
                      value={editValues.endDate}
                      onChange={(event) =>
                        setEditValues((current) => ({
                          ...current,
                          endDate: event.target.value,
                        }))
                      }
                      className="mt-1 min-h-10 rounded-xl border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">
                      Reason
                    </span>
                    <textarea
                      value={editValues.reason}
                      onChange={(event) =>
                        setEditValues((current) => ({
                          ...current,
                          reason: event.target.value,
                        }))
                      }
                      rows={3}
                      className="mt-1 rounded-xl border bg-background px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              ) : (
                <>
                  <DetailItem
                    label="Dates"
                    value={`${request.startDate} to ${request.endDate}`}
                  />
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="mt-1">
                      <LeaveStatusBadge status={request.status} />
                    </dd>
                  </div>
                  <DetailItem label="Reason" value={request.reason ?? "--"} />
                </>
              )}
              <DetailItem
                label="Applied On"
                value={new Date(request.createdAt).toLocaleDateString()}
              />
              {request.rejectionReason ? (
                <DetailItem
                  label="Rejection Reason"
                  value={request.rejectionReason}
                />
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/8 p-3 text-sm text-muted-foreground">
              You can update the leave dates and approve for a different
              duration if needed.
            </div>
          </div>

          <div className="grid gap-2 border-t bg-card/95 px-4 py-3">
            <Button
              type="button"
              onClick={() => onApprove()}
              disabled={!canAct || isPending}
            >
              <Check className="size-4" aria-hidden="true" />
              Approve
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onApprove(editValues)}
              disabled={!canAct || isPending}
            >
              Approve with Different Dates
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onReject}
              disabled={!canAct || isPending}
            >
              <X className="size-4" aria-hidden="true" />
              Reject
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden overflow-y-auto p-4 sm:block">
        <div className="mx-auto my-10 max-w-xl rounded-xl border bg-card p-5 shadow-lg">
          <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold">Leave Request Details</h2>
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Employee</dt><dd className="font-semibold">{request.employeeName}</dd></div>
          <div><dt className="text-muted-foreground">Type</dt><dd className="font-semibold">{request.leaveTypeName}</dd></div>
          <div><dt className="text-muted-foreground">Dates</dt><dd className="font-semibold">{request.startDate} to {request.endDate}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd><LeaveStatusBadge status={request.status} /></dd></div>
          <div className="sm:col-span-2"><dt className="text-muted-foreground">Reason</dt><dd>{request.reason ?? "--"}</dd></div>
          {request.rejectionReason ? <div className="sm:col-span-2"><dt className="text-muted-foreground">Rejection Reason</dt><dd>{request.rejectionReason}</dd></div> : null}
        </dl>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
