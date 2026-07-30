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

### Local Supabase connectivity blocks authenticated attendance verification

During Phase 4, both credential-redacted anonymous and service-role REST probes failed before receiving an HTTP response. Brave could launch, load the PWA manifest, enforce the signed-out attendance boundary, and verify mobile overflow, but the login render could not complete its company-setup lookup. Full check-in, checkout, GPS, selfie, duplicate, and error-path verification remains blocked until external connectivity and the isolated QA contract are available. This is an environment/infrastructure limitation; no production data should be used as a substitute.

### Edge coverage is optional

The baseline uses bundled Chromium. Set `PLAYWRIGHT_INCLUDE_EDGE=true` only on a workstation/runner with Edge installed (or provide `EDGE_EXECUTABLE_PATH`). Edge remains supplemental coverage and does not block portable baseline checks.

### PowerShell npm shim

The machine execution policy blocks `npm.ps1`. Use `npm.cmd` in PowerShell or adjust policy through approved workstation administration.

### Offline queue is browser-local

Queued attendance actions use local storage and can be lost when browser storage is cleared. Failed items have limited user recovery controls.

### Generated/local artifacts require routine cleanup

`.next/`, `tsconfig.tsbuildinfo`, Playwright output, and Supabase CLI state are locally generated and must not be treated as product source or committed. Checkpoint cleanup removed tracked/runtime logs and disposable verification output while preserving the verified migration backup archives and required Supabase link metadata.
