# Attendance

## Purpose

Employee check-in/check-out, server-time policy enforcement, GPS/geofence validation, selfie evidence, offline replay, and Company Admin attendance review.

Supabase remains the operational source of truth. Selfies synchronize to the restricted operational Google Drive; Google Sheets reporting remains deferred.

## Structure

- `actions/`: feature-authorized check-in, check-out, settings, and selfie boundaries.
- `components/`: employee and Company Admin attendance UI.
- `repositories/`: tenant-scoped attendance records, settings, and location persistence.
- `services/attendance.service.ts`: workflow orchestration only.
- `services/attendance-policy.service.ts`: work-mode, GPS, accuracy, geofence, and location strategy evaluation.
- `services/attendance-workflow-validation.service.ts`: server-time check-in and working-time/status rules.
- `services/attendance-automation.service.ts`: best-effort `AttendanceCreated`, `AttendanceUpdated`, and `AttendanceCompleted` event dispatch.
- `services/attendance-selfie.service.ts`: authenticated selfie lifecycle and reference validation.
- `storage/`: provider-neutral temporary-cache and permanent-media contracts, with Supabase Storage and Google Drive adapters.
- `types/`: attendance, automation-event, and media-sync contracts.

## Write flow

1. The server resolves an active employee and company from the authenticated session.
2. Calendar, work-mode, GPS, accuracy, geofence, and server-time rules are evaluated.
3. A supplied selfie path is revalidated against the employee code, company, server attendance date, and phase.
4. The repository inserts one check-in per employee/date or conditionally updates an incomplete checkout.
5. Automation events run after persistence. Handler failure is logged but does not report a false attendance failure to the employee.

The database unique constraint on `(employee_id, attendance_date)` is the final duplicate check-in boundary. Checkout updates require the authenticated company/employee and `check_out is null`, preventing concurrent overwrite.

## Selfie storage

`AttendanceSelfieStorage` owns the temporary private Supabase cache. `AttendancePermanentStorage` owns permanent media and is implemented by the OAuth-backed Google Drive adapter. Attendance persistence never waits for Drive.

Uploads accept only JPG, PNG, WebP, HEIC, or HEIF files up to 5 MB and validate file signatures. Upload and persistence paths are checked independently. Migration `0043` backfilled existing selfie references into provider-neutral attachment metadata, and the production recovery worker synchronized the three historical objects to Drive.

The server-only Google integration uses OAuth offline access for
Drive, a dedicated service account for Sheets, bounded retries, redacted
provider errors, explicit approved resource IDs, and a self-cleaning
`npm run verify:google` check. Google Drive is the permanent attendance-selfie provider. Authorized Company Admin previews stream through the application; raw credentials and provider errors are never exposed. Google Sheets production reporting synchronization remains deferred.

## Automation and synchronization

The event dispatcher remains best-effort for non-media notifications. Media uses the durable `integration_outbox`, atomic leases, retry backoff, and Drive attachment idempotency metadata.

After Drive verification, Supabase retains the object for 72 hours. Cleanup re-verifies the permanent file before removing only the cache object and records the outcome; attendance rows, metadata, and Drive files are never deleted.

## Offline behavior

Attendance actions may be queued in browser local storage and replayed when online. Server rules are always re-evaluated during replay. Selfie-required check-in cannot be queued because evidence upload needs a connection. Browser storage can be cleared and failed items have limited manual recovery controls.

## Invariants

- Use server timestamps and the application date helper.
- Never trust client-calculated distance, attendance date, or selfie ownership.
- Keep company and employee predicates on privileged writes.
- Store provider object paths or IDs, never signed URLs.
- Do not make successful attendance persistence appear failed because a secondary automation handler failed.
