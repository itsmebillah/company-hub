"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CalendarRange, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { IconBadge } from "@/components/common/icon-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { LeaveStatusBadge } from "@/features/leave/components/leave-status-badge";
import type {
  LeaveActionState,
  LeaveRequestFormValues,
  LeaveRequestItem,
  LeaveTypeItem,
} from "@/features/leave/types/leave.types";
import { cn } from "@/lib/utils";

type EmployeeLeavePageProps = {
  leaveTypes: LeaveTypeItem[];
  requests: LeaveRequestItem[];
  onSubmitRequest: (values: LeaveRequestFormValues) => Promise<LeaveActionState>;
  onCancelRequest: (id: string) => Promise<LeaveActionState>;
};

const emptyRequest: LeaveRequestFormValues = {
  leaveTypeId: "",
  startDate: "",
  endDate: "",
  reason: "",
};

export function EmployeeLeavePage({
  leaveTypes,
  requests,
  onSubmitRequest,
  onCancelRequest,
}: EmployeeLeavePageProps) {
  const router = useRouter();
  const hasNoLeaveTypes = leaveTypes.length === 0;
  const [form, setForm] = useState<LeaveRequestFormValues | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<LeaveActionState>, close = false) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.message);
      if (result.ok) {
        if (close) setForm(null);
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Employee Requests"
        title="Leave"
        description="Request leave and review your leave history without leaving the employee workspace."
        actions={
          <Button
            type="button"
            onClick={() => setForm(emptyRequest)}
            disabled={hasNoLeaveTypes}
          >
            <Plus className="size-4" /> New Request
          </Button>
        }
        aside={<IconBadge icon={CalendarRange} className="mx-auto lg:mx-0" />}
      />

      <div className="app-card p-5">
        <p className="text-sm text-muted-foreground">Remaining Balance</p>
        <p className="mt-2 text-2xl font-semibold">--</p>
      </div>

      {hasNoLeaveTypes ? (
        <EmptyState
          title="No leave types available."
          description="Please contact an administrator before submitting a leave request."
          className="bg-card shadow-sm"
        />
      ) : null}

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {isPending ? <p className="text-sm text-muted-foreground">Working...</p> : null}

      {requests.length === 0 ? (
        <EmptyState title="No leave requests found" description="Your leave history will appear here." className="bg-card shadow-sm" />
      ) : (
        <div className="grid gap-3">
          {requests.map((request) => (
            <article key={request.id} className="app-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{request.leaveTypeName}</h2>
                  <p className="text-sm text-muted-foreground">{request.startDate} to {request.endDate} - {request.totalDays} day(s)</p>
                </div>
                <LeaveStatusBadge status={request.status} />
              </div>
              {request.reason ? <p className="mt-3 text-sm">{request.reason}</p> : null}
              {request.status === "pending" ? (
                <Button className="mt-3" variant="outline" size="sm" type="button" onClick={() => run(() => onCancelRequest(request.id))}>
                  <X className="size-4" /> Cancel Request
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {form ? (
        <LeaveRequestForm
          values={form}
          leaveTypes={leaveTypes}
          onChange={setForm}
          onClose={() => setForm(null)}
          onSubmit={() => run(() => onSubmitRequest(form), true)}
        />
      ) : null}
    </section>
  );
}

function LeaveRequestForm({
  values,
  leaveTypes,
  onChange,
  onClose,
  onSubmit,
}: {
  values: LeaveRequestFormValues;
  leaveTypes: LeaveTypeItem[];
  onChange: (values: LeaveRequestFormValues) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [error, setError] = useState("");
  const noLeaveTypes = leaveTypes.length === 0;
  const dateError =
    values.startDate && values.endDate && values.endDate < values.startDate
      ? "To Date cannot be before From Date."
      : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (noLeaveTypes) {
      setError("No leave types available.");
      return;
    }

    if (dateError) {
      setError(dateError);
      return;
    }

    setError("");
    onSubmit();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="app-card mx-auto my-10 max-w-xl space-y-4 p-5">
        <h2 className="text-xl font-semibold">New Leave Request</h2>
        <label className="space-y-2">
          <span className="text-sm font-medium">Leave Type</span>
          <span className="block text-xs text-muted-foreground">
            Select leave type
          </span>
          <select
            value={values.leaveTypeId}
            onChange={(e) => onChange({ ...values, leaveTypeId: e.target.value })}
            className="h-11 w-full rounded-md border bg-background px-3"
            disabled={noLeaveTypes}
          >
            <option value="">Select leave type</option>
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} - {type.isPaid ? "Paid" : "Unpaid"}
              </option>
            ))}
          </select>
        </label>

        {noLeaveTypes ? (
          <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            No leave types available.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">From Date</span>
            <span className="block text-xs text-muted-foreground">
              Select start date
            </span>
            <input
              type="date"
              value={values.startDate}
              placeholder="Select start date"
              onChange={(e) => onChange({ ...values, startDate: e.target.value })}
              className={cn(
                "h-11 rounded-md border bg-background px-3",
                dateError ? "border-destructive" : undefined,
              )}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">To Date</span>
            <span className="block text-xs text-muted-foreground">
              Select end date
            </span>
            <input
              type="date"
              value={values.endDate}
              min={values.startDate || undefined}
              placeholder="Select end date"
              onChange={(e) => onChange({ ...values, endDate: e.target.value })}
              className={cn(
                "h-11 rounded-md border bg-background px-3",
                dateError ? "border-destructive" : undefined,
              )}
            />
          </label>
        </div>

        {dateError || error ? (
          <p className="text-sm text-destructive">{dateError || error}</p>
        ) : null}

        <label className="space-y-2">
          <span className="text-sm font-medium">Reason</span>
          <span className="block text-xs text-muted-foreground">
            Enter reason
          </span>
          <textarea
            value={values.reason}
            onChange={(e) => onChange({ ...values, reason: e.target.value })}
            rows={4}
            placeholder="Enter reason"
            className="w-full rounded-md border bg-background p-3"
          />
        </label>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={noLeaveTypes}>Submit Request</Button>
        </div>
      </form>
    </div>
  );
}
