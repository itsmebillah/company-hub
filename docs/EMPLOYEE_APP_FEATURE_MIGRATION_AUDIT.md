# Company Hub Employee App — Feature Migration Audit

## 1. Executive Summary

This audit compares the previous employee web/PWA experience in the Company Hub repository with the Flutter employee Android client, the current backend/API routes, database migrations, Google integrations, documentation, and Git history.

Evidence baseline:

- **Deployed Production capability:** commit `a502d3c343d5282dd38a211a0baecc59a3800a6c` (`test(mobile):verify-native-ingestion-recovery`). Repository `HEAD` is exactly this commit.
- **Previous employee experience:** the authenticated Next.js employee workspace under `app/(app)` and its feature modules. These sources are present at the deployed commit and represent the prior web/PWA behavior.
- **Later local-only work:** the current worktree contains uncommitted Flutter application-ID/signing/configuration changes and a first-run location/notification permission gate. These changes are not counted as deployed Production capability.
- **Production schema:** migrations through `0046`, including attendance, media sync, Google Sheets holiday reporting, and duty-bound live location.

Status vocabulary used in this report:

- **Confirmed:** directly supported by repository source, schema, documentation, or Git history.
- **Deployed:** present in commit `a502d3c...`.
- **Local-only:** present only in uncommitted worktree changes after that commit.
- **Missing:** no implementation in the deployed Flutter client.
- **Not confirmed by repository evidence:** the repository does not prove the claimed behavior or integration.

Principal findings:

1. The previous web/PWA was a multi-feature employee portal: dashboard, attendance, conditional selfie capture, GPS/geofence validation, leave requests/history, Quick Links/resources, announcements, holidays, notifications, profile/password management, settings, logout, PWA installation, release reminders, and limited offline attendance replay.
2. The deployed Flutter app is intentionally minimal: employee-ID login, secure token storage/refresh/logout, today's attendance state, check-in/check-out buttons, pull-to-refresh, and native attendance-bound foreground location tracking with encrypted batching and ingestion.
3. Deployed Flutter check-in and check-out are **not Production-ready under a GPS-required attendance policy** because `AttendanceRepository.checkIn` and `checkOut` send `body: const {}`. The backend correctly expects an optional `gps` object and enforces the configured GPS policy. The native observation source starts only after the authoritative tracking session exists, so it cannot supply the initial attendance fix.
4. Flutter has no selfie capture/upload flow. The backend and database already support both check-in and check-out selfie references, durable Google Drive sync, and controlled admin retrieval; these should be reused.
5. The Flutter client has no leave, Quick Links, resources, announcements, employee notification center, holidays/calendar, profile, password, settings, attendance history/report, or dashboard modules.
6. Current mobile REST support is limited to authentication, attendance state/check-in/check-out, and location ingestion. Most previous web features use server actions/services and need reviewed mobile API adapters rather than duplicating business logic in Flutter.
7. Google Sheets does **not** synchronize attendance. Confirmed Sheets synchronization is only the low-risk `holidays` dataset into a machine-owned `Holidays` tab. Attendance-to-Sheets behavior is **Not confirmed by repository evidence**.
8. Google Drive is confirmed as permanent attendance-selfie storage. It is a server-only integration and is reusable without putting Google credentials in Flutter.

## 2. Previous Employee App Feature Inventory

The previous employee experience is the Next.js web/PWA workspace under `app/(app)`.

### P0 — core employee operation

- Employee-ID/password authentication, active employee/company/role checks, session handling, and logout.
- Today's attendance status, check-in, check-out, elapsed/working time, notes, GPS acquisition, high-accuracy validation, work-mode policy, allowed-location/geofence validation, and duplicate/time/calendar rules.
- Conditional check-in selfie capture and optional checkout selfie capture; validated upload to private temporary storage followed by durable Drive sync.
- Clear attendance action status and errors.

### P1 — important employee functionality

- Dashboard with employee identity, announcements ticker, today's attendance summary, employee-specific celebrations, and Quick Links.
- Leave types, new leave request, leave history/status, cancellation of pending requests, and visibility of approval/rejection results.
- Role-/employee-/public-filtered Quick Links and categorized resources.
- Announcements with company, publication-window, and audience filtering.
- Notification dropdown, unread count, mark-read actions, Supabase Realtime updates, and browser/PWA notification bridging.
- Read-only company holiday calendar.
- Profile display/update, profile photo, password change, and employment/manager information.

### P2 — secondary/convenience functionality

- PWA install prompt/settings.
- Permission onboarding for location, notifications, and camera when selfie policy requires it.
- Offline status display and browser-local attendance action queue/replay.
- Web/PWA release-update reminder and release details.
- Settings shell; most personal preference controls were explicitly staged rather than implemented.
- Personal birthday/work-anniversary dashboard card/modal.

### Not part of the previous employee experience

- Employee attendance history/report UI beyond today's record: **Not confirmed by repository evidence.** Monthly attendance reports and export are implemented under admin routes.
- Employee leave balance calculation: the web UI displays `--`; the repository explicitly says payroll deduction and balance carry-forward are not implemented.
- Attendance synchronization to Google Sheets: **Not confirmed by repository evidence.**

