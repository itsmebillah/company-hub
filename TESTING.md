# Testing Strategy

## Current state

No automated test files, test runner, browser-test configuration, or CI workflow are committed. Lint, strict typecheck, build, database lint, and manual/disposable integration checks currently provide the only repeatable confidence. This is a production blocker, not an acceptable long-term strategy.

## Existing verification commands

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run format:check
npm.cmd run build
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

Recommended Playwright smoke paths:

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
