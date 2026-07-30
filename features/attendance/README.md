# Attendance

## Purpose

Employee check-in/check-out, server-time policy enforcement, GPS/geofence validation, selfie evidence, offline replay, and Company Admin attendance review.

Supabase remains the operational source of truth. No Google Drive upload or Google Sheets synchronization is implemented.

## Structure

- `actions/`: feature-authorized check-in, check-out, settings, and selfie boundaries.
- `components/`: employee and Company Admin attendance UI.
- `repositories/`: tenant-scoped attendance records, settings, and location persistence.
- `services/attendance.service.ts`: workflow orchestration only.
- `services/attendance-policy.service.ts`: work-mode, GPS, accuracy, geofence, and location strategy evaluation.
- `services/attendance-workflow-validation.service.ts`: server-time check-in and working-time/status rules.
- `services/attendance-automation.service.ts`: best-effort `AttendanceCreated`, `AttendanceUpdated`, and `AttendanceCompleted` event dispatch.
- `services/attendance-selfie.service.ts`: authenticated selfie lifecycle and reference validation.
- `storage/`: provider-neutral selfie contract and the current Supabase Storage adapter.
- `types/`: attendance, automation-event, and future sync metadata contracts.

## Write flow

1. The server resolves an active employee and company from the authenticated session.
2. Calendar, work-mode, GPS, accuracy, geofence, and server-time rules are evaluated.
3. A supplied selfie path is revalidated against the employee code, company, server attendance date, and phase.
4. The repository inserts one check-in per employee/date or conditionally updates an incomplete checkout.
5. Automation events run after persistence. Handler failure is logged but does not report a false attendance failure to the employee.

The database unique constraint on `(employee_id, attendance_date)` is the final duplicate check-in boundary. Checkout updates require the authenticated company/employee and `check_out is null`, preventing concurrent overwrite.

## Selfie storage

`AttendanceSelfieStorage` isolates attendance logic from provider APIs. `SupabaseAttendanceSelfieStorage` is the only configured provider. It stores private objects with unique paths and creates short-lived read URLs for authorized Company Admin detail views.

Uploads accept only JPG, PNG, WebP, HEIC, or HEIF files up to 5 MB and validate file signatures. Upload and persistence paths are checked independently. Existing stored paths remain readable; no file migration is performed.

The server-only Google integration foundation uses OAuth offline access for
Drive, a dedicated service account for Sheets, bounded retries, redacted
provider errors, explicit approved resource IDs, and a self-cleaning
`npm run verify:google` check. It is not yet selected as the
attendance provider because the current attendance schema cannot persist the
provider and external Drive file ID or serve private Drive media through an
authorized application route. Activating it requires the separately approved
attachment/outbox migration and credentialed verification.

## Automation and future sync

The current dispatcher provides stable event contracts for future adapters but is intentionally best-effort and process-local. It is suitable for non-critical notifications, not guaranteed external synchronization.

Production Google synchronization requires an approved migration for a transactional outbox, retry/lease state, provider metadata, external file IDs, attempt counts, last error, and sync timestamps. No sync row or external call is created in this phase.

## Offline behavior

Attendance actions may be queued in browser local storage and replayed when online. Server rules are always re-evaluated during replay. Selfie-required check-in cannot be queued because evidence upload needs a connection. Browser storage can be cleared and failed items have limited manual recovery controls.

## Invariants

- Use server timestamps and the application date helper.
- Never trust client-calculated distance, attendance date, or selfie ownership.
- Keep company and employee predicates on privileged writes.
- Store provider object paths or IDs, never signed URLs.
- Do not make successful attendance persistence appear failed because a secondary automation handler failed.