## 3. Current Flutter App Capability

### Present in deployed commit `a502d3c...`

- `LoginScreen`: employee ID/password sign-in with validation.
- `AuthRepository`, `ApiClient`, and `SecureSessionStorage`: HTTPS-only mobile API calls, Android Keystore-backed secure token storage through `flutter_secure_storage`, refresh, one bounded 401 refresh/retry, and logout.
- `AttendanceScreen`: employee name/code/role, today's status, check-in/check-out buttons, pull-to-refresh/reconciliation, error messages, and logout.
- `AttendanceRepository`: GET state and POST check-in/check-out routes. Both mutation bodies are empty.
- `TrackingController` and native MethodChannel: reconcile native service state only from the server-authoritative tracking session.
- `DutyTrackingService`: persistent foreground notification, precise-location and notification prerequisites, active-session gating, and stop/reconcile behavior.
- `LocationManagerObservationSource`: framework fused provider preferred, GPS fallback, fresh post-start observations, 30-second requested cadence, and provider/service failure handling.
- `EncryptedLocationQueue`: Android Keystore AES-GCM application-private queue, bounded at 500 points.
- `LocationBatchPipeline`: up to 100 points per request, immediate flush at 10 points, otherwise 30-second flush, connectivity retry, idempotency keys, bounded 429/503 retry, 401 reconciliation, and queue invalidation on terminal session/lifecycle rejection.
- `POST /api/location/points` integration with authenticated bearer transport and server-derived employee/company/session identity.

### Present only in uncommitted local changes

- Permanent Android namespace/application-ID package relocation.
- Production signing/configuration adjustments.
- A first-run `PermissionGate` for precise location and notification permission, including retry and Open Settings behavior.
- Associated MethodChannel/package-path and test changes.

These local changes do not add one-shot current-position acquisition, attendance GPS payloads, selfies, or any of the missing portal modules.

### Missing from deployed Flutter

- Current GPS acquisition before attendance mutations and GPS payload submission.
- Selfie/photo capture, preview, upload, and attachment reference submission.
- Notes and device information in attendance requests.
- Attendance history or report UI.
- Leave, Quick Links, resources, announcements, employee notification center, holidays/calendar, dashboard, celebrations, profile, password management, settings/preferences, PWA features, and web release-management experience.
- Mobile API clients/routes for those missing modules.

## 4. Feature Gap Matrix

