# Architecture

## Portable workstation configuration

Git contains application source, safe public flavor contracts, configuration
names, and validation rules, but no secret values. Trusted workstation transfer
uses one externally stored SOPS/age bundle with allowlisted local-runtime and
isolated-QA profiles plus the Google OAuth and service-account documents. Import
materializes ignored env files and credential files outside the checkout;
Vercel, Render, GitHub environment, CLI-session, and Android signing stores are
not queried. QA validation pins the isolated Supabase project and Render API
origin and rejects Production cross-wiring. See
[Portable Development Setup](docs/PORTABLE_DEVELOPMENT_SETUP.md).

## Platform control plane

`app/(platform)/platform` is a separate System Admin route group. Its server pages call `features/platform-control`, which revalidates the explicit platform identity before privileged Supabase access. System Admin is represented by `platform_admins`, not by a company role: this keeps global authority above and outside the tenant hierarchy while preserving the existing Employee-ID login flow. The control plane owns cross-company people, company lifecycle, global settings/branding, features, health, and releases. The former Activity Log and Platform Audit systems were removed by migration `0041`. Middleware independently enforces company lifecycle, Company Admin membership, and feature availability; navigation and dashboard filtering mirror, but do not replace, authorization.

## Company administration plane

`app/(admin)` is the tenant control plane. The canonical tenant authority is the `Company Admin` role; `/admin/*` URLs remain stable for backward-compatible links. Middleware calls the caller-derived `can_access_company_admin()` predicate before route rendering, while every privileged Server Action rechecks Company Admin status and the relevant effective feature state. Service-role reads and writes resolve the authenticated company first and include `company_id` in entity queries. Company Admins cannot create companies, access `/platform`, create platform roles, read global analytics, or manage another tenant.

## Navigation and feature resolution

`lib/navigation/navigation-engine.ts` is the single navigation catalog. `MobileNavigationV2` renders the same structural shell for every role: Hub, Updates, Me, and More remain inside the floating bar while Dashboard is a separate central FAB. Role changes destinations, never layout. Desktop navigation consumes the same feature-aware destination model.

Feature resolution is platform-first. A platform feature must be enabled; when company override is permitted, the company may inherit, enable, or disable it. A platform-disabled feature always wins, and a platform-locked enabled feature ignores a tenant disable. The resulting effective set is shared by dashboards, navigation, settings, resource surfaces, middleware, APIs, and Server Actions. Shared resource routes accept an any-of rule so Quick Links, Knowledge Hub, and Resources can be controlled independently without stranding the common portal.

## Branding and releases

Company settings remain the branding source of truth. The authenticated layout resolves stored logo, favicon, and color settings into CSS variables and shared `Logo` rendering; server metadata and the manifest use the same settings with safe fallbacks. Platform routes use platform branding rather than tenant branding.

Release metadata lives in `platform_releases`; per-user acknowledgment lives in `release_receipts`. `ReleaseUpdateProvider` compares the built package version with the latest published release, supports optional and mandatory dialogs, and requests service-worker activation before reloading a PWA. System Admin controls publish/update/maintenance metadata at `/platform/releases`; automated publication is performed only after the deployment quality gate.

## System context

Company Hub is a server-first Next.js App Router application backed by Supabase PostgreSQL, Auth, Storage, and Realtime. Vercel is the intended web/cron host. Browsers interact with Next.js routes and server actions; privileged data access remains on the server.

```text
Browser / installed PWA
  ├─ Next.js pages and client components
  ├─ Supabase Auth session cookies
  ├─ approved Storage uploads
  └─ scoped Realtime notification channel
           │
           ▼
Next.js App Router on Vercel
  ├─ middleware route protection
  ├─ server components
  ├─ server actions
  ├─ HTTP route handlers / cron
  └─ server-only services and repositories
           │
           ▼
Supabase operational source of truth
  ├─ PostgreSQL + RLS
  ├─ Auth
  ├─ private Storage recovery cache
  └─ Realtime
           │
           ▼
Durable integration worker
  ├─ restricted Google Drive permanent attendance media
  └─ Google Sheets Holidays projection (durable derived reporting)
```

## Repository topology

