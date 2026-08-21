# Architecture Decision Log

## ADR-016 — Android client foundation and mobile server contracts

**Status:** Accepted for design; Android support, application identity, signing,
and distribution ownership decisions remain open. This ADR does not authorize
Flutter scaffolding, dependency installation, location collection, production
configuration, or deployment.

### Context

ADR-015 selected a Flutter Android foreground-location service as the production
client for duty-bound live location. The repository currently contains no
Flutter project. The Next.js employee client authenticates through cookie-backed
server actions: Employee ID is resolved to the private `internal_auth_email` on
the server, Supabase Auth issues the session, and attendance actions delegate to
the existing attendance service. The location ingestion endpoint also derives
the canonical employee and company from authenticated server context.

The native client therefore needs an explicit mobile boundary. It must not
resolve or receive the private Auth email, reproduce attendance rules, embed a
privileged credential, or decide whether an employee is on duty.

### Decision

#### Repository boundary

The Flutter project will live at `clients/employee_android/`. It is an employee
client of the existing Company Hub platform, not a separate backend or source of
business rules. Its Flutter/Dart dependencies, Android build, tests, and release
artifacts remain isolated from the root Next.js build. Location collection is
not part of the initial scaffold.

#### Environments and flavors

Create `qa` and `production` Android product flavors with:

- separate application IDs using `<approved.reverse-domain>.employee.qa` and
  `<approved.reverse-domain>.employee`;
- visibly different display names, including an explicit QA marker;
- separate HTTPS API base URLs;
- separate public Supabase URL and anonymous/publishable configuration; and
- build-time validation preventing QA builds from using the production API,
  Supabase project, application ID, or signing configuration.

Only public client configuration may be compiled into the application. QA must
never contain production credentials. Service-role keys, database credentials,
OAuth secrets, signing secrets, and server application secrets are prohibited
from both flavors and source control. Exact application IDs remain **DECISION
REQUIRED** until the organization-owned reverse-domain namespace is confirmed.

#### Mobile authentication contract

The server will expose a versioned mobile Auth boundary under `/api/mobile/v1`:

- `POST /api/mobile/v1/auth/session` accepts Employee ID and the employee's
  original password over TLS. The server resolves the private Auth identity,
  applies the existing password transformation, performs Supabase sign-in, and
  returns the standard short-lived access token, refresh token, expiry, and a
  minimal non-sensitive session profile.
- `POST /api/mobile/v1/auth/session/refresh` refreshes the Supabase session and
  returns the replacement session.
- `DELETE /api/mobile/v1/auth/session` signs out/revokes the current session as
  supported by the existing Auth policy and clears local credentials.

Password changes continue through the existing password policy exposed through
a mobile-safe server boundary. Password change, employee/company deactivation,
Auth revocation, or invalid refresh invalidates local access and suspends
tracking. Errors must not expose `internal_auth_email`, `auth_user_id`,
transformed passwords, provider errors, or account-enumeration details.

Android stores refresh credentials only through Android Keystore-backed secure
storage. Access tokens remain short lived. No service-role key or application
secret is present in Flutter.

Mobile requests send the access token as a Bearer token. A server-only Bearer
adapter validates it with Supabase and resolves the same canonical active
employee, company, role, hierarchy, and effective-feature context used by the
cookie path. It never accepts identity, tenant, role, or duty status from a
request body. Existing tenant, attendance, feature, authorization, and RLS
checks remain in force. Cookie and Bearer transports converge before business
services rather than creating parallel authorization models.

#### Mobile attendance contract

Thin versioned HTTP routes delegate to existing attendance services:

- `GET /api/mobile/v1/attendance/state` returns the caller's authoritative
  attendance record, policy-required capabilities, and tracking-session state.
  Re-fetching it is the canonical reconciliation operation after an ambiguous
  request, process death, reboot, permission change, service termination, token
  refresh, or connectivity recovery.
- `POST /api/mobile/v1/attendance/check-in` accepts the existing validated
  attendance input and invokes the same feature, calendar, work-mode,
  server-time, GPS/accuracy/geofence, duplicate, selfie, and employee checks as
  the web action. Success includes authoritative attendance and tracking state.