| Priority | Feature | Previous App | Current Flutter | Backend Support | DB Support | Google Integration | Missing Work | Production Ready |
|---|---|---|---|---|---|---|---|---|
| P0 | Employee login/session/logout | Employee-ID/password login, active identity checks, logout | Deployed: login, refresh, secure storage, logout | Mobile auth session/refresh/revoke routes | Employees/Auth/company/role linkage | None | Production credential/device validation only | Yes, subject to valid employee identity |
| P0 | Today's attendance status | Today's record, status, times, working duration | Deployed: status and state reconciliation | `GET /api/mobile/v1/attendance/state` | `attendance_records` and policy settings | None | Parse/display more policy and record details if desired | Yes |
| P0 | Check-in | GPS/policy validation, notes, optional/required selfie, offline queue | Deployed button sends empty body | Route and canonical attendance services exist | Full attendance schema | Drive for selfie after persistence | Fresh GPS acquisition, payload, selfie/notes as policy requires, tests | **No** under GPS-required policy |
| P0 | Check-out | Fresh location validation, optional selfie, working-time/status update | Deployed button sends empty body | Route and canonical attendance services exist | Full attendance schema | Drive supports checkout selfie | Fresh GPS payload; optional selfie/notes parity | **No** under GPS-required policy |
| P0 | GPS/high accuracy | Browser geolocation with high accuracy, 15s timeout, 2-minute max cache; server validates configured threshold | No one-shot attendance fix; native observation begins only after session | Parser accepts `gps`; policy service is authoritative | GPS/accuracy/address/source columns and settings | None | One-shot native position path and user-facing errors | No |
| P0 | Geofence/company location | Server validates nearest permitted location and radius by work mode/policy | No pre-action GPS, so cannot reach validation successfully | Existing policy/location services reusable | `company_locations`, policy settings, attendance snapshots | None | Send exact existing GPS contract; do not duplicate geofence logic | Backend yes; client no |
| P0 | Check-in selfie | Camera/file capture, preview, type/signature/5 MB validation, conditional requirement | Missing | Existing selfie upload server action/service, but no mobile upload route | Selfie fields, private bucket, `attendance_attachments`, outbox | Confirmed durable Drive sync | Mobile multipart/auth route or compatible adapter, camera UI, policy parsing | Backend storage yes; mobile no |
| P0 | Tracking session lifecycle | Web attendance did not provide reliable native tracking | Deployed native tracking starts/stops from authoritative state | Attendance mutations plus location endpoint | `0045` triggers create/close sessions | None | Fix initial attendance GPS; retain current reconciliation | Tracking path ready after successful check-in |
| P0 | Logout | Header/navigation logout | Deployed app-bar logout | Mobile revoke route | Supabase Auth session | None | None | Yes |
| P1 | Dashboard/home | Identity header, announcement ticker, attendance summary, celebrations, Quick Links | Missing; Attendance screen is the only authenticated home | Web services exist; no mobile dashboard API | Supporting tables exist | None | Mobile aggregate API and Flutter dashboard/navigation | No |
| P1 | Leave types/application | Select active paid/unpaid type, dates, reason; submit | Missing | Server actions/service exist; no mobile API | `leave_types`, `leave_requests` | None | Mobile list/create/cancel endpoints and Flutter UI | No |
| P1 | Leave history/status | History, pending/approved/rejected/cancelled badges; pending cancellation | Missing | Service supports history and transitions | Full request status metadata | None | Mobile read/cancel adapters and UI | No |
| P1 | Leave balance | UI showed `--` | Missing | No balance/carry-forward service | `annual_limit` exists, but no balance ledger/calculation | None | Product rule and schema/service design if required | Not confirmed/Not ready |
| P1 | Quick Links | Complete visual grid; internal/no-URL cards or same/new-tab destinations | Missing | Server-side resource service exists; no mobile API | Categories/resources/permissions | None | Tenant-safe mobile read API and Flutter launcher | No |
| P1 | Resource visibility | Public, role, or employee permission filtering plus feature flags | Missing | Reusable server-side filtering | `resource_permissions`, feature controls | None | Keep filtering server-side in mobile adapter | No |
| P1 | Resources/Knowledge Hub | Categorized allowed resources, thumbnails/icons/favicons | Missing | Existing service/UI logic; no mobile API | Resource tables and storage paths | None | Mobile API, safe link/file handling, Flutter UI | No |
| P1 | Announcements | Targeted, scheduled employee list/ticker with images | Missing | Existing filtered service; no mobile API | Announcement and audience tables | None | Mobile feed API and Flutter UI | No |
| P1 | Notifications | Dropdown, unread count, read actions, Realtime, browser/PWA notifications | Only foreground tracking disclosure notification | Existing notification services/actions; no employee mobile notification API/push registration | `notifications` and realtime setup | None | Mobile feed/read API; decide local vs push delivery | No |
| P1 | Holidays/calendar | Read-only company holiday calendar | Missing | Calendar service exists; no mobile API | Holiday calendars/events | Confirmed Sheets projects holidays outward only | Mobile read API and Flutter calendar UI | No |
| P1 | Profile | View employment fields; edit contact/photo/date of birth; show role/manager/status | Login response exposes only basic profile; no profile screen | Profile services/actions exist; no mobile API | Employee/profile columns and photo storage | None | Mobile profile GET/update/password/photo APIs and UI | No |
| P1 | Password change | Current/new password validation and update | Missing | Password service/action exists; no mobile API | Supabase Auth | None | Authenticated mobile password-change route and UI | No |
| P2 | Settings | PWA install plus placeholder preference shell | Missing | Company settings service exists | Company settings | None | Define real employee preferences before porting | Not ready; prior behavior mostly shell |
| P2 | Offline attendance actions | Browser-local check-in/out queue and replay; selfie-required check-in cannot queue | No attendance action queue | Server revalidates replayed action | No durable client-action table | None | Decide safe native action queue; preserve server revalidation | No |
| P0 | Offline location batching | Not reliable in web/PWA | Deployed encrypted native queue and retry | Location ingestion endpoint | `location_history`, rate limits | None | Device validation and observability | Implemented |
| P2 | PWA installation | Install prompt, Later, settings card | Not applicable to native APK | Browser-only | Versioned browser local state | None | No migration needed | Not applicable |
| P2 | Release reminder | Web/PWA release popup and service-worker reload | Missing in Flutter | Web release service exists, not APK distribution | Release tables/migrations | None | Separate Android update-distribution design if approved | No |
| P2 | Celebrations | Personalized birthday/work-anniversary dashboard card/modal | Missing | Celebration service and cron exist; no mobile API | Employee dates/notifications | None | Mobile dashboard payload/UI | No |
| P2 | Attendance history/report | Employee-specific history/report not proven; admin reports/export exist | Missing | Admin report service/routes exist | Attendance/leave/calendar records | No attendance Sheets sync | Define employee scope; add safe read API/UI | Not confirmed as previous employee feature |

## 5. Attendance & Selfie Comparison

### Previous web/PWA behavior