- `app/`: route groups, pages, layouts, route handlers, metadata, loading and error boundaries.
- `app/page.tsx`, `app/privacy`, and `app/terms` compose the data-free public site from `features/public-site`; they link into `/login` without weakening authenticated route or API protection.
- `components/`: shared shells, navigation, primitives, theme and common presentation.
- `features/`: domain modules with actions, services, repositories, components, types, constants, and local README files.
- `lib/`: Supabase clients, environment access, auth/navigation helpers, date/media utilities.
- `hooks/`, `services/`, `types/`, `utils/`: small cross-cutting modules retained where feature ownership is not appropriate.
- `supabase/migrations/`: canonical database history.
- `public/`: PWA icons and service worker.
- `scripts/setup-local.ts` and `scripts/doctor.ts`: portable, allowlisted local
  configuration bootstrap and redacted diagnostics. Git contains the schema and
  tooling; ignored local env files or an externally protected SOPS/age bundle
  contain values. Production secrets remain in Vercel.

## Route groups

- `app/(auth)`: login and setup; unsupported public registration returns to login.
- `app/(admin)`: Company Admin-only pages. The layout validates an active Company Admin session and loads company settings, schema status, attendance configuration, and enabled notifications.
- `app/(app)`: active employee workspace routes.
- `app/api`: celebration cron and notification tracking.

Middleware refreshes Supabase Auth state, redirects unauthenticated protected routes, and marks protected/auth responses as non-cacheable. Role enforcement is completed in server layouts/services, not middleware alone.

## Layering and dependency direction

The preferred feature flow is:

```text
route/page
  → server action or read service
  → domain service / validation service
  → repository (where present)
  → Supabase client
```

Client components do not import the service-role client. The browser client is used for session-aware Auth, profile storage upload, notification realtime, and other explicitly policy-protected operations.

## Supabase clients

- `lib/supabase/client.ts`: browser client using URL and anonymous key.
- `lib/supabase/server.ts`: cookie-backed server client for the current user.
- `lib/supabase/middleware.ts`: request/response cookie refresh.
- `lib/supabase/admin.ts`: server-only service-role client for authorized business operations.

Because most business CRUD uses service role, every service must establish application-level employee/company/role authorization before querying or mutating. RLS is a defense-in-depth default-deny boundary for direct API access, not a replacement for service authorization.

## Major business flows

### Authentication

Employee ID is normalized and resolved server-side to `internal_auth_email`; Supabase Auth verifies the password and issues the session. Session profile joins the Auth user to an active employee and role. Admins land at `/admin/dashboard`; other roles land at `/dashboard`.

### Employee creation/import

Validation → Auth user creation → employee insertion → activity/notification side effects. Failures remove partial Auth/database records. Bulk imports stage parsed rows and process bounded batches.

### Attendance

#### Durable attendance media

Attendance writes first persist the private Supabase cache path and attendance
record. Migration `0043` creates attachment metadata and an outbox row in that
same database transaction. An immediate post-response attempt and an hourly
worker deliver the object to an explicitly app-authorized Google Drive Selfies
folder using the `drive.file` OAuth scope, atomic leases,
exponential retry, Drive app-property idempotency, and partial-upload recovery.

Company Admin previews use a tenant-authorized server route. It prefers the
permanent Drive object after synchronization and falls back to the retained
cache while delivery is pending. After Drive re-verification, cleanup waits 72
hours and removes only the Supabase object. Attendance records, metadata, and
Drive files are never deleted by cleanup. The Drive adapter requires
`isAppAuthorized` for the folder and every stored file before metadata reads,
downloads, recovery reuse, or verifier-file deletion.

Current employee/company context → policy and work-mode resolution → server-time/GPS/geofence validation → provider-neutral selfie storage → conditional attendance insert/update → best-effort automation events. Office-time and work-mode snapshots preserve historical interpretation. Offline actions are queued in browser local storage and replayed online.

`AttendanceSelfieStorage` isolates the temporary private Supabase cache from attendance business logic. `AttendancePermanentStorage` isolates permanent media and is implemented by the OAuth-backed Google Drive adapter. The `integration_outbox` is durable for attendance media; non-media `AttendanceCreated`, `AttendanceUpdated`, and `AttendanceCompleted` notification handlers remain process-local and best-effort.

Product Phase 5 migration `0045` models a server-authorized tracking session
separately from attendance history, append-only route points, and a derived
current-location projection. The authenticated ingestion route derives identity
from Auth context, resolves the active attendance-backed session, validates a
bounded ordered batch, and writes through a server-only repository. Database
triggers remain authoritative for check-in start, checkout stop, projection,
and session-scoped replay protection. Coordinates and route payloads are
excluded from logs and reporting.

