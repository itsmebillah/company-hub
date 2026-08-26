# Employee App Master Implementation Plan

Last reconciled: 2026-08-24
Implementation branch: `feat/live-location-0045`
Web/PWA source of truth: `origin/main` at `88ad359c77d950e22aa45fe667e041bad1183628`
Flutter checkpoint: `8f1127d91b18f5b44a6ce6c8a6281c6ec94dafd3`
Current public Android release: `v0.1.4+5` at `87400095e986e7a5cb371288b326f192cfba4ab9`

## Purpose and authority

This is the execution ledger for migrating the established Company Hub employee
web/PWA experience into the isolated Flutter Android client. Existing web
behavior, server services, database rules, authorization, and integrations are
authoritative. Flutter may add thin mobile adapters, but must not duplicate or
replace business rules.

Status vocabulary:

- **CONFIRMED EXISTING** — implemented in the established web/backend system.
- **MIGRATED** — implemented and verified in Flutter for the stated scope.
- **PARTIALLY MIGRATED** — useful Flutter behavior exists but parity is incomplete.
- **BLOCKED** — a named decision or external dependency prevents implementation.
- **REQUIRES API** — an authenticated mobile adapter is absent.
- **REQUIRES ADMIN UI** — backend capability exists but the required admin surface does not.
- **TESTING** — implementation exists but required QA evidence is incomplete.
- **RELEASED** — included in a verified public Android release.

## Non-negotiable boundaries

1. `origin/main` remains the source of truth for existing employee UX and rules;
   React code is not copied into Flutter.
2. Supabase is operational authority. Google Drive stores attendance media, and
   Google Sheets is a derived reporting/archive layer only for explicitly
   approved datasets.
3. Flutter contains no service-role key, database credential, Google secret, or
   signing secret. Mobile calls use bearer-authenticated HTTPS routes.
4. Tenant, active-employee, feature, attendance, hierarchy, and RLS checks stay
   server-authoritative.
5. Existing attendance history is not rewritten. Production migrations and data
   changes require explicit approval.
6. Important completed work is committed and pushed one feature at a time to
   `origin/feat/live-location-0045`; force push and destructive cleanup are
   prohibited.
7. Portable workstation infrastructure from `8f1127d` is preserved.

## Phase 0 evidence map

### Established employee web/PWA

- Routes: `app/(app)/dashboard`, `attendance`, `leave`, `resources`,
  `announcements`, `calendar`, `profile`, and `settings`.
- Shell/navigation: `components/layouts/app-layout.tsx`,
  `lib/navigation/navigation-engine.ts`, and `lib/navigation/app-navigation.ts`.
- Employee domains: `features/attendance`, `profile`, `leave`,
  `employee-resources`, `resources`, `announcements`, `notifications`,
  `company-calendar`, `offline`, `pwa`, and `celebrations`.
- Admin attendance remains separate under `app/(admin)/admin/attendance`, with
  detail and report/export routes. Native migration must not replace it.

### Flutter Android

- Client root: `clients/employee_android/`.
- Current navigation: Home, Attendance, and Profile in `employee_shell.dart`.
- Authentication/session: bearer login/refresh/logout, Keystore-backed storage,
  reconciliation, and active employee/company checks.
- Attendance: state, fresh precise GPS check-in/check-out, server policy errors,
  and authoritative tracking reconciliation.
- Tracking: Android foreground service, `LocationManager`, encrypted bounded
  queue, idempotent ingestion, and permission/disclosure lifecycle.
- Updates: non-forced GitHub Release checks and verified installer boundary.

### Mobile/backend contracts

- Authentication: `/api/mobile/v1/auth/session` and `/refresh`; `DELETE` logs out.
- Attendance: `/api/mobile/v1/attendance/state`, `/check-in`, and `/check-out`.
- Tracking ingestion: `POST /api/location/points` with 100-point and 128-KiB
  bounds, session-scoped idempotency, distributed rate limiting, and redacted
  errors.
- Most established employee domains expose server actions/services but no
  stable bearer-authenticated mobile route yet.

### Database and integrations

