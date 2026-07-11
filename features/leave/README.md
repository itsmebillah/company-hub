# Leave

## Purpose

Leave type management, employee leave requests, request history, approval actions, and notifications.

## Structure

- `actions/`: leave type/request mutations.
- `components/`: admin and employee leave UI.
- `services/`: leave validation, request lifecycle, approvals.
- `types/`: leave forms, requests, summaries.

## Flow

Employees submit leave requests. Admins approve/reject. Services validate dates, overlaps, and status transitions.

## Dependencies

Employees, notifications, activity logs, holiday calendar foundation.

## Rules

No payroll deduction or balance carry-forward unless a future sprint adds it.
