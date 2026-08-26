# Script Index

Run project scripts through the corresponding `npm run` command where one is
defined. Scripts redact secrets by design, but commands that access Supabase,
Google, Render, Vercel, or GitHub still require the correct approved environment
and authorization.

## Workstation and configuration

- `bootstrap-workstation.ts` — orchestrates portable workstation restoration.
- `create-portable-bundle.ts` — creates an externally stored SOPS/age bundle.
- `setup-local.ts` — imports allowlisted local configuration.
- `doctor.ts` and `local-config-doctor.ts` — report redacted readiness.
- `validate-portable-environment.ts` — validates tools and environment isolation.
- `verify-portable-workflow.ts` — exercises encrypted round-trip restoration.
- `scan-secrets.mjs` — scans changed files for credential patterns.

## Google integrations

- `authorize-google-drive.ts` and `verify-google-drive-app-authorization.ts`
- `configure-google-sheets-reporting.ts`
- `process-attendance-media.ts` and `verify-attendance-media.ts`
- `process-google-sheets-sync.ts`, `run-google-sheets-verification.ts`, and
  `verify-google-sheets-sync.ts`
- `verify-google-integrations.ts`

Processing scripts can mutate their explicitly configured environment. Verify
the target before running them; Production operations require separate approval.

## QA and release verification

- `verify-mobile-api-qa.ts` — isolated mobile API verification.
- `verify-brave.mjs` — browser verification.
- `validate-supabase-db-url.mjs` — database connection guard.
- `publish-release.mjs` — guarded release publication; never run implicitly.

Reusable implementation helpers remain in `*-core.ts` and `*-io.ts`; they are
source modules, not disposable scripts.