- `app/(app)/attendance/page.tsx` loaded `AttendanceService.getTodayAttendance()` and supplied check-in, check-out, location-validation, and selfie-upload actions to `EmployeeAttendanceCard`.
- The card automatically requested browser geolocation on load and allowed manual refresh. It used `enableHighAccuracy: true`, `timeout: 15000`, and `maximumAge: 120000`.
- Check-in and check-out were enabled only after location policy validation succeeded.
- The submitted GPS object contained `latitude`, `longitude`, `accuracy`, and `timestamp`.
- Server policy remained authoritative for required GPS, high-accuracy threshold (defaulted by migration `0017` to 50 metres), work mode, allowed locations, radius/geofence, calendar, check-in window, duplicate protection, and working-time/status calculation.
- The UI allowed notes and device browser/platform metadata.
- The UI captured an image with `<input type="file" accept="image/*" capture="user">`, previewed it, accepted JPG/PNG/WebP/HEIC/HEIF, and capped it at 5 MB. The server also validated signatures and path ownership.
- A selfie could be supplied on both check-in and check-out. The existing policy requirement was enforced for check-in; checkout selfie was optional in the UI.
- Offline browser replay existed for attendance actions. Selfie-required check-in was intentionally not queued because the evidence upload required connectivity.
- The employee attendance page showed only today's record/status/times/working duration. Employee attendance history/report UI is **Not confirmed by repository evidence**.

### Deployed Flutter behavior

- `AttendanceScreen` shows today's status and check-in/check-out buttons.
- `AttendanceRepository.checkIn` and `checkOut` both submit `body: const {}`.
- `AttendanceState` parses record and tracking state, but not the returned policy details.
- There is no one-shot location request, notes UI, selfie UI, selfie upload route/client, or device metadata.
- The backend request parser already accepts the exact existing contract: `notes`, `gps`, `selfiePath`, and `deviceInfo`; `gps` allows `latitude`, `longitude`, `accuracy`, `timestamp`, `address`, and `source`.
- The mobile routes delegate to the same `AttendanceService`, so the correct migration approach is to reuse the existing policy contract rather than reimplement or weaken policy in Flutter.

### Database and Google readiness

- `attendance_records` supports check-in/out timestamps, status, working/late minutes, GPS coordinates, accuracy, addresses, sources, company-location IDs, distances, selfie paths, device metadata, work mode, and attendance type.
- Migration `0043_attendance_media_sync.sql` adds attachment metadata, durable outbox jobs, retry/lease state, Drive IDs/URL, and cache cleanup records for both `checkin` and `checkout` phases.
- Google Drive sync is asynchronous; attendance persistence does not wait for Drive. This is appropriate for mobile reuse.

## 6. Live Location Comparison

### Previous web/PWA

- The web/PWA attendance flow validated a current browser position but did not provide reliable screen-off/background duty tracking.
- `docs/LIVE_LOCATION_TRACKING.md` explicitly distinguishes browser limitations from native requirements.

### Deployed Flutter and backend

- Migration `0045_duty_bound_live_location_core.sql` creates `location_tracking_sessions`, immutable `location_history`, and `employee_current_locations`.
- The `sync_attendance_tracking_session` database trigger creates one attendance-bound session after check-in and closes it after checkout; the client does not create session identity.
- The native service starts only when Flutter receives an authoritative active session and supplies the bearer token/API origin to the service.
- Precise location and notification permission are required; no background-location permission is declared.
- The service runs as an Android location foreground service with an ongoing low-importance disclosure notification and `stopWithTask="false"`.
- The observation source prefers Android's fused provider, falls back to GPS, rejects pre-start cached locations, and requests updates every 30 seconds.
- The queue is app-private, AES-GCM encrypted with an Android Keystore key, session-bound, ordered, and capped at 500 points.
- The pipeline flushes up to 100 points, immediately at 10 queued points or every 30 seconds, assigns session-scoped idempotency keys, and retries bounded 429/503 responses.
- `POST /api/location/points` derives tenant, employee, attendance, and tracking session server-side; request-supplied identity is rejected.
- Migration `0046` provides distributed request/point rate limiting.
- Checkout/session invalidation stops tracking and invalidates the affected queue; token rejection preserves the queue for explicit reconciliation.

### Gaps and proof limits

- The deployed Flutter attendance mutation bug prevents a GPS-required check-in and therefore prevents the normal tracking session from starting.
- The repository implements foreground-service collection intended to continue while the UI is backgrounded. Complete real-device proof of movement, screen-off continuity, process/device restart recovery, and manufacturer battery-management behavior is **Not confirmed by repository evidence**.
- The initial 30-second cadence is fixed; source comments state adaptive sampling is a later milestone.
- The first-run proactive permission gate is local-only, not deployed.

## 7. Leave Comparison

### Previous behavior

- Employees saw active leave types with paid/unpaid status, selected start/end dates, supplied a reason, and submitted a request.
- Employees saw request history with type, date range, total working days, reason, and pending/approved/rejected/cancelled status.
- Pending requests could be cancelled.
- Admin approval/rejection was surfaced through stored status, approver/time, and rejection reason; approval could revise the type/dates/reason and recalculated working days.
- Validation rejects missing/invalid types, reversed dates, past dates, overlaps with pending/approved requests, and date ranges containing no working days.
- Leave types have `annual_limit` and `requires_approval` fields.
- Employee balance was displayed as `--`; actual balance, accrual, carry-forward, or payroll deduction is not implemented.