Migration `0046` uses PostgreSQL transaction advisory locks and atomic counter
upserts for distributed session/tenant rate limiting across stateless Vercel
instances. The limiter runs after replay classification and before insertion,
so duplicate retries do not consume new-point budget. Denial is explicit and
retryable; database/RPC unavailability fails closed before route storage.

This core is validated in isolated QA only. The Flutter client now has the
native Android foreground-service, runtime precise-location/notification
permission, persistent disclosure, revocation, and server-session lifecycle
foundation. Its native-only Android `LocationManager` adapter prefers the
framework fused provider, falls back to GPS, rejects stale pre-start fixes,
and removes race-safe listeners on every denial/stop path. Valid observations
remain native through an Android Keystore AES-GCM encrypted queue and the HTTPS
request boundary. The queue holds at most five server-sized batches, preserves
chronology and session-scoped idempotency, retains valid points only for bounded
transient retry/reconciliation, and invalidates them on checkout, permission
loss, explicit stop, or authoritative session rejection. Flutter receives only
redacted count/sync health. Production device support, maps, realtime
presentation, geofences, replay, and production activation are not implemented;
web/PWA collection remains foreground-only.

### Google Sheets reporting

The server-only Sheets client uses a dedicated service account and the shared bounded Google API retry/error-redaction layer. It can inspect the approved workbook and perform self-cleaning verification writes, but no production business dataset is synchronized.

Migration `0044` adds the governed Holidays row contract, a forward-only outbox extension, leased retries, deterministic bounded upserts, deletion semantics, reconciliation, health state, and isolated tenant tests. Sheets remains a derived reporting layer and cannot authorize or mutate operational HR workflows.

### Client direction

The Next.js application remains the permanent Admin client and the current
Employee web/PWA. The isolated Flutter Android shell is rooted at
`clients/employee_android/`. Its provisional QA/production flavors have
separate IDs, display names, HTTPS API/Supabase public configuration contracts,
and build-time cross-environment denial. The server now exposes ADR-016's six
versioned mobile Auth and attendance adapters. Supabase validates bearer tokens,
then a request-scoped transport supplies the same canonical Auth user consumed
by current employee/company, feature, and Attendance services. The Flutter client
stores session credentials through Android Keystore-backed secure storage,
performs one bounded refresh/retry on `401`, and reconciles attendance after
startup, resume, refresh, and every mutation. Its native channel starts a
visible foreground-service shell only for the server-confirmed `0045` active
session and only after precise location plus notification permission. Denial or
revocation stops/suspends the shell and never claims tracking is active. The
observation adapter remains native-only and non-sticky; process recovery
requires fresh server attendance reconciliation. No background-location
permission exists; the native client submits only to the existing
`POST /api/location/points` contract and remains a transport rather than a
source of attendance or tracking-session business rules.

### Resource/announcement visibility

Employee context drives server-side filtering by company, lifecycle status, publication window, role/employee targeting, and active permissions. Client filtering is only presentation.

### Notifications

Server services create rows and track state. `notifications` is in `supabase_realtime`; an authenticated SELECT policy exposes only the current employee's rows or the Company Admin's company scope. Browser components merge insert events and resynchronize summaries after updates.

## Cross-cutting concerns

- **Errors:** technical details are logged server-side; UI receives bounded messages.
- **Caching:** protected/auth routes are `no-store`; actions use `revalidatePath`.
- **Media:** database fields store private cache paths and immutable provider IDs. Signed or controlled delivery URLs are produced only at authorized read time.
- **Time:** attendance uses server timestamps; company settings carry timezone/date-format preferences.
- **PWA:** manifest, service worker, install prompt, permission onboarding, and offline attendance queue.

## Architectural risks

- Service-role-heavy data access makes service authorization correctness critical.
- Playwright protects critical runtime, role, route, responsive, Storage, Realtime, attendance, export, and PWA boundaries in portable Chromium, with Edge optional. Isolated authenticated mutation coverage and lower-level unit/service integration coverage remain open.
- Durable Google Sheets Holidays synchronization, reconciliation, and actionable failure health are implemented. Additional datasets remain unapproved.
- Browser-local offline state has limited durability and recovery UX.
- Several oversized service/component files should be split only with behavior-preserving tests.

See [DECISIONS.md](DECISIONS.md), [SECURITY.md](SECURITY.md), and [DATABASE.md](DATABASE.md).
