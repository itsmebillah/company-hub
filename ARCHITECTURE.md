# Architecture

## Platform control plane

`app/(platform)/platform` is a separate System Admin route group. Its server pages call `features/platform-control`, which revalidates the explicit platform identity before privileged Supabase access. System Admin is represented by `platform_admins`, not by a company role: this keeps global authority above and outside the tenant hierarchy while preserving the existing Employee-ID login flow. The control plane owns cross-company people, company lifecycle, global settings/branding, features, health, and audit. Company Admin feature and audit pages reuse platform-control services only through authenticated company scope. Middleware independently enforces company lifecycle, Company Admin membership, and feature availability; navigation and dashboard filtering mirror, but do not replace, authorization.

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
Supabase
  ├─ PostgreSQL + RLS
  ├─ Auth
  ├─ Storage
  └─ Realtime
```

## Repository topology

- `app/`: route groups, pages, layouts, route handlers, metadata, loading and error boundaries.
- `components/`: shared shells, navigation, primitives, theme and common presentation.
- `features/`: domain modules with actions, services, repositories, components, types, constants, and local README files.
- `lib/`: Supabase clients, environment access, auth/navigation helpers, date/media utilities.
- `hooks/`, `services/`, `types/`, `utils/`: small cross-cutting modules retained where feature ownership is not appropriate.
- `supabase/migrations/`: canonical database history.
- `public/`: PWA icons and service worker.

## Route groups

- `app/(auth)`: login, setup, and currently-placeholder registration.
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

Current employee/company context → policy and work-mode resolution → server-time/GPS/geofence validation → provider-neutral selfie storage → conditional attendance insert/update → best-effort automation events. Office-time and work-mode snapshots preserve historical interpretation. Offline actions are queued in browser local storage and replayed online.

`AttendanceSelfieStorage` isolates the current private Supabase bucket from attendance business logic and reserves a future Google Drive adapter without enabling it. `AttendanceCreated`, `AttendanceUpdated`, and `AttendanceCompleted` contracts provide an integration seam. They remain process-local and non-durable; guaranteed synchronization requires an approved transactional outbox migration before external adapters are enabled.

The credentialed `GoogleDriveClient` is infrastructure only and has no
attendance call site. The current upload action writes the object to Supabase
before the attendance action validates and stores its object path. Automation
handlers are awaited best-effort notification handlers; they neither upload to
Drive nor enqueue synchronization. Drive activation must not be represented as
complete until provider metadata, external file identity, durable retry state,
private media delivery, and cleanup behavior are implemented and migrated.

### Resource/announcement visibility

Employee context drives server-side filtering by company, lifecycle status, publication window, role/employee targeting, and active permissions. Client filtering is only presentation.

### Notifications

Server services create rows and track state. `notifications` is in `supabase_realtime`; an authenticated SELECT policy exposes only the current employee's rows or the Company Admin's company scope. Browser components merge insert events and resynchronize summaries after updates.

## Cross-cutting concerns

- **Errors:** technical details are logged server-side; UI receives bounded messages.
- **Caching:** protected/auth routes are `no-store`; actions use `revalidatePath`.
- **Media:** database fields store object paths; shared helpers build public URLs.
- **Time:** attendance uses server timestamps; company settings carry timezone/date-format preferences.
- **PWA:** manifest, service worker, install prompt, permission onboarding, and offline attendance queue.

## Architectural risks

- Service-role-heavy data access makes service authorization correctness critical.
- Playwright protects critical runtime, role, route, responsive, Storage, Realtime, attendance, export, and PWA boundaries in Chrome and Edge. CI and lower-level unit/service integration coverage remain open.
- Browser-local offline state has limited durability and recovery UX.
- Several oversized service/component files should be split only with behavior-preserving tests.

See [DECISIONS.md](DECISIONS.md), [SECURITY.md](SECURITY.md), and [DATABASE.md](DATABASE.md).
