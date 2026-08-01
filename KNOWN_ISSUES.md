# Known Issues

## Platform operations

- No first System Admin has been provisioned (`platform_admins` is empty by design). The control center remains inaccessible until the owner explicitly approves an existing active Auth user UUID.

## Critical

No unresolved application-critical defect was reproduced in the 2026-07-20 hardening verification. Historical secret rotation remains an operational action because repository history cannot prove whether prior example values were revoked.

## High

### Browser coverage is not part of the automatic release gate

Pull requests now run install, lint, typecheck, build, and database-independent Chromium smoke coverage. The automatic release workflow additionally runs migration parity, database lint, and production HTTP verification. Full authenticated Playwright coverage remains a protected manual QA job until the isolated project, explicit synthetic accounts, secrets, and cleanup monitoring are configured. Unit tests and isolated service/database integration tests remain absent.

### Dependency audit findings

The latest audit reports 44 total findings, primarily through development-only Vercel/ESLint tooling. Production scope contains 4 high findings through bundled Next.js/PostCSS/Sharp and `xlsx`. npm currently reports no safe compatible fix for `xlsx` or the bundled Next.js dependencies and suggests an invalid framework downgrade. Do not run `npm audit fix --force`.

## Medium

### Historical migrations do not fully reproduce the linked schema

`supabase db diff --linked` completes but emits a broad destructive diff across
historical foreign keys, policies, views, functions, indexes, and the `pg_net`
extension. Migration history and database lint pass through `0043`; this is a
pre-existing canonical-history reproducibility gap, not an `0043` runtime
failure. Never apply the generated destructive diff. Reconcile the historical
migration baseline in an isolated project before claiming declarative parity.

### Isolated production authorization event requires monitoring

One `POST /login` request returned 500 immediately after the 2026-07-26 deployment, with the bundled stack originating at the `requireCompanyAdmin` guard. The event could not be reproduced: subsequent complete Company Admin and Employee login, dashboard, authorization, profile, and logout checks passed, followed by an empty 30-minute production error-log check. Preserve request/action identifiers if it recurs and diagnose against that evidence; do not weaken the guard or make a speculative authorization change.

### Security Advisor retains reviewed warnings

Authenticated `SECURITY DEFINER` helpers remain executable because middleware, Storage/RLS, notification visibility, and caller-derived audit/usage telemetry require them. Their predicates derive identity from `auth.uid()` and expose no service-role inputs, but each should remain under review. Supabase leaked-password protection is also disabled. Migrations `0031`–`0032` and `0040` removed unnecessary anonymous-definer execution.

### Repository-wide formatting check fails

Prettier reports 353 files. A scoped formatting baseline is required; bulk formatting should not be mixed with behavior changes.

### Local Supabase stack cannot run without Docker Desktop

The Supabase CLI is installed, but schema dump/local stack commands requiring Docker fail until Docker Desktop is installed. Linked remote query, migration, lint, and type generation commands work.

## Low

### Local browser installation is required

Playwright now uses its portable Chromium project rather than branded Chrome, but each workstation must run `npx playwright install chromium` once. Authenticated coverage additionally requires the isolated QA environment contract. A missing browser or QA configuration is an infrastructure failure, not an application regression.

### Windows Playwright web-server teardown can hang

The Phase 2 Chromium smoke assertions both pass, but the Playwright process does not exit after its managed Next production server is stopped on this Windows workstation. The runner now uses the direct Next CLI, a manifest readiness probe, and graceful shutdown; the remaining hang requires targeted Playwright/Windows process-tree investigation. Validate the new Ubuntu quality workflow separately before making it required.

### Isolated QA accounts block authenticated attendance mutation verification

Authoritative Supabase connectivity, migration parity, declarative schema parity, and runtime schema-version reporting are verified. Brave can launch, load the PWA manifest, enforce the signed-out attendance boundary, and verify mobile overflow. Full check-in, checkout, GPS, selfie, duplicate, and error-path verification still requires the isolated QA account/project contract; production identities and data must not be used as substitutes.

Attendance selfies remain intentionally bound to
`SupabaseAttendanceSelfieStorage`. The OAuth Drive client is credentialed and
independently verified, but it is not called by selfie upload, attendance
persistence, or the process-local automation handlers. There is no durable sync
queue. Activating Drive safely requires the approved attachment metadata/outbox
migration, private media delivery, retry and idempotency behavior, and orphan
cleanup.

### Edge coverage is optional

The baseline uses bundled Chromium. Set `PLAYWRIGHT_INCLUDE_EDGE=true` only on a workstation/runner with Edge installed (or provide `EDGE_EXECUTABLE_PATH`). Edge remains supplemental coverage and does not block portable baseline checks.

### PowerShell npm shim

The machine execution policy blocks `npm.ps1`. Use `npm.cmd` in PowerShell or adjust policy through approved workstation administration.

### Offline queue is browser-local

Queued attendance actions use local storage and can be lost when browser storage is cleared. Failed items have limited user recovery controls.

### Generated/local artifacts require routine cleanup

`.next/`, `tsconfig.tsbuildinfo`, Playwright output, and Supabase CLI state are locally generated and must not be treated as product source or committed. Checkpoint cleanup removed tracked/runtime logs and disposable verification output while preserving the verified migration backup archives and required Supabase link metadata.
