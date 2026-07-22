# Changelog

This project follows a Keep-a-Changelog-style record. Versioning is not yet formalized beyond package version `0.1.0`.

## Unreleased

### Fixed

- Rendered each dashboard Quick Link’s configured visual instead of reducing the stored icon to text initials, with graceful broken-image and favicon fallback.
- Portaled the resource form outside the page stacking context so its controls remain clickable above the sticky admin header.
- Raised the Server Action request limit to safely carry validated 5 MB attendance selfies, added immediate client-size feedback, and preserved HEIC/HEIF filename/MIME consistency.
- Removed authenticated HTML from service-worker caching and purged legacy page-cache generations on activation.
- Removed the broken `/notifications` navigation target.
- Made notification tracking return an explicit `401` for signed-out callers.
- Replaced the unsupported `supabase_migrations` PostgREST query with migration `0029` and the restricted `get_app_schema_version()` runtime contract.
- Removed expected attendance-policy validation from error logs and reduced lint warnings from 13 to 7.

### Security

- Added throwing Admin guards to privileged server mutations and explicit role checks to employee export/template route handlers.
- Replaced committed example credentials with safe placeholders; historical credential rotation remains an operational follow-up.
- Verified all 17 migrated credentials without exposing Employee IDs/passwords, private attendance bucket behavior, Realtime, middleware, and wrong-role redirects.

### Added

- Added responsive Quick Link visuals with uploaded PNG/JPG/SVG/WebP artwork, memoized website-origin favicons, named Lucide icons, and a permanent Company Hub placeholder fallback.
- Added authenticated, company-scoped `resource-icons` uploads with size, MIME/signature, SVG-content, retrieval, replacement, cancellation, and unreferenced-object cleanup controls.
- Expanded Playwright and axe configuration to 42 production-build checks across Chrome, Edge, Admin/Employee sessions, Quick Link visual priority and image lifecycle, major routes, all required responsive widths, attendance media, Storage cleanup, exports, API denial, PWA behavior, Realtime, and WCAG A/AA.

### Changed

- Redesigned dashboard Quick Link cards around a centered square visual, touch-friendly spacing, responsive columns, and subtle hover/active motion while reusing existing `icon`, `thumbnail`, and Storage data.
- Documented the Admin leave-approval workflow, including approval-time changes to leave type, dates, and reason with working-day recalculation.
- Centralized the canonical Employee-ID-derived Auth password transformation across login, creation, import, registration, reset-to-initial, and migrated-user synchronization.
- Synchronized and individually verified all 17 migrated Auth users without changing emails or creating duplicate users.
- Verified Admin and employee sessions, dashboards, unauthenticated middleware redirect, and non-Admin authorization redirect using the canonical credential flow.
- Deployed the canonical password flow to Vercel Production and verified the public pages plus protected-route redirects on the live alias.
- Restored the verified cross-account Supabase backup into project `jjfktbgfwvekhlvyjlww`: 1,748 rows across 22 tables, 17 Auth identities, nine Storage buckets, and four checksum-verified objects.
- Preserved all application IDs and remapped the 17 Auth UUID references because the supported Admin API cannot assign source Auth UUIDs or import password hashes.
- Reverified migration parity, constraints, RLS, Storage policies, Realtime, Auth configuration, Admin/employee login, local runtime, lint, typecheck, and production build after migration.
- Reverified the existing Vercel project link and required Production/Preview environment variable names without exposing values.

### Added

- Production engineering documentation set covering product, architecture, database, API, Auth, development, deployment, testing, security, standards, UI/UX, release, backlog, issues, decisions, and contribution workflow.
- Supabase migrations `0026`–`0028` enabling RLS on all application tables, securing storage helper execution, and adding authenticated realtime notification visibility.
- Project-local Supabase and Vercel CLIs.

### Changed

- Migrated environment and repository link to Supabase project `jjfktbgfwvekhlvyjlww`.
- Applied and verified migrations `0001`–`0028` on the new project.
- Updated `.env.local` for the new project; it remains ignored.
- Reconciled project state, backlog, API, Auth, security, and deployment documentation with the repository health audit.

### Security

- Default-denied direct access to all 22 public tables through RLS.
- Scoped employee/Admin notification SELECT for realtime.
- Revoked anonymous execution of privileged storage authorization helpers and bound checks to `auth.uid()`.

## 2026-07-12

### Added

- Employee celebration engine, daily cron generation, dashboard greetings, and one-time daily modal.
- Notification priority/delivery tracking, realtime delivery, native browser notifications, and permission onboarding.
- Attendance working-hours policy, work-mode snapshots, employee work modes, field attendance enhancements, and reporting updates.
- PWA install experience, application status, service worker, and lightweight offline attendance synchronization.
- Mobile-first Admin navigation and refined employee workspace layout.

### Changed

- Refined leave and resource management UI.
- Split and improved Admin dashboard architecture.
- Hardened multi-company context and authorization.

## 2026-07-11

### Added

- Attendance reports and CSV/XLSX/PDF export.
- Admin settings center and dashboard redesign.

### Fixed

- Dashboard, attendance, schema-version, and company-settings integration regressions.

Earlier migrations and feature READMEs describe the foundational Auth, employees, resources, announcements, leave, calendar, storage, and import work. Future releases should add dated entries rather than relying only on Git history.
