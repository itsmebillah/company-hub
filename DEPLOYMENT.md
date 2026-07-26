# Deployment

## Target platform

The intended topology is Vercel for Next.js and scheduled cron, with Supabase providing PostgreSQL, Auth, Storage, and Realtime. `vercel.json` schedules the celebrations endpoint daily at `0 18 * * *` UTC.

The Vercel CLI is installed and authenticated locally, and the repository is linked to the existing `company-hub` project. The five required environment variable names are present for both Production and Preview; values remain encrypted and must never be printed. Migrations through `0040` must precede version `0.2.0`; provision System Admin access explicitly and separately.

## Automatic release publication

`.github/workflows/automatic-release.yml` listens for a successful production deployment status. It checks out the exact deployment commit, installs deterministically, runs lint/typecheck/build, confirms Supabase migration parity and database lint, verifies the production URL, then runs `npm run release:publish` and creates the matching GitHub Release. The publisher reads the version from `package.json` and the matching section in `CHANGELOG.md`; do not duplicate notes manually.

Configure these GitHub Actions secrets before enabling the gate: the five application variables listed below plus a percent-encoded `SUPABASE_DB_URL` for the target project. The direct database URL avoids storing a broad Supabase account access token in GitHub. Release publication must fail closed when any gate or required secret is unavailable. Major-version approval is deliberately future-ready but is not part of the current automatic workflow.

## Environment setup

Configure separate Vercel Preview and Production values:

- `NEXT_PUBLIC_APP_URL`: environment-specific canonical URL.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: intended Supabase environment.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only and encrypted.
- `CRON_SECRET`: strong random secret, also used by the Vercel cron Authorization header behavior.

Never upload `.env.local`. Verify no service-role value is present in client bundles or repository history.

## Verify or repair the Vercel link

```powershell
./node_modules/.bin/vercel.cmd login
./node_modules/.bin/vercel.cmd link
./node_modules/.bin/vercel.cmd env ls
```

Select the existing project and correct team. Review `.vercel/project.json`; `.vercel/` should remain ignored.

## Database-before-application sequence

1. Confirm the linked Supabase project reference.
2. Back up production and rehearse the migration in a non-production project.
3. Run `migration list` and `db push --dry-run`.
4. Apply pending migrations.
5. Run database lint/security advisors and behavioral smoke tests.
6. Deploy the compatible application build.
7. Verify cron, Auth, Storage, Realtime, and core pages.

```powershell
./node_modules/.bin/supabase.cmd migration list --linked
./node_modules/.bin/supabase.cmd db push --linked --dry-run
./node_modules/.bin/supabase.cmd db push --linked --yes
./node_modules/.bin/supabase.cmd db lint --linked --level warning
```

Migrations are forward-only. Do not rewrite history or use destructive resets on a shared project.

## Build and deploy

```powershell
npm.cmd install
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
./node_modules/.bin/vercel.cmd deploy
```

Use `vercel deploy --prod` only after Preview smoke testing and the [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) gate.

## Post-deploy smoke test

- `/` redirects correctly based on bootstrap/session state.
- Login, logout, Admin dashboard, and employee dashboard load.
- A harmless read succeeds for each major domain.
- Attendance preparation works with permission denial and valid GPS paths.
- Private/public storage URLs and uploads obey policy.
- Notification realtime channel subscribes for an authenticated employee.
- Cron returns 401 without the secret and succeeds with the configured secret.
- No server logs expose environment values or internal auth email.

## Rollback

- Application: promote/redeploy the previous known-good Vercel deployment if schema compatibility allows.
- Database: use a reviewed compensating migration; do not delete migration history or reset production.
- Secrets: rotate immediately and update all environments when exposure is suspected.
- Data: restore from a verified backup only with explicit incident authorization and a written recovery plan.

## Operational ownership

Before production, assign owners for deployments, Supabase migrations, secrets, cron failures, Auth recovery, backups, monitoring, and incident response.
