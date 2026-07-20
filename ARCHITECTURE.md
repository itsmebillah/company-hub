# Architecture

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
- `app/(admin)`: Admin-only pages. The layout validates an active Admin session and loads shared settings, schema status, attendance configuration, and notifications.
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

Pages compose data and presentation. Actions validate transport-shaped input, call services, convert failures into friendly action state, and revalidate paths. Services own authorization, business invariants, orchestration, rollback, notifications, and audit logging. Repositories own direct table operations in larger domains.

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

Current employee/company context → policy and work-mode resolution → server-time/GPS/geofence validation → optional selfie storage → attendance insert/update → activity/notification. Office-time and work-mode snapshots preserve historical interpretation. Offline actions are queued in browser local storage and replayed online.

### Resource/announcement visibility

Employee context drives server-side filtering by company, lifecycle status, publication window, role/employee targeting, and active permissions. Client filtering is only presentation.

### Notifications

Server services create rows and track state. `notifications` is in `supabase_realtime`; an authenticated SELECT policy exposes only the current employee's rows or the Admin's company scope. Browser components merge insert events and resynchronize summaries after updates.

## Cross-cutting concerns

- **Audit:** domain services call non-blocking activity logging after successful mutations.
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
