# Known Issues

## Platform operations

- No first System Admin has been provisioned (`platform_admins` is empty by design). The control center remains inaccessible until the owner explicitly approves an existing active Auth user UUID.
- Platform Audit Center PDF export remains future work; CSV and Excel use the same filters with a 5,000-row safety cap.

## Critical

No unresolved application-critical defect was reproduced in the 2026-07-20 hardening verification. Historical secret rotation remains an operational action because repository history cannot prove whether prior example values were revoked.

## High

### Automated coverage has no CI gate

Playwright end-to-end coverage is committed and passes in Chrome and Edge, but no CI workflow executes it. Unit tests and isolated service/database integration tests are still absent.

### Dependency audit findings

The latest audit reports 35 total findings. Production scope contains 4 affected packages: moderate PostCSS plus high Next.js/Sharp and `xlsx` findings. npm currently reports no safe in-range fix for `xlsx` or the bundled Next.js dependencies and suggests an invalid framework downgrade. Do not run `npm audit fix --force`.

## Medium

### Visible placeholders remain

- `/register` displays placeholder content.
- Admin dashboard activity and system-status cards contain placeholders.
- Settings and attendance screens expose “future” placeholder panels.
- Announcement body input describes a future rich-text editor.

These should be completed, removed, or explicitly accepted before production.

### Security Advisor retains nine warnings

Eight authenticated `SECURITY DEFINER` helpers remain executable because middleware, Storage/RLS, notification visibility, and caller-derived audit/usage telemetry require them. Their predicates derive identity from `auth.uid()` and expose no service-role inputs, but each should remain under review. Supabase leaked-password protection is also disabled. Migrations `0031`–`0032` removed the prior anonymous-definer warnings and unnecessary schema-version definer privilege.

### Repository-wide formatting check fails

Prettier reports 353 files. A scoped formatting baseline is required; bulk formatting should not be mixed with behavior changes.

### Local Supabase stack cannot run without Docker Desktop

The Supabase CLI is installed, but schema dump/local stack commands requiring Docker fail until Docker Desktop is installed. Linked remote query, migration, lint, and type generation commands work.

## Low

### Lint warnings

Lint passes with 5 raw `<img>` optimization warnings for dynamic/user-provided media. Unused variable/import warnings are resolved.

### Edge browser unavailable on the current workstation

The 46-check Playwright suite retains its Edge project and the preceding foundation build passed it, but Edge is no longer installed on this workstation. `playwright install msedge` was attempted on 2026-07-22 and requires elevated installer privileges. All 23 Chrome production-build checks pass; rerun the Edge project after workstation installation.

### PowerShell npm shim

The machine execution policy blocks `npm.ps1`. Use `npm.cmd` in PowerShell or adjust policy through approved workstation administration.

### Offline queue is browser-local

Queued attendance actions use local storage and can be lost when browser storage is cleared. Failed items have limited user recovery controls.

### Generated/local artifacts exist

`.codex-dev.log`, `tsconfig.tsbuildinfo`, `.next/`, and `supabase/.temp/` are local/generated artifacts and must not be treated as product source or committed accidentally.