### Current Flutter/backend/schema

- Flutter: entirely missing.
- Backend: reusable `LeaveService` and server actions exist, but no `/api/mobile/v1/leave` routes exist.
- Database: `leave_types` and `leave_requests` fully model the confirmed request/status lifecycle.
- Google integration: none.

### Required migration/reuse

- Add authenticated, employee-scoped mobile APIs that delegate to existing leave service rules.
- Add Flutter type/history/application/cancellation UI.
- Do not advertise a balance until a product-approved balance model exists.

## 8. Quick Links Comparison

### Previous behavior

- Dashboard and Resources displayed a complete visual Quick Links grid.
- Links came from `resource_categories`, `resources`, and `resource_permissions`, ordered by category/resource display order.
- Visibility was evaluated server-side as `public`, exact `role`, or exact `employee`, plus active company-feature flags.
- Resources supported title, description, type, URL, icon, thumbnail, same-tab/new-tab mode, and featured state.
- Visual fallback priority was custom thumbnail, site favicon, selected built-in icon, then Company Hub placeholder.
- A resource without a URL rendered as an internal/non-clickable resource; external destinations used safe new-tab attributes.

### Current Flutter/backend/schema

- Flutter: missing.
- Backend: `EmployeeResourceService.getPortalData()` contains reusable tenant/role/employee filtering, but no mobile route exposes it.
- Database: complete support exists in resource/category/permission tables and hierarchical feature controls.
- Google integration: none.

### Required migration/reuse

- Add a read-only authenticated mobile resource endpoint that calls existing server-side filtering.
- Build Flutter category/Quick Link UI and safe URL launching. Do not move permission filtering into the client.

## 9. Google Sheets Integration

### Confirmed implementation

- Migration `0044_durable_google_sheets_sync.sql` and `features/reporting-sync` implement a durable projection of the **holidays** dataset only.
- The grain is one `holiday_events.id` per row in a machine-owned `Holidays` tab.
- Columns include record ID, calendar name/status, holiday date/title/type/working-day flag/description/status, and source update timestamp.
- Database triggers enqueue outbox work after holiday/calendar changes.
- A small worker can run after writes; `/api/cron/google-sheets` runs daily at `0 20 * * *` according to `vercel.json`.
- The worker uses leases, idempotent upserts, bounded retries/backoff, terminal failure notification, and periodic reconciliation/drift repair.
- Required server configuration is the explicitly selected company ID, spreadsheet ID, and a dedicated Google service-account identity/private key. Values are server-only and must remain outside Git.

### Attendance synchronization finding

- Attendance-to-Google-Sheets synchronization is **Not confirmed by repository evidence**.
- The reporting destination constraint is explicitly `dataset = 'holidays'`; the integration outbox's reporting event is `reporting.holiday.sync`.
- The attendance documentation also states that Google Sheets attendance reporting remains deferred.

### Reuse assessment

- The durable worker/outbox architecture is reusable in principle, but adding attendance would be a new approved dataset, schema contract, projection, privacy review, retention policy, and destination configuration—not a simple activation of an existing attendance sync.
- No Sheets work is required to restore the confirmed previous employee experience because employee attendance Sheets sync was not proven to exist.

## 10. Google Drive Integration

### Confirmed attendance selfie flow

1. The employee web/PWA uploads a validated selfie to the private Supabase `attendance-selfies` cache.
2. `buildAttendanceSelfiePath` creates the source object path as `company/employee/YYYY/MM/DD/checkin-or-checkout-objectId.extension`.
3. Attendance persistence stores the selfie object path on the attendance record.
4. Migration `0043` captures that reference into `attendance_attachments` and enqueues `attendance.selfie.sync`.
5. `AttendanceMediaSyncService` claims durable jobs, downloads the cache object, uploads it to Google Drive, independently verifies the Drive file, and records Drive file/folder/URL metadata.
6. After verified Drive sync, Supabase retains the cache for 72 hours. Cleanup re-verifies Drive before deleting only the cache object.
7. Authorized Company Admin retrieval streams the image through `/api/attendance/selfies/[attachmentId]`; raw provider URLs/credentials are not sent to employees.

### Folder, file naming, and metadata

- A single explicitly configured existing **Selfies** folder is used; the repository does not create a replacement folder hierarchy in Drive.
- The Drive filename is the source object path flattened with `__` separators.
- Drive `appProperties` store the Company Hub attachment ID, original object path, and `attendance_selfie` domain marker for idempotent lookup.
- Database metadata includes attendance record, employee/company, phase, source path, provider, Drive file/folder/URL, sync state, retry state, verification/sync timestamps, purge time, and cleanup outcome.

### Configuration and reuse

- Drive uses server-only OAuth 2.0 offline access with `drive.file`, an explicitly authorized Selfies folder, client ID/secret, refresh token, and folder ID.
- No Drive credential belongs in Flutter.
- The backend integration is reusable, but Flutter needs a secure authenticated mobile upload adapter and camera/file UI that returns the same validated `selfiePath` contract.
- Whether the currently deployed Production Drive OAuth grant has completed the documented `drive.file` cutover is **Not confirmed by repository evidence**; documentation records successful local authorization but says Production cutover was pending approval at that point.