- `POST /api/mobile/v1/attendance/check-out` invokes the same checkout service
  and conditional persistence boundary. Success confirms closed attendance and
  tracking state.

Routes adapt HTTP input/output but do not copy `AttendanceService` business
rules. Database constraints and attendance triggers remain authoritative:
successful check-in creates the tracking session and successful checkout closes
it. The client never declares duty active locally. A failed or ambiguous
checkout pauses collection while `attendance/state` is fetched; it cannot guess
whether checkout succeeded. Existing selfie and provider-neutral evidence rules
remain mandatory.

#### Location and notification permissions

The app explains duty-only tracking before requesting location. It requests
coarse and fine location together, but precise location is required for
tracking. Approximate-only access, denial, disabled location services, or
revocation produces no points and puts tracking in a visible suspended state
with an approved permission/settings recovery action. Revocation during duty
stops collection immediately and triggers reconciliation.

Persistent tracking disclosure is mandatory. Runtime notification-permission
denial suspends tracking; the foreground service and location collection must
not silently continue. The app may explain and request permission again only
through the approved UX.

The initial client does not request `ACCESS_BACKGROUND_LOCATION`. The location
foreground service starts while the activity is visible after successful
check-in, permission validation, and active-session confirmation. Background
location may be reconsidered only through a new decision if recovery testing
proves it necessary.

#### Lifecycle and mobile security

The server-authorized attendance tracking session is the sole duty authority.
After process death, reboot, upgrade, permission change, service termination,
or connectivity recovery, the app reconciles before resuming. A cached check-in
flag is insufficient. Successful checkout stops sampling and the foreground
service immediately; observations after session closure are not queued or sent.

Refresh credentials and local queue encryption keys use Keystore-backed
protection. No secret is embedded in the client. Logs and crash reports exclude
passwords, tokens, internal Auth identity, coordinates, route payloads, and
request bodies. QA and production endpoints, storage, tokens, identities,
signing, and telemetry remain isolated.

#### Encrypted offline queue contract

The queue is not implemented by this ADR. Its future contract is:

- encrypted transactional native storage with a Keystore-protected key;
- exactly one authoritative tracking session associated with every point;
- chronological insertion and delivery ordering;
- stable session-scoped idempotency keys created before the first attempt and
  reused for every retry;
- bounded rows, bytes, age, retries, and backoff selected from QA/device evidence
  rather than an arbitrary product limit;
- transactional removal after acknowledgement or duplicate confirmation;
- transient-failure retention with bounded exponential backoff and jitter; and
- purge/rejection when permission is unavailable, observation follows checkout,
  or reconciliation proves the session invalid.

The queue never makes duty decisions, silently drops an otherwise valid batch,
or logs coordinate-bearing payloads.

#### Location ingestion contract

The collector submits authenticated chronological batches to
`POST /api/location/points` through the Bearer adapter. It preserves at most 100
points and 128 KiB per request and stable session-scoped idempotency. It honors
`429` and `Retry-After`; a `503` retains eligible points and retries with bounded
exponential backoff and jitter. Authentication failure permits one controlled
refresh/retry. An inactive or closed session suspends collection and forces
reconciliation. Neither side logs tokens, bodies, coordinates, or route
payloads. Adaptive sampling remains distinct from batching and abuse limits.

#### Android support matrix

The following remain **DECISION REQUIRED** and must not be inferred from Flutter
defaults:

- minimum and target Android API levels;
- supported Pixel, Samsung, and locally common OEM/device matrix;
- Google Play Services requirement and non-GMS behavior;
- unsupported-device behavior;
- managed-device/device-owner requirements; and
- physical-device QA inventory.

Before production support, the approved oldest, current, and latest Android
versions must run on approved Pixel/stock, Samsung, and common OEM devices. The
matrix covers precise/approximate/denied/revoked location, notification denial,
location services disabled, foreground/background, screen-off, Doze, Battery
Saver, OEM restrictions, network recovery, ordered offline replay, process
death, OS service termination, reboot, upgrade, token expiry/revocation,
employee/company deactivation, successful and ambiguous checkout,
force-stop/user stop, mock-location signals, and queue storage pressure.
Emulators supplement but do not replace physical devices.

