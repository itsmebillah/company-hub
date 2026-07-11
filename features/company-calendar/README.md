# Company Calendar

## Purpose

Company holiday and working-day foundation for attendance and leave.

## Structure

- `actions/`: calendar and holiday mutations.
- `components/`: admin and employee calendar views.
- `services/`: calendar reads, validation, and mutations.
- `types/`: calendar and holiday event shapes.

## Flow

Admin manages calendars and events. Employee calendar displays read-only company holidays.

## Dependencies

Companies, notifications, activity logs, attendance, leave.

## Rules

Do not hardcode weekends or holidays in attendance/leave logic.
