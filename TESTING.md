# Testing Strategy

## Current state

Platform Control Center verification additionally covers regular Admin denial from `/platform`, explicit System Admin access, company isolation for `/admin/audit`, global-disable precedence, company overrides, direct-route 404 enforcement, navigation/card removal, denial-event creation, and daily usage increments. Automated tests must use a disposable platform-admin grant removed in `finally`; never auto-promote a production user.

The 2026-07-22 production-mode run passed the focused System Admin responsive matrix, full Company Admin route matrix, company feature-disable enforcement, and all 12 public/signed-out/PWA/accessibility Chrome checks. The full combined Chrome suite exceeded the command execution window once; its affected Platform tests were rerun directly and passed. Edge remains unavailable on this workstation as documented in project state.

Playwright is committed under `tests/e2e/` with Chrome and Edge projects. The 42-check production-build suite verifies public routes, signed-out redirects/API denial, Admin and Employee login/session/logout, role routing, major route rendering, Quick Link custom-image/favicon/built-in/default fallback priority, card navigation, validated image upload and cleanup, 320/360/375/390/414/768/1024px layouts, attendance file selection and limits, temporary Storage lifecycles, exports, PWA caching, Realtime, and axe WCAG A/AA scans. CI and unit/service integration suites remain absent.

## Existing verification commands

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run format:check
npm.cmd run build
npm.cmd run test:e2e
./node_modules/.bin/supabase.cmd db lint --linked --level warning
./node_modules/.bin/supabase.cmd db advisors --linked --type security
```

## Target test pyramid

### Unit tests

Prioritize pure validation/mapping utilities:

- Employee ID normalization, hierarchy rules, and manager cycles.
- Resource/announcement validation and permission mapping.
- Attendance distance/time/work-mode policy calculations.
- Leave date overlap/status transitions.
- Import parsing, normalization, duplicate detection, and mapping.
- Date/timezone/media/storage-path helpers.

### Service integration tests

Run against an isolated Supabase project or disposable database:

- Bootstrap and partial-failure rollback.
- Employee/Auth creation and cleanup.
- Company isolation and role authorization.
- RLS default denial and notification visibility.
- Storage owner/Admin policies and private bucket behavior.
- Realtime delivery under an authenticated employee.
- Attendance check-in/out uniqueness, GPS validation, and snapshots.
- Leave approval/cancellation and notifications.
- Import batch idempotency and orphan cleanup.
- Celebration idempotency and cron authorization.

All integration fixtures must be uniquely named and removed in `finally` cleanup. Never use real employee data.

### End-to-end tests

Committed smoke coverage handles non-destructive runtime paths. Remaining paths requiring isolated fixtures are:

1. Fresh-project bootstrap → Admin dashboard.
2. Admin creates employee → employee login → password change.
3. Admin creates category/resource/permission → employee sees only allowed resource.
4. Attendance permission denial and successful check-in/out.
5. Leave request → Admin approval → employee notification.
6. Announcement targeting and realtime notification.
7. CSV/XLSX import preview and failure handling.
8. Mobile navigation, dark mode, offline queue, and PWA install affordances.

## Manual matrix until automation exists

For every changed workflow verify:

- Happy path.
- Required/invalid/duplicate input.
- Unauthenticated, inactive, wrong-role, and cross-company access.
- Empty/loading/error/offline states.
- Mobile and desktop layouts; light/dark and keyboard navigation.
- Retry, partial failure, rollback, and cleanup.
- Logs and responses contain no secrets/internal identity fields.

## CI quality gate

A pull request should eventually require:

1. Deterministic install (`npm ci` after lockfile stabilization).
2. Prettier check.
3. ESLint with an agreed warning policy.
4. Typecheck.
5. Unit/integration tests with coverage thresholds on critical services.
6. Production build.
7. Migration/static SQL checks and secret scanning.
8. Preview smoke tests for release branches.

## Test data policy

- Use `example.invalid` emails and random identifiers.
- Never trigger real email/push recipients from tests.
- Do not test destructive backup/reset commands against the linked production project.
- Record any residual test rows as an incident and clean them explicitly.
