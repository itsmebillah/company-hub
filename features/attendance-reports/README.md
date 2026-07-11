# Attendance Reports

## Purpose

Read-only attendance reporting and export support for admins.

## Structure

- `components/`: report filters and report page.
- `services/`: report aggregation and export generation.
- `types/`: report filters, rows, summaries, export formats.

## Flow

Admin report pages call report services. Export routes call export services for CSV, XLSX, or PDF output.

## Dependencies

Attendance, employees, company settings, activity logs.

## Rules

Keep export formatting in export service. Do not mutate attendance from report code.
