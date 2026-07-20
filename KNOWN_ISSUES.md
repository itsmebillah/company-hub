# Known Issues

## Critical

### Privileged services do not consistently enforce Admin authorization

Most Admin-facing actions/services establish only active employee/current company context before using the service-role client. Route-group layout checks do not authorize direct server-action or route-handler invocation, and several ID-based mutations are not company-scoped. Treat this as a release blocker for wrong-role and cross-company access.

### Employee ID is used as the initial password

Employee creation and import create confirmed Auth users with the normalized Employee ID as the password. There is no mandatory first-login rotation. Replace this with random activation/reset credentials before real employee accounts are created.

### The service worker caches authenticated HTML

`public/sw.js` caches personalized employee and Admin pages. Browser Cache Storage can survive logout/account switching, creating offline cross-session disclosure risk. Cache only immutable public assets and purge the legacy page cache.

### `.env.example` contains populated secret-like values

The example environment file has populated Supabase key fields rather than safe placeholders. Treat any service-role credential ever committed there as compromised: sanitize the file, rotate the key in Supabase, update local/Vercel secrets, and review repository history. Never paste key values into issues or logs.

## High

### No automated tests or CI

There are no committed unit, integration, or end-to-end tests and no CI workflow. Current confidence comes from lint, typecheck, build, database catalog checks, and manual/disposable integration verification.

### Dependency audit findings

The latest `npm install` reports 33 findings: 1 low, 14 moderate, and 18 high. Do not run `npm audit fix --force` without reviewing framework and CLI compatibility.

## Medium

### Migrated Auth users require password resets

The supported Supabase Admin API does not expose source password hashes or allow caller-assigned Auth UUIDs. All 17 identities were recreated with remapped Auth UUIDs and cryptographically random migration credentials, while employee links were updated. Users cannot retain their old passwords and must complete a controlled password reset/activation process; Admin recovery ownership must be validated before launch.

### Visible placeholders remain

- `/register` displays placeholder content.
- Admin dashboard activity and system-status cards contain placeholders.
- Settings and attendance screens expose “future” placeholder panels.
- Announcement body input describes a future rich-text editor.

These should be completed, removed, or explicitly accepted before production.

### Security Advisor retains four warnings

`is_active_employee`, `is_admin_user`, and `can_receive_notification` are externally executable `SECURITY DEFINER` functions in `public`. The advisor reports three authenticated warnings plus an anonymous-execution warning for `can_receive_notification`. Anonymous RPC execution returned `false` because its predicate derives identity from `auth.uid()`, but the unnecessary grant/exposure should still be removed or relocated.

### Unauthenticated notification tracking returns success

`POST /api/notifications/track` returns `204` when no current employee exists because the service silently returns. No row is mutated, but the API contract hides authentication failure and weakens monitoring.

### Repository-wide formatting check fails

Prettier reports 353 files. A scoped formatting baseline is required; bulk formatting should not be mixed with behavior changes.

### Local Supabase stack cannot run without Docker Desktop

The Supabase CLI is installed, but schema dump/local stack commands requiring Docker fail until Docker Desktop is installed. Linked remote query, migration, lint, and type generation commands work.

## Low

### Lint warnings

Lint passes with 13 warnings, primarily raw `<img>` usage and unused variables/imports.

### PowerShell npm shim

The machine execution policy blocks `npm.ps1`. Use `npm.cmd` in PowerShell or adjust policy through approved workstation administration.

### Offline queue is browser-local

Queued attendance actions use local storage and can be lost when browser storage is cleared. Failed items have limited user recovery controls.

### Generated/local artifacts exist

`.codex-dev.log`, `tsconfig.tsbuildinfo`, `.next/`, and `supabase/.temp/` are local/generated artifacts and must not be treated as product source or committed accidentally.
