# Authentication and Authorization

## Identity model

Users enter Employee ID and password. Supabase Auth still uses email/password internally, so each employee has a generated `internal_auth_email` and an `auth_user_id` reference to `auth.users`. Both values are server-only implementation details.

```text
Employee ID + password
  → normalize Employee ID
  → service-role lookup of active employee identity
  → internal auth email
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

The database seed supplies a company and Admin role but no Auth user/employee, so the new project still requires this operational bootstrap.

## Role authorization

System roles are Admin, Sales Head, RSM, TSO, and SR. The Admin route layout requires an active session profile with role name `Admin`; non-admin users are redirected to the employee dashboard. Employee routes require Auth through middleware and obtain current context in services/layouts.

Authorization has three layers:

1. Middleware rejects unauthenticated protected routes.
2. Layouts/services enforce active employee and role/company context.
3. PostgreSQL RLS/storage policies restrict direct browser API access.

Most CRUD uses service role, so layer 2 is mandatory. Never assume service role will enforce RLS.

## Employee account lifecycle

- Creation generates internal email, creates Auth user, then employee row.
- Default employee password is currently Employee ID and is displayed to the creating Admin. There is no forced first-login change; this is a critical release blocker, not an acceptable production onboarding flow.
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
- Disposable confirmed-user creation and password login passed; the user was removed.

Because public signup is enabled while `/register` is incomplete, production owners should decide whether to disable signup or implement a controlled registration flow.

## Security invariants

- Do not return `internal_auth_email` or `auth_user_id` from actions/components.
- Do not log passwords, access/refresh tokens, cookies, or Auth provider payloads.
- Normalize Employee ID before lookup and use generic credential errors.
- Require active employee context after Auth; Auth user existence alone is insufficient.
- Validate company ownership for every service-role query/mutation.
- Enforce Admin/permission checks inside privileged actions, handlers, and services; route layout placement is not authorization.
- Add rate limiting and monitoring before production exposure.
