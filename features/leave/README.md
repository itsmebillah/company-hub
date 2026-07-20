# Leave

## Purpose

Leave type management, employee leave requests, request history, approval actions, and notifications.

## Structure

- `actions/`: leave type/request mutations.
- `components/`: admin and employee leave UI.
- `services/`: leave validation, request lifecycle, approvals.
- `types/`: leave forms, requests, summaries.

## Flow

Employees submit leave requests. Admins approve or reject them. During approval, an Admin may revise the leave type, dates, and reason; the service revalidates the request and recalculates working days before committing the approval. Services validate dates, overlaps, and status transitions.

## Dependencies

Employees, notifications, activity logs, holiday calendar foundation.

## Rules

No payroll deduction or balance carry-forward unless a future sprint adds it.