- Canonical employee/company/role relationships: migrations `0001`–`0006`.
- Notifications/announcements: `0007`, `0016`, `0020`, `0024`, and `0028`.
- Attendance/GPS/policy/work modes: `0009`, `0010`, `0017`, `0018`, and
  `0021`–`0023`.
- Leave and holidays: `0012` and `0013`; storage: `0014`; hierarchical feature
  control: `0038`.
- Attendance media/Drive: `0043`; durable Holidays/Sheets projection: `0044`.
- Duty tracking and distributed abuse protection: `0045` and `0046`, validated
  in isolated QA and not approved for Production migration application.

## Feature migration ledger

| Feature | Existing Main Support | Current Flutter Status | Backend/API Status | Database/Integration Status | Implementation Status | Tests / evidence | Commit | Priority | Blockers / next gap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Login and session | Employee-ID login, role routing, logout, active identity checks | Login, refresh, secure storage, logout, reconciliation | Mobile auth routes exist | Existing Auth/employee linkage reused | **MIGRATED / RELEASED** | Flutter auth/session tests and QA device E2E | `075e258`, `285ebbc` | P0 | Preserve contract; no redesign |
| Home/Dashboard | Identity, attendance summary, updates, Quick Links, announcements, celebrations, feature-aware navigation | API-backed header with profile photo fallback, employee name, company name, date, role, employee ID; web-aligned Home attendance summary with date, check-in, check-out, recorded work, status, tracking state, profile link | Mobile dashboard profile/effective-feature contract and attendance state routes exist | Existing sources available | **PARTIALLY MIGRATED** | Widget/unit coverage, Home attendance summary tests | `0fc81dd`, `12e7c5b`, Step 3 checkpoint | P0 | Quick Links, updates, announcements, celebrations, and feature-aware navigation remain separate checkpoints |
| Profile | Full employee details and editable approved fields | Read-only name, employee ID, and role | No mobile profile route | Employee/profile schema exists | **PARTIALLY MIGRATED / REQUIRES API** | Profile widget/golden coverage | `0fc81dd` | P0 | Add canonical read/update contract before richer UI |
| Profile picture | View and upload through existing storage controls | Initials only | No mobile upload/read adapter | Existing employee photo/storage support | **REQUIRES API** | None in Flutter | — | P0 | Reuse server validation/storage; never expose privileged storage credentials |
| Attendance state | Today's server-authoritative status and policy | Today's state and reconciliation | Mobile state route exists | Existing attendance tables/rules reused | **MIGRATED / RELEASED** | Repository unit tests, Flutter tests, QA E2E | `075e258`, `285ebbc` | P0 | Extended summary/history is separate scope |
| Check-in / checkout GPS | GPS, accuracy/geofence/time/duplicate/work-mode policy | Fresh precise fix and GPS payload for both actions | Mobile mutation routes reuse attendance services | Server timestamps and policy remain authoritative | **MIGRATED / RELEASED** | Flutter/platform tests and QA device E2E | `2c3bf47`, `285ebbc` | P0 | Preserve 50m/default server policy and denial behavior |
| Attendance selfie | Conditional capture, validation, temporary private cache | Missing | Mutation accepts `selfiePath`, but authenticated mobile upload route is absent | `0043` attachment/outbox model exists | **REQUIRES API** | No Flutter coverage | — | P0 | Add secure upload adapter, camera UX, and policy-driven requirement |
| Google Drive selfie sync | Server-only durable Drive delivery, retry/recovery, secure read, cache cleanup | No direct Drive code by design | Existing worker/cron and media read route | Restricted Drive permanent store; Supabase temporary cache | **CONFIRMED EXISTING** | Drive/media verification suites | `58a445a` | P0 | Mobile must enter existing pipeline through selfie adapter only |
| Leave | Request/list/status/cancel plus admin approval and calendar rules | Missing | Services/actions exist; no mobile routes | `leave_types` and `leave_requests` exist | **REQUIRES API** | Web coverage only | — | P1 | No leave balance may be invented |
| Quick Links | Resource-backed quick links with tenant/role/employee visibility | Missing | Employee resource service exists; no mobile route | Resource/category/permission schema exists | **REQUIRES API** | Web behavior documented | — | P1 | Mobile adapter must preserve server-side audience filtering |
| Resources | Categorized employee resource portal and visual fallbacks | Missing | Services/actions exist; no mobile read route | Existing resource and permission tables | **REQUIRES API** | Web coverage only | — | P1 | Share contract with Quick Links without parallel data model |
| Announcements | Targeted announcements, images, active windows, read surfaces | Missing | Services/actions exist; no mobile route | Announcement targeting schema exists | **REQUIRES API** | Web coverage only | — | P2 | Preserve company/role/employee targeting |
| Notification center | Realtime list, unread/read tracking, browser/native bridge | Missing except mandatory tracking foreground notification | No employee mobile notification routes; no FCM contract | Notification tables/realtime RLS exist | **REQUIRES API** | Existing web tests only | — | P2 | In-app center first; push/FCM requires separate design |
| Holidays/calendar | Employee holiday/calendar view | Missing | Calendar service/actions exist; no mobile route | Holiday calendar exists; Holidays Sheets projection active | **REQUIRES API** | Web/reporting tests | `a6d7146` backend | P1 | Read-only mobile contract; Sheets remains derived |
| Settings/password | Password change and PWA-specific settings shell | Missing | Password service exists; no bearer mobile adapter | No new schema needed for password | **REQUIRES API** | Web validation only | — | P1 | Port real account settings only; do not copy PWA placeholders |
| Logout | Server revoke plus local sign-out behavior | Implemented | Mobile session delete exists | Auth session only | **MIGRATED / RELEASED** | Flutter session tests and QA E2E | `075e258` | P0 | Preserve safe local cleanup on network failure |
| Native app updates | PWA release reminder existed; native contract differs | Optional GitHub Release check, Later/Update Now, verified installer | Public GitHub release metadata/assets | No database dependency | **MIGRATED / RELEASED** | Update unit tests and release verification | `5579f90`, `285ebbc` | P2 | Remain non-forced; increment versionCode per release |
| Duty live tracking core | Not part of established employee PWA parity; planned Phase 5 capability | Foreground service, observation, encrypted queue, ingestion lifecycle | Ingestion and mobile attendance tracking contracts exist | `0045`/`0046` QA only | **PARTIALLY MIGRATED / TESTING** | Native/Flutter/unit/QA ingestion evidence | `9ec5d99`, `e035ceb`, `a502d3c` | P3 | Production DB inactive; real-device/OEM support incomplete |
| Admin Live Location | Existing admin attendance detail is historical, not live monitoring | Not applicable to employee Flutter client | Server-side `AdminLiveLocationService` reads `employee_current_locations` for the authorized company-admin view | Current projection from `0045`; RLS boundary preserved | **PART A IMPLEMENTED** | Mapper/freshness tests, `0045` authorization assertions, typecheck/lint/secret scan | Part A checkpoint | P3 | Cadence remains 30 seconds; readable address, retention/archive, history/export, and Sheets archival remain separate work |
| Location history/archive | Admin attendance history exists, route history does not | No employee route-history UI | Ingestion exists; history/export/archive APIs absent | Recent history in `0045`; no retention/archive worker | **BLOCKED** | Core migration tests only | — | P3 | Retention value and Sheets dataset approval required before cleanup/archive |