## 11. Other Employee Features

### Home/dashboard — P1

- **Previous:** employee identity/date header, targeted announcement ticker, today's attendance summary, personal celebrations, and Quick Links, each gated by company feature controls.
- **Flutter:** missing; authenticated users land directly on Attendance.
- **Support:** services and tables exist, but no mobile aggregate route.
- **Work:** mobile dashboard contract, Flutter navigation, cards, loading/error/empty states.

### Announcements — P1

- **Previous:** company-scoped active announcements filtered by publication window and role/employee target; ticker and full page with images.
- **Flutter:** missing.
- **Support:** service, actions, announcement tables, role/employee audience tables, and image storage exist; no mobile route.
- **Production readiness:** backend domain ready; mobile surface not ready.

### Notifications — P1

- **Previous:** five latest notifications, unread count, mark-one/all read, Supabase Realtime inserts/updates, browser/PWA notification display, and action URLs.
- **Flutter:** only the mandatory Android foreground tracking disclosure; no business-notification center or push registration.
- **Support:** notification tables/services/actions and Realtime exist; a durable native push delivery provider/token system is not proven.
- **Work:** mobile read/read-state API and Flutter UI; separately decide whether realtime polling or push is required.

### Holidays/calendar — P1

- **Previous:** read-only active company holiday calendar; attendance and leave use the same calendar rules.
- **Flutter:** missing.
- **Support:** service and schema ready; no mobile read route.
- **Google:** holidays are the only confirmed Sheets-synchronized dataset.

### Resources/Knowledge Hub — P1

- **Previous:** role-filtered categorized resources, Quick Links, links/documents/training content, images/icons.
- **Flutter:** missing.
- **Support:** service/schema/storage ready; no mobile API.

### Profile and account — P1

- **Previous:** view employee ID, role, manager, joining date, work anniversary, work mode/status; edit phone, email, date of birth, and profile photo; change password with current-password and minimum-length validation.
- **Flutter:** login response shows name, employee ID, company, and role only; no profile/account screen.
- **Support:** profile/password services and employee/storage schema exist; no mobile routes.

### Settings — P2

- **Previous:** PWA install controls plus an explicit placeholder shell for future personal preferences/help.
- **Flutter:** missing.
- **Finding:** broader preference behavior is **Not confirmed by repository evidence** and should not be invented.

### PWA install and release reminders — P2

- **Previous:** dismissible install prompt and settings card; repository-managed release popup could be dismissed unless marked required and refreshed the service worker.
- **Flutter:** native APK makes PWA install irrelevant; no native APK update mechanism is deployed.
- **Work:** only implement an Android updater as a separately approved feature; it is not reusable by copying the service-worker flow.

### Offline behavior — P2/P0 split

- **Previous PWA:** network status plus browser-local attendance action queue/replay; server rules re-evaluated on replay; selfie-required check-in excluded.
- **Flutter attendance:** no action queue.
- **Flutter tracking:** strong deployed encrypted native point queue, retry, and lifecycle invalidation.

### Role-based behavior — P1

- **Previous:** employee navigation and content were gated by company feature state; resources were additionally filtered by public/role/employee permission. Company admins were redirected to corresponding admin routes.
- **Flutter:** active employee/company/role are validated at login, but no feature catalog/navigation or role-filtered content exists beyond attendance feature enforcement on the server.

### Attendance reports — P2 unless product reclassifies

- **Previous employee app:** employee history/report page is **Not confirmed by repository evidence**.
- **Existing platform:** admin attendance report pages and CSV/export routes aggregate attendance, leave, and holidays with GPS/work-mode fields.
- **Flutter:** missing.
- **Work:** define employee-specific scope and privacy rules before exposing a history endpoint/UI.

## 12. P0 Implementation Requirements

1. **Repair attendance GPS submission.** Acquire a fresh precise current position before both actions, handle permission/service/timeout/no-fix/poor-accuracy errors, submit the exact existing `gps` object, parse the server policy, and keep the server authoritative.
2. **Preserve tracking lifecycle.** Start the native service only after successful check-in returns an authoritative active tracking session; stop only after checkout/session invalidation. Retain encrypted batching and ingestion unchanged.
3. **Restore selfie parity where policy requires it.** Add a mobile-authenticated upload adapter reusing `AttendanceSelfieService`, then add camera capture/preview/type/size errors and send the returned `selfiePath`. Do not embed Google credentials or upload directly to Drive.
4. **Keep core session behavior.** Preserve secure storage, bounded refresh/retry, logout, active employee/company/role checks, and attendance feature authorization.
5. **Validate end-to-end without weakening policy.** Cover GPS-required, 50-metre accuracy, geofence, duplicate action, network ambiguity/reconciliation, selfie-required check-in, successful tracking activation, checkout, and queue invalidation.

## 13. P1 Implementation Requirements