#### Signing and distribution

- QA ID convention: `<approved.reverse-domain>.employee.qa` with a visibly QA
  display name.
- Production ID convention: `<approved.reverse-domain>.employee`.
- QA distribution uses a controlled internal signed-APK channel and synthetic
  QA identities.
- Initial production distribution follows the documented controlled signed-APK
  direction. Future Play Store delivery uses Android App Bundles and Play App
  Signing only after approval.
- Signing-key custodian, backup/recovery owner, Play Console owner, release
  approvers, exact channels, final IDs, and namespace are **DECISION REQUIRED**.

No signing key, keystore, Play Console application, or distribution resource is
created by this ADR. Private signing material stays outside the repository and
is provided only to protected release automation.

### Consequences and implementation gate

The Flutter client can be introduced without disturbing Next.js because it is
isolated at `clients/employee_android/` and reuses business services through
versioned HTTP adapters. The new Auth and attendance surfaces are
security-critical and require revocation, denial, tenant, feature, session, and
redaction tests before collector work.

After approval, the exact first implementation task is an isolated Flutter
Android shell with `qa` and `production` flavors, environment guardrails, static
analysis, and empty platform-channel boundaries. It must not add a foreground
service, request location/notification permission, create an offline queue, or
activate collection. Mobile Auth and attendance APIs form the next
security-reviewed milestone and must pass isolated QA before collector work.

## ADR-015 — Native Android is the production live-location client

**Status:** Accepted; tracking-core migration implemented in isolated QA only

Duty-bound employee live location will use a Flutter Android client with a
native foreground-location service as the production mode. The service may run
only while a server-authorized attendance tracking session is active and must
show the operating system's persistent tracking notification/disclosure for the
entire active period.

The existing web/PWA may provide a foreground-only fallback. It may collect and
submit points only while the relevant page and browser remain active; it must
not claim reliable delivery after screen lock, browser suspension, process
termination, or operating-system background throttling. Reliable screen-off
collection, native lifecycle recovery, platform battery controls, persistent OS
disclosure, and supported native mock-location signals are Android-only.

Both clients reuse the existing Supabase backend, Employee-ID Auth policy,
tenant and role model, attendance rules, and server authorization boundaries.
This decision does not authorize Flutter implementation, schema changes, or
location collection. Privacy, retention, deletion, employee request handling,
device support, and incident ownership must satisfy the decisions and open
items in `docs/LIVE_LOCATION_TRACKING.md` before migration approval.

## ADR-014 — Split Google authentication by provider responsibility

**Status:** Accepted; OAuth activation pending owner consent

Use the dedicated service account for Sheets synchronization and OAuth 2.0
offline access delegated by the operational Google account for Drive uploads.
An ordinary My Drive cannot assign storage quota to service-account-created
files; the live upload probe returned `storageQuotaExceeded` even though the
service account was an editor. OAuth makes the operational account the upload
owner while preserving unattended server operation through a refresh token.
Do not use domain-wide delegation, account passwords, or public-link access.
All credentials remain server-only and are rotated through protected runtime
environments.

## ADR-013 â€” Company Admin is the canonical tenant authority

The historical tenant role `Admin` is migrated in place to `Company Admin`; stable `/admin/*` URLs and internal component names remain compatibility details. Company Admin authorization requires an active employee, active role, active company, matching company scope on service-role operations, and an enabled effective feature for feature-owned mutations. System Admin remains exclusively represented by `platform_admins`. Tenant role creation reserves platform authority names, and shared Storage media uses company-ID path prefixes.

## ADR-010 — System Admin is explicit and feature gates fail closed

Company `Admin` remains tenant-scoped. Global access requires an active `platform_admins` row and is never seeded or inferred. Feature availability resolves in order: active company, enabled platform feature, then optional company override. Missing overrides inherit enabled to preserve existing tenants; future global states are treated as disabled until their semantics exist. Company removal is a reversible lifecycle state, not destructive deletion.

