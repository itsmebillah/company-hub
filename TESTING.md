# Testing Strategy

## Current state

The 2026-07-26 P0 stabilization run passed all 25 Chrome checks against an optimized `next start` runtime. It verifies the System Admin mobile Me/logout panel, Company Admin and Employee profile Account/logout controls, the `/register` login redirect, all platform routes including Release Management, lazy broken-image fallback for Quick Links, and the existing role/feature/storage/realtime/responsive/accessibility matrix. The local runner now uses the canonical `localhost` origin so middleware redirects retain host-only Auth cookies. Redacted profile before/after evidence is stored under `docs/screenshots/stabilization/`.

Platform Control Center verification additionally covers Company Admin and employee denial from `/platform`, explicit System Admin access across six responsive routes, cross-company people rendering, audited initial-password reset, platform-settings persistence, company isolation for `/admin/audit`, global-disable precedence, company overrides, direct-route/API denial, navigation/card removal, denial-event creation, and daily usage increments. Automated tests must use a disposable platform-admin grant removed in `finally`; never auto-promote a production user.

The 2026-07-26 P0 mobile regression audit used real Chrome with an Android mobile user agent, touch input, portrait viewports at 320/360/375/390/414px, and a 667x375 landscape viewport. Company Admin, Employee, and a disposable System Admin were exercised through Dashboard, all four navigation panels, Theme/Profile/Notification controls where available, scrolling, and PWA assets. Durable assertions verify exact FAB centering, a reserved center lane, unclipped navigation labels, non-wrapping header actions, and zero horizontal overflow. Before/after evidence is preserved under `docs/screenshots/ui-regression/`.

The 2026-07-22 production-mode run passed the focused System Admin responsive matrix, full Company Admin route matrix, company feature-disable enforcement, and all 12 public/signed-out/PWA/accessibility Chrome checks. The full combined Chrome suite exceeded the command execution window once; its affected Platform tests were rerun directly and passed. Edge remains unavailable on this workstation as documented in project state.

Playwright is committed under `tests/e2e/` with Chrome and Edge projects. The suite verifies public routes, signed-out redirects/API denial, Company Admin and Employee login/session/logout, role routing, tenant employee denial, company password reset, feature hiding/direct denial, the invariant four-item navigation shell and 64–72px Dashboard FAB, major route rendering, Quick Link visual priority and cleanup, 320/360/375/390/414/768/1024px layouts, attendance media, Storage, exports, PWA, Realtime, and axe WCAG A/AA scans. Lower-level unit/service integration suites remain absent; the production release workflow now supplies the deployment quality gate.

Feature-control regression must restore every platform/company state in `finally`. Verify platform-disabled/company-enabled resolves disabled, platform-locked enabled ignores company state, and all seven primary product features disappear from menus/cards/settings and reject direct access. Shared `/resources` routes are denied only when Resources, Quick Links, and Knowledge Hub are all disabled.

Release tests should use a disposable future version, validate optional and mandatory dialogs plus `/releases`, then delete both release and receipt fixtures. Branding tests must preserve and restore the company's original settings.

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