1. Add a feature-aware Flutter shell/home and navigation using a server-returned effective feature list.
2. Add mobile employee dashboard aggregation by reusing existing announcement, attendance-summary, celebration, and resource services.
3. Add employee-scoped leave list/type/create/cancel routes and Flutter application/history/status UI. Keep balance absent until a rule exists.
4. Add read-only Quick Links/resources APIs that preserve server-side public/role/employee filtering and feature controls.
5. Add employee announcements and holidays/calendar read APIs/UI.
6. Add notification summary/read APIs and Flutter notification center; decide push separately from the existing tracking foreground notification.
7. Add profile read/update, profile-photo, and password-change mobile APIs/UI with the same validation and authorization rules.

## 14. P2 Implementation Requirements

1. Decide whether a native attendance action queue is needed; if implemented, retain server-time/policy revalidation and exclude evidence-dependent actions that cannot be safely queued.
2. Define any employee attendance history/report requirement before porting the admin reporting model.
3. Port celebrations only after the core dashboard exists.
4. Implement only real employee settings; do not reproduce the previous placeholder shell as functionality.
5. Treat native APK update distribution as a separate approved design; the PWA service-worker updater is not directly reusable.
6. Do not add attendance-to-Sheets synchronization unless separately approved as a new privacy-reviewed reporting dataset.

## 15. Dependencies and Risks

- **Critical current blocker:** deployed Flutter sends no GPS in attendance mutations, so Production policy rejection is expected.
- **Policy drift risk:** Flutter must consume and display server policy but must not become the authority for geofence, date, time, or duplicate decisions.
- **Mobile API gap:** most reusable domains are server services/actions, not stable mobile REST contracts. Thin authenticated adapters are required.
- **Selfie privacy risk:** direct mobile-to-Google upload would expose or duplicate credential architecture. Continue through the private Supabase cache and server-only Drive worker.
- **Permission risk:** the proactive permission gate is local-only and must be verified separately before counting it as deployed.
- **Android lifecycle risk:** foreground-service implementation exists, but broad real-device screen-off/manufacturer behavior is not proven in repository evidence.
- **Offline ambiguity:** queued attendance mutations can be stale; reconciliation and idempotent/duplicate server rules must remain authoritative.
- **Feature-flag/tenant risk:** web features depend on hierarchical feature controls and server-side resource audience filtering. A mobile API must not expose disabled or unauthorized data.
- **Leave product gap:** an annual limit field is not a balance system. No balance should be inferred.
- **Sheets scope risk:** extending the holiday projection to attendance would introduce substantially more sensitive data and requires explicit approval.
- **Documentation drift:** `features/live-location/README.md` still describes collection/Flutter as QA-only/inactive, while commit `a502d3c...` includes native collection/ingestion and the rollout record states Production deployment. Source behavior is used here; documentation should later be reconciled.
- **Worktree separation:** local application-ID/signing/permission changes were not used to inflate deployed capability. They must be reviewed independently before commit.

## 16. Evidence / Source References

### Deployed/current Flutter

- Commit `a502d3c343d5282dd38a211a0baecc59a3800a6c` — deployed capability baseline.
- `clients/employee_android/lib/src/app.dart` — only Login/Attendance routing and tracking reconciliation.
- `clients/employee_android/lib/src/ui/login_screen.dart` — employee login UI.
- `clients/employee_android/lib/src/ui/attendance_screen.dart` — today's attendance, tracking disclosure, logout.
- `clients/employee_android/lib/src/controllers/session_controller.dart` — session lifecycle and mutation reconciliation.
- `clients/employee_android/lib/src/repositories/attendance_repository.dart` — empty check-in/check-out bodies.
- `clients/employee_android/lib/src/models/attendance_state.dart` — limited attendance/tracking parsing.
- `clients/employee_android/lib/src/tracking/tracking_controller.dart` and `tracking_platform.dart` — server-authoritative native reconciliation.
- `clients/employee_android/android/app/src/main/AndroidManifest.xml` — precise/coarse location, notification, foreground-service permissions; no background-location permission.
- `clients/employee_android/android/app/src/main/kotlin/dev/companyhub/provisional/employee/tracking/` at `a502d3c...` — deployed service, observation, queue, batching, and ingestion implementation.
- Local-only: `clients/employee_android/lib/src/ui/permission_gate.dart` and current uncommitted package/config/test changes.

### Previous employee web/PWA

- `app/(app)/dashboard/page.tsx`, `attendance/page.tsx`, `leave/page.tsx`, `resources/page.tsx`, `announcements/page.tsx`, `calendar/page.tsx`, `profile/page.tsx`, `settings/page.tsx`.
- `components/layouts/app-layout.tsx` and `lib/navigation/navigation-engine.ts` — feature-aware employee shell/navigation/providers.
- `features/attendance/components/employee-attendance-card.tsx` — GPS, selfie, notes, offline action UI.
- `features/attendance/services/attendance-policy.service.ts` and `attendance-workflow-validation.service.ts` — policy/geofence/time rules.
- `features/offline/components/offline-sync-provider.tsx` — PWA attendance replay.
- `features/leave/components/employee-leave-page.tsx` and `services/leave.service.ts`.
- `features/employee-resources/services/employee-resource.service.ts`, `components/quick-resource-links.tsx`, and `README.md`.
- `features/notifications/components/realtime-notification-center.tsx`, `native-notification-bridge.tsx`, and `README.md`.
- `features/profile`, `features/announcements`, `features/company-calendar`, `features/pwa`, `features/releases`, and `features/celebrations`.