## Confirmed implementation gaps and risks

1. **Dashboard parity:** current Flutter Home is intentionally small and lacks
   profile photo/designation, effective feature controls, Updates badge, Quick
   Links, announcements, and other established cards.
2. **Selfie parity:** Flutter cannot satisfy a selfie-required attendance policy
   because it has neither capture UI nor an authenticated upload adapter.
3. **Mobile API coverage:** leave, resources, Quick Links, announcements,
   notifications, holidays, and full profile/password flows require thin mobile
   routes around existing services.
4. **Tracking sampling mismatch:** native `LocationManagerObservationSource`
   currently requests updates at a 30-second minimum interval. The approved
   product target is approximately 20–40 minutes. This must be addressed as a
   dedicated, tested tracking change; no tracking code is changed by this audit.
5. **Admin Live Location Part A:** `/admin/live-location` now reads `employee_current_locations` through `AdminLiveLocationService`, shows tenant-scoped employee/role labels, latest timestamp, freshness, accuracy, coordinates, and Open Map. Authorization remains the existing Company Admin attendance boundary; the `0045` self/direct-manager/company-admin RLS function is unchanged. Readable address, cadence changes, retention/archive, history/export, and Sheets archival remain blocked or separate.

5. **Retention policy:** the directive describes approximately 2–3 days in
   Supabase, but existing Phase 5 policy records previously left concrete
   retention configurable. Reconcile and explicitly approve the operational
   value before a cleanup/archive migration or worker.
