# Troubleshooting

## npm is blocked in PowerShell

Symptom: `npm.ps1 cannot be loaded because running scripts is disabled`.

Use the command shim:

```powershell
npm.cmd --version
npm.cmd run dev
```

Do not weaken workstation execution policy without organizational approval.

## Missing Supabase environment variables

Symptoms include “Missing Supabase environment variables” or runtime failures despite a successful build.

- Confirm `.env.local` exists.
- Confirm all five names in [DEVELOPMENT.md](DEVELOPMENT.md) are non-empty.
- Restart `next dev` after changes.
- Verify the URL hostname contains the intended project ref.
- Never print full keys while diagnosing.

## Wrong or unlinked Supabase project

```powershell
./node_modules/.bin/supabase.cmd projects list
Get-Content ./supabase/.temp/project-ref
./node_modules/.bin/supabase.cmd link --project-ref jjfktbgfwvekhlvyjlww
./node_modules/.bin/supabase.cmd migration list --linked
```

If access is denied, authenticate the CLI with an account belonging to the correct organization.

## Migration push fails

- Run `db push --dry-run` first and identify the first failing migration.
- Do not mark a migration applied unless its SQL state is genuinely present.
- Inspect dependencies, enum transaction behavior, duplicate names, and ownership restrictions.
- Fix with the next migration when the failed migration has already been applied elsewhere.
- Use `db lint` and security advisors after resolution.

## Docker-required Supabase command fails

`db dump`, local start/reset, and some diff workflows require Docker Desktop. Install/start Docker or use linked `db query`, generated types, migration history, inspection, and lint commands for read-only verification.

## Login always fails

- Verify an active employee row exists with `auth_user_id` and `internal_auth_email`.
- Verify the Auth user exists and email/password provider is enabled.
- Confirm employee status is `active` and role is active.
- Use Employee ID, not email, in the UI.
- On a fresh database, complete `/setup` first.
- Avoid exposing the internal auth email while debugging.

## Admin is redirected to employee dashboard

The exact active role name must be `Admin`. Check employee role linkage, company consistency, role status, and session refresh. The Admin route layout intentionally redirects non-admin roles.

## Realtime notifications do not arrive

- Confirm `public.notifications` is in publication `supabase_realtime`.
- Confirm the browser has an authenticated session and active employee row.
- Confirm notification `employee_id`/`company_id` matches the channel filter.
- Confirm notification RLS policy and `can_receive_notification` function are present.
- Resubscribe after session changes and inspect channel status.

## Storage upload is denied

- Profile/private employee paths must begin with the current Auth user UUID for owner policies.
- Shared public buckets require an active Admin.
- Attendance selfies are server/service-role uploads, not direct browser uploads.
- Confirm bucket name, object path, employee status, and Auth session.

## Attendance is rejected

- Check browser location/camera permission and HTTPS requirements.
- Review work mode, assigned/default locations, GPS accuracy threshold, radius, early check-in, office hours, and selfie requirement.
- Server distance/time decisions override client display.
- Inspect failed offline queue status after connectivity returns.

## Build passes but runtime fails

Next.js may not execute every server path during build. Verify environment values and exercise Auth/admin/employee routes against Supabase. Check server logs for a bounded error without copying secrets.

## Vercel CLI waits for login

```powershell
./node_modules/.bin/vercel.cmd login
./node_modules/.bin/vercel.cmd whoami
./node_modules/.bin/vercel.cmd link
```

Complete the browser/device flow interactively. A missing `.vercel/project.json` means the repository is not locally linked.
