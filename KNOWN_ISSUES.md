# Known Issues

## Platform operations

- No first System Admin has been provisioned (`platform_admins` is empty by design). The control center remains inaccessible until the owner explicitly approves an existing active Auth user UUID.
- Platform Audit Center PDF export remains future work; CSV and Excel use the same filters with a 5,000-row safety cap.

## Critical

No unresolved application-critical defect was reproduced in the 2026-07-20 hardening verification. Historical secret rotation remains an operational action because repository history cannot prove whether prior example values were revoked.

## High

### Browser coverage is not part of the automatic release gate

The automatic release workflow runs install, lint, typecheck, build, migration parity, database lint, and production HTTP verification. Full authenticated Playwright coverage is still workstation-run because the linked data fixtures are not isolated for CI. Unit tests and isolated service/database integration tests remain absent.

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

### Edge browser unavailable on the current workstation

The 48-check Playwright suite retains its Edge project and the preceding foundation build passed it, but Edge is no longer installed on this workstation. `playwright install msedge` was attempted on 2026-07-22 and requires elevated installer privileges. All 24 Chrome production-build checks pass; rerun the Edge project after workstation installation.

### PowerShell npm shim

The machine execution policy blocks `npm.ps1`. Use `npm.cmd` in PowerShell or adjust policy through approved workstation administration.

### Offline queue is browser-local

Queued attendance actions use local storage and can be lost when browser storage is cleared. Failed items have limited user recovery controls.

### Generated/local artifacts require routine cleanup

`.next/`, `tsconfig.tsbuildinfo`, Playwright output, and Supabase CLI state are locally generated and must not be treated as product source or committed. Checkpoint cleanup removed tracked/runtime logs and disposable verification output while preserving the verified migration backup archives and required Supabase link metadata.