6. **Sheets privacy scope:** Production Sheets synchronization is approved for
   Holidays only. Location archive, Attendance, Leave, and Employee datasets
   require explicit field allowlists, access, retention, and operational
   approval.
7. **Documentation drift:** some tracking UI/README text says points are not
   uploaded although the native ingestion pipeline now exists. Correct this only
   within the relevant tracking milestone.
8. **Device support:** API 36 emulator evidence exists; minimum Android API and
   production OEM/device support remain decision/test-matrix items.

## Implementation sequence

Each row is one independently reviewed, tested, documented, committed, and
pushed feature checkpoint.

1. **P0.1 - Employee Home/Dashboard parity foundation:** backend contract, Flutter header, and Home attendance summary alignment **completed**. `GET /api/mobile/v1/dashboard` powers the native Home header with profile photo fallback, employee name, company name, current date, role, and employee ID. The Home Attendance card now mirrors the web summary with attendance date, check-in, check-out, recorded work, status, and Open Attendance navigation. Duty tracking and navigation were preserved; Quick Links and updates remain separate checkpoints.
2. **P0.2 — Profile and profile picture:** canonical read/update endpoint,
   approved editable fields, secure photo pipeline, and Flutter UI.
3. **P0.3 — Attendance selfie parity:** authenticated temporary upload, camera
   permission/capture/preview, policy-driven check-in/check-out evidence, and
   durable Drive verification.
4. **P0.4 — Attendance regression checkpoint:** GPS accuracy, geofence,
   duplicate, ambiguous response/reconciliation, tracking activation/closure,
   and real-device lifecycle.
5. **P1 — Quick Links/resources, Leave, Holidays, and Settings/password**, one
   domain per checkpoint, using server-side feature and audience controls.
6. **P2 — Announcements, in-app notification center, targeted messaging, then
   optional FCM push**, each after its backend authorization contract is audited.
7. **P3 — Tracking cadence/battery hardening, Admin Live Location list/detail,
   retention/archive, and historical export**, only after policy/database
   approvals. Google Sheets must never become the live source.
8. **P4 — Full regression, Production migration approval, signed release, and
   final migration verification.** Release creation is never implicit in a
   normal feature checkpoint.

## Per-feature completion gate

- Compare `origin/main`, current Flutter, services/routes, migrations/RLS, and
  relevant documentation before editing.
- Preserve business rules and keep route handlers thin.
- Add Flutter unit/widget/golden/integration coverage and Android/backend tests
  appropriate to the change.
- Run formatting/analyzer/tests/builds, repository lint/typecheck/unit/build,
  secret scan, and configuration isolation checks appropriate to the scope.
- Update this ledger with exact status, evidence, commit, blockers, and notes.
- Commit only that feature, push to `origin/feat/live-location-0045`, verify the
  remote SHA, and leave the working tree clean.

## Exact next implementation task

Implement the next approved employee Home/Dashboard slice only, such as Quick Links or updates, after a read-only source comparison. Do not bundle Leave, announcements, selfie, tracking, release work, or backend deployment into that checkpoint.

## Canonical supporting references

- [Employee feature migration audit](EMPLOYEE_APP_FEATURE_MIGRATION_AUDIT.md)
- [Employee Android client](../clients/employee_android/README.md)
- [Mobile API](../features/mobile-api/README.md)
- [Attendance](../features/attendance/README.md)
- [Live location](LIVE_LOCATION_TRACKING.md)
- [Live-location backend](../features/live-location/README.md)
- [Google integration setup](GOOGLE_INTEGRATION_SETUP.md)
- [Architecture](../ARCHITECTURE.md)
- [Database](../DATABASE.md)
- [Known issues](../KNOWN_ISSUES.md)
- [Roadmap](../ROADMAP.md)
