# Attendance

## Purpose

Employee check-in/check-out, GPS validation, policy display, and attendance status.

## Structure

- `actions/`: check-in and check-out boundaries.
- `components/`: employee/admin attendance UI.
- `repositories/`: attendance records and location reads/writes.
- `services/`: attendance workflow, policy, summaries.
- `types/`: attendance data contracts.

## Flow

UI calls attendance actions. Services validate session, policy, date, location, and record state before writing.

## Dependencies

Employees, company locations, activity logs, holiday calendar.

## Rules

Use server timestamps. Do not trust client-calculated GPS distance.
