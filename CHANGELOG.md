# Changelog

This project follows a Keep-a-Changelog-style record. Versioning is not yet formalized beyond package version `0.1.0`.

## Unreleased

### Changed

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