### Backend/API

- `/api/mobile/v1/auth/session`, `/refresh`, and logout session route.
- `/api/mobile/v1/attendance/state`, `/check-in`, and `/check-out`.
- `/api/location/points`.
- `features/mobile-api/services/mobile-auth.service.ts`, `mobile-attendance.service.ts`, `mobile-request.service.ts`, and `mobile-http.service.ts`.
- `features/live-location/services/location-ingestion*.ts`, repository, validation, and rate-limit services.
- `app/api/attendance/selfies/[attachmentId]/route.ts` and `app/api/cron/attendance-media/route.ts`.

### Database/schema

- `0001_core_tables.sql` — companies, roles, employees.
- `0002_business_tables.sql` — resources, permissions, announcements, company settings.
- `0007_notifications.sql`, `0016_announcement_targeting.sql`, `0020_notifications_realtime.sql`.
- `0009_attendance_foundation.sql`, `0010_attendance_gps_locations.sql`, `0017_attendance_policy_engine.sql`, `0018_field_attendance_and_dashboard_enhancement.sql`, `0021`–`0023` attendance work-mode/time migrations.
- `0012_leave_management_foundation.sql`, `0013_holiday_working_calendar.sql`.
- `0014_storage_setup.sql`.
- `0038_hierarchical_feature_control.sql`.
- `0043_attendance_media_sync.sql`, `0044_durable_google_sheets_sync.sql`, `0045_duty_bound_live_location_core.sql`, `0046_location_ingestion_rate_limits.sql`.

### Google integrations and documentation

- `features/attendance/services/attendance-media-sync.service.ts`.
- `features/attendance/storage/google-drive-attendance-permanent-storage.ts`.
- `lib/google/drive-client.ts`, `lib/google/config.ts`, `lib/media.ts`.
- `features/reporting-sync/README.md` and `services/google-sheets-sync.service.ts`.
- `app/api/cron/google-sheets/route.ts`, `vercel.json`.
- `docs/GOOGLE_INTEGRATION_SETUP.md`, `docs/LIVE_LOCATION_TRACKING.md`.

### Git-history provenance

- `7d25349` — attendance workflow foundation.
- `5efed6e` and `e1f03d8` — attendance policy/GPS validation.
- `08f5d86` — field attendance and selfie support.
- `29cb17e` — monthly admin attendance reports/export.
- `17168e2` — leave management foundation.
- `beb87cf` and `4f66445` — employee portal Quick Links and visual fallbacks.
- `95ab4f3` — lightweight offline attendance mode.
- `a1ca5fd` — PWA install/status experience.
- `787d1d3`, `dab9317`, and `dcc419b` — realtime/browser/native-notification foundations.
- `58a445a` — durable Drive selfie sync activation.
- `a6d7146` — durable Google Sheets holiday synchronization.
- `9ec5d99` — duty-bound tracking database core.
- `075e258`, `e035ceb`, and `a502d3c` — mobile attendance foundation and native location ingestion/recovery.

## 17. Recommended Migration Order

1. **P0.1 — Correct attendance GPS parity:** one-shot precise location, exact payload, policy parsing, check-in/check-out errors, and tests.
2. **P0.2 — Verify tracking lifecycle:** successful check-in creates the authoritative session; native service starts afterward; checkout closes/stops; offline ingestion recovers without duplicate points.
3. **P0.3 — Add selfie parity:** mobile-authenticated temporary upload, camera capture, conditional requirement, both phases, durable Drive verification; no Google credential in Flutter.
4. **P0.4 — Complete release/device validation:** permissions, service disabled, poor accuracy, geofence rejection, ambiguous network failure, resume/reconciliation, and logout.
5. **P1.1 — Add feature-aware shell/dashboard/navigation** so later modules have a stable home and server-controlled visibility.
6. **P1.2 — Add leave** using existing lifecycle and calendar rules; explicitly omit balance.
7. **P1.3 — Add Quick Links/resources** with server-side audience filtering.
8. **P1.4 — Add announcements and holidays/calendar.**
9. **P1.5 — Add notification center and profile/password management.**
10. **P2 — Add only approved convenience work:** native attendance offline queue, celebrations, employee attendance history, real settings, and native update distribution.
11. **Do not add attendance-to-Sheets sync by implication.** Treat it as a separate privacy/reporting project if requested.

This order preserves the already-deployed attendance/live-location architecture, closes the current Production attendance blocker first, reuses established backend/schema/Google boundaries, and avoids inventing unproven previous behavior.
