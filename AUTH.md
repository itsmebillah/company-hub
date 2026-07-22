# Authentication and Authorization

## System Admin boundary

System Admin is an explicit global authorization in `platform_admins`; it is the platform role and is deliberately not inserted into tenant-scoped `roles`. This prevents a Company Admin from inheriting global authority and allows one approved Auth identity to operate across every company. A System Admin currently uses an existing active employee/Auth identity and is redirected to `/platform/dashboard` after login. Migration `0030` intentionally provisions nobody automatically.

System Admin password reset is server-only and requires an exact Employee ID confirmation. It restores the canonical Employee-ID-derived initial password through the Supabase Admin API without revealing Auth email mappings or the internally padded value, and records a centralized security audit event.

Company Admins remain restricted to their company and may use `/admin/settings/features` and `/admin/audit`. Employees cannot access either admin surface. Provisioning requires a deliberate trusted operation using the approved Auth user UUID and display name.

## Identity model

Users enter Employee ID and password. Supabase Auth still uses email/password internally, so each employee has a generated `internal_auth_email` and an `auth_user_id` reference to `auth.users`. Both values are server-only implementation details.

```text
Employee ID + password
  → normalize Employee ID
  → service-role lookup of active employee identity
  → internal auth email
  → internally left-pad Employee-ID-derived passwords to six characters when shorter
  → Supabase password sign-in
  → cookie-backed session
  → employee + role + company session profile
  → role-specific redirect
```

## Clients and sessions

- Browser client: interactive Auth and session-aware realtime/storage.
- Server client: current-user Auth operations using Next.js cookies.
- Middleware client: refreshes tokens and writes updated cookies.
- Admin client: server-only identity lookup, Auth administration, and authorized business operations.

“Remember me” extends eligible session cookie max age to 30 days. Protected/auth responses are marked no-store.

## Bootstrap

The root route checks for an active Admin employee. If none exists, it redirects to `/setup`; otherwise unauthenticated users go to `/login`. Bootstrap creates company/admin records and a Supabase Auth user, cleans partial records on failure, signs in, and redirects to the Admin dashboard. Once an active Admin exists, setup redirects away.

The database seed supplies a company and Admin role but no Auth user/employee. The migrated target now contains the source company, employees, and Admin identity, so `/setup` is no longer the normal initialization path for this project.

## Role authorization

System roles are Admin, Sales Head, RSM, TSO, and SR. The Admin route layout requires an active session profile with role name `Admin`; non-admin users are redirected to the employee dashboard. Employee routes require Auth through middleware and obtain current context in services/layouts.

Authorization has three layers:

1. Middleware rejects unauthenticated protected routes.
2. Layouts/services enforce active employee and role/company context.
3. PostgreSQL RLS/storage policies restrict direct browser API access.

Most CRUD uses service role, so layer 2 is mandatory. Never assume service role will enforce RLS.

## Employee account lifecycle

- Creation generates internal email, creates Auth user, then employee row.
- The canonical default password is the employee's original Employee ID. Users never enter leading zeroes. Server code left-pads Employee-ID-derived credentials shorter than six characters immediately before Supabase Auth calls so provider minimums are satisfied without changing the UI.
- The shared `toSupabaseEmployeePassword` utility is used by login, employee creation, bulk import, registration, reset-to-initial, and migration synchronization. The transformed value must never be logged, returned, or stored in application tables.
- Deactivation prevents active session profile use but is a soft database change.
- Import and bootstrap flows roll back orphan Auth users/database rows when possible.
- Password updates use the current user session; administrative reset service exists but public UX is incomplete.

## Registration

`/register` is currently a placeholder. A `registration.service.ts` exists for registering an existing employee, but the product decision and routed UI are incomplete. Do not present public self-registration as supported until invitation/eligibility, abuse prevention, and account-claim rules are approved.

## Auth configuration verified

- Supabase Auth health endpoint responds successfully.
- Email/password provider is enabled.
- Public signup is currently enabled at the Supabase project level.
- Phone provider is disabled.
- The new project contains 17 recreated Auth identities whose email, metadata, confirmation state, and employee linkage match the verified backup.
- Migrated Admin and employee password login, session cookies, dashboards, and role redirect were verified with temporary credentials.
- Source password hashes were unavailable and Auth UUIDs were remapped. All 17 migrated users have since been synchronized to the canonical Employee-ID-derived credential and individually login-verified.

Because public signup is enabled while `/register` is incomplete, production owners should decide whether to disable signup or implement a controlled registration flow.

## Security invariants

- Do not return `internal_auth_email` or `auth_user_id` from actions/components.
- Do not log passwords, access/refresh tokens, cookies, or Auth provider payloads.
- Normalize Employee ID before lookup and use generic credential errors.
- Require active employee context after Auth; Auth user existence alone is insufficient.
- Validate company ownership for every service-role query/mutation.
- Enforce Admin/permission checks inside privileged actions, handlers, and services; route layout placement is not authorization.
- Add rate limiting and monitoring before production exposure.