## ADR-012 — Platform role is not a tenant role

“System Admin” is the product-facing name for an explicit `platform_admins` authorization, not a row in each company’s `roles` table. Tenant roles remain `Admin → Sales Head → RSM → TSO → SR`; putting System Admin in that hierarchy would bind global authority to one company and make tenant role administration an escalation path. Platform settings are a default-deny singleton and every global operation rechecks the platform authorization in server-only code.

This file records durable decisions reflected in code. Add an entry when changing a system boundary or invariant; do not rewrite history to make an old decision appear current.

## ADR-001 — Next.js App Router and server-first features

**Status:** Accepted

Use App Router route groups, server components, server actions, and feature modules. Pages compose; services own business behavior. This reduces privileged browser logic and aligns data loading with Next.js.

## ADR-002 — Supabase as backend platform

**Status:** Accepted

Use Supabase PostgreSQL, Auth, Storage, and Realtime. Schema changes are ordered SQL migrations. This centralizes core infrastructure while retaining explicit PostgreSQL constraints and policies.

## ADR-003 — Employee ID login over internal Auth email

**Status:** Accepted

Employees use Employee ID and password. A generated internal email bridges to Supabase Auth and is never exposed. This keeps business identity stable and provider implementation private.

## ADR-004 — One role and adjacency-list hierarchy

**Status:** Accepted

Each employee has one `role_id`; reporting hierarchy uses `manager_id` on employees. Do not add join-role or hierarchy tables without revisiting product requirements and migration compatibility.

## ADR-005 — Server-side service-role business access

**Status:** Accepted with risk

Most business CRUD uses a server-only service-role client after application-level authorization. This simplifies complex workflows and rollback across Auth/database operations, but makes service company/role checks security-critical. RLS remains default-deny defense for direct API access.

## ADR-006 — RLS on every exposed application table

**Status:** Accepted

All public tables enable RLS. Browser table access is denied unless explicitly required. Notifications have a scoped authenticated SELECT policy for realtime; other CRUD stays server-side.

## ADR-007 — Storage paths in data records

**Status:** Accepted

Persist bucket object paths rather than signed URLs. Shared helpers construct public URLs, while private access is resolved through Storage APIs. This avoids expiring URL persistence and makes bucket changes manageable.

## ADR-008 — Server-authoritative attendance

**Status:** Accepted

The server owns timestamps, GPS distance validation, work-mode/policy evaluation, and historical snapshots. Browser coordinates and offline queue entries are untrusted inputs.

## ADR-009 — Browser-local offline attendance queue

**Status:** Accepted as foundation

Queue attendance actions in local storage and retry online/through Background Sync. This provides lightweight resilience without a full offline database, but data can be lost with browser storage and conflicts need explicit UX.

## ADR-010 — Notification realtime as the only public-table subscription

**Status:** Accepted

Only `public.notifications` is added to `supabase_realtime`. Authenticated RLS filters events. Additional publications require a documented need, RLS behavior, volume analysis, and tests.

## ADR-011 — Forward-only production migrations

**Status:** Accepted

Never rewrite applied migrations. Correct defects through subsequent migrations and compensate rather than reset shared databases.

## ADR-012 — Vercel cron for celebrations

**Status:** Accepted

Run daily celebration generation through an authenticated GET route scheduled by `vercel.json`. The route is dynamic and requires `CRON_SECRET` in production.

## ADR-013 — Employee ID as the canonical default password

**Status:** Accepted business rule

Employees enter their original Employee ID as both username and default password. Existing internal Auth emails remain the Supabase identity bridge. Because Supabase requires six-character passwords, server code internally left-pads Employee-ID-derived credentials shorter than six characters before Auth calls. Padding is never exposed or entered by users. All provisioning, import, login, reset-to-initial, registration, and migration workflows must use the shared transformation in `features/auth/utils/employee-password.ts`.

## Open decisions

- Registration/invitation model and whether public Supabase signup stays enabled.
- Test runner, integration environment, and CI provider.
- Observability/logging platform.
- External push provider.
- Retention periods and privacy governance.
- Whether security helper functions move to a non-exposed schema.
