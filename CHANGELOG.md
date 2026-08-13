# Changelog

This project follows Keep a Changelog and Semantic Versioning. Production deployment success automatically synchronizes this file with database and GitHub release history.

## Unreleased

### Documentation

- Reconciled project state, status, plan, architecture, audit, risks, roadmap,
  backlog, README, and engineering guidance with production version `v0.3.0`
  and runtime schema version `0043`.
- Added `PRODUCT_VISION_2027.md` with explicit current, planned, future, and
  optional boundaries for durable Sheets sync, Flutter Android, duty-bound live
  location, secure APK updates, internal messaging, smart health, and dashboard
  visibility.
- Recorded durable Google Sheets synchronization as the next integration
  milestone and documented its exact missing event, worker, reconciliation,
  privacy, observability, and isolated-test controls.
- Updated dependency risk to the 2026-08-13 audits without applying breaking or
  forceful dependency changes.

## [0.3.0] - 2026-07-31

### Added

- Added migration `0043` with tenant-scoped attendance attachment metadata, a
  transactional outbox, atomic leased job claims, bounded exponential retry,
  cleanup audit records, RLS, indexes, triggers, and historical backfill.
- Added an OAuth-backed permanent Drive storage adapter with attachment-level
  idempotency keys and upload recovery after partial failures.
- Added an authenticated daily recovery worker, immediate post-response delivery,
  secure Company Admin media proxy, Drive sync badges, and permanent-file links.
- Added operational processors and credential-redacted verification for Drive
  metadata, retained cache objects, outbox completion, and retention timing.

### Changed

- Attendance saves remain independent of Drive availability. Supabase Storage is
  now a temporary recovery cache and is retained for exactly three days after a
  verified Drive sync before eligible cleanup.
- Synchronized all three historical attendance selfies to the restricted
  operational Drive folder with no failures; a second worker pass was a no-op.

### Security

- Attendance media remains private. Company Admin previews are tenant-authorized
  server streams, credentials never reach the browser, and cleanup never removes
  the permanent Drive file, attendance record, or attachment metadata.

### Planned

- Added the Product Phase 5 live-location specification covering duty-bound
  lifecycle, immutable routes, current-location projection, realtime/geofence
  boundaries, privacy/retention controls, battery/offline behavior, and the
  required native-versus-foreground architecture decision. No tracking code or
  migration was introduced.

### Infrastructure alignment

- Added a credential-redacted Supabase Session pooler preflight to production
  releases so malformed, wrong-project, placeholder, DNS, and TCP failures are
  distinguished before migration verification runs.
- Verified the complete production release workflow through GitHub Release
  `v0.2.0` and corrected Windows-pipeline BOM encoding in encrypted GitHub
  Supabase secrets without exposing their values.
- Recorded the pre-activation production diagnosis that attendance selfies then
  persisted only to Supabase Storage, establishing the boundary later completed
  by migration `0043` and the active Drive worker.

- Linked the Supabase CLI to the authoritative Company Hub project and verified
  remote migration history through `0041`, live audit-object removal, and a
  clean database lint result.
- Applied non-destructive migration `0042` to advance runtime schema telemetry
  without rewriting the already-applied `0041` migration; linked history,
  schema diff, database lint, and live RPC verification now agree on `0042`.
- Added an inactive, server-only split Google authentication foundation: OAuth
  2.0 offline access for operational-account Drive uploads and the existing
  service account for Sheets. It includes bounded API retries,
  upload/write/readback cleanup, safe environment placeholders, a credential-
  redacted verifier, and a state-validated one-time local authorization helper.
- Verified the restricted operational Drive folder end to end using OAuth
  offline access, verified Sheets synchronization remains service-account based,
  removed all temporary test artifacts, and configured the OAuth credentials as
  Sensitive Production variables without storing credential files in Git.

### Phase 4 attendance automation foundation

- Audited check-in, checkout, GPS/geofence policy, selfie evidence, duplicate prevention, tenant isolation, offline replay, and existing test coverage.
- Added the pre-activation provider-neutral attendance selfie storage contract
  and private Supabase Storage adapter; the later `0043` milestone activated
  Google Drive delivery.
- Hardened selfie uploads with current-date and phase-state checks, supported MIME/signature validation, immutable unique paths, and write-time ownership validation.
- Bounded attendance notes/device metadata and stopped accepting client-provided addresses as location evidence.
- Made checkout persistence conditional on company, employee, and incomplete state to prevent concurrent overwrite.
- Added `AttendanceCreated`, `AttendanceUpdated`, and `AttendanceCompleted` contracts with best-effort notification handling so secondary failures do not misreport successful attendance writes.
- Extracted server-time, late-status, and working-minute rules into a focused workflow validation service.
- Documented the future transactional outbox, attachment metadata, sync/retry fields, and current offline/orphan-media limitations without creating or applying a migration.

### Phase 1 stabilization

- Removed non-functional Employee "More actions" controls from desktop and mobile employee lists.
- Made Employee activation/deactivation controls wait for the real server result, disable during the pending operation, and avoid manufactured success responses.
- Required tenant-scoped Employee update/status mutations to confirm that a row was changed before reporting success.
- Aligned custom-role manager validation between Employee forms and hierarchy management while preserving self/circular hierarchy rejection.
- Bounded Employee list page sizes from URL input and improved the Employee modal with native required fields, autocomplete, pending-state controls, dialog semantics, sticky controls, mobile viewport sizing, and safe-area spacing.
- Recorded the approved operational use of the company's existing Google account; ownership migration is not required, and temporary public sharing must be reverted before production use.

### Phase 2 infrastructure hardening

- Replaced the Playwright branded-Chrome dependency with portable bundled Chromium and made Edge an explicit optional project.
- Changed Playwright server readiness to the database-independent web manifest and split smoke, public, and authenticated commands.
- Added explicit QA project/account validation, project-ref matching, and mutation opt-in so authenticated tests cannot silently select arbitrary linked-project users.
- Added `.env.test.example`, Node/npm runtime pinning, and a secret-free pull-request quality workflow plus a protected manual authenticated-QA job.
- Lazy-loaded the `xlsx` parser when an Employee Import file is selected to reduce initial route work without changing import behavior.
- Reduced Employee Import first-load JS from approximately 232 kB to 122 kB in the production build.
- Documented the Phase 2 migration, dependency, security, performance, QA, and technical-debt decisions. Subsequent live verification confirmed that migration `0041` was applied without advancing runtime schema telemetry; applied migration `0042` corrects that omission additively.

### Removed

- Retired the Activity Log and Platform Audit features, including their routes, exports, navigation, service hooks, dashboard consumers, settings, database types, and tables through migration `0041`.

### Changed

- Made all mutation, authentication, authorization, reporting, release, and platform-control workflows independent of logging side effects.
- Standardized employee resource cards to four mobile columns with two-line titles, removed the duplicate Profile shortcut, and kept Logout directly on the shared profile page.

### Documentation

- Added the frozen sprint handover with completed work, deliberately postponed scope, unresolved monitoring items, and the exact recommended continuation order.

### Fixed

- Added a clear, touch-friendly Account/logout card to Employee and Company Admin profiles and verified the existing System Admin logout inside the mobile Me panel.
- Removed production-facing placeholder content from registration, company settings, attendance settings/details, reports, and announcement guidance; unsupported public registration now returns to login.
- Removed dead placeholder dashboard components and eliminated misleading “Prepared” preference badges.
- Replaced raw company branding images with dimensioned Next images to eliminate lint warnings and reduce layout-shift risk.
- Aligned the local browser runner with the canonical application origin, hardened cold-start waits and selectors, and expanded production-runtime coverage to 25 passing Chrome checks.
- Advanced compatible patch dependencies to Next.js 15.5.22, Supabase SSR 0.12.3, Supabase JS 2.110.8, and Vercel CLI 56.5.0.
- Corrected the active Dashboard FAB's double horizontal translation, centered it in the notch, reduced its visual footprint to 64px, and reserved a center lane so navigation icons and labels no longer crowd or overlap it.
- Kept Notification, Theme, and Profile controls aligned in one right-side header row from 320px upward; mobile logout remains available through the Me menu while the desktop header action is preserved.
- Made asynchronous company-logo rendering start from the Company Hub fallback so invalid or delayed branding never exposes a broken image.
- Added production-browser geometry regression coverage for FAB centering, the navigation center lane, clipped labels, header action wrapping, and all supported responsive widths.

## [0.2.0] - 2026-07-26

### Added

- Added one configuration-driven Mobile Navigation v2 framework for System Admin, Company Admin, and every employee role: four fixed category controls, a branded floating Dashboard FAB, role-aware menu contents, combined update badge, safe-area support, haptics, reduced-motion handling, and responsive layouts.
- Added hierarchical platform-first feature control with company `inherit`, `enabled`, and `disabled` states plus System Admin control over whether company overrides are allowed.
- Added automatic release history, optional and mandatory update dialogs, PWA asset activation, public release notes, System Admin release controls, maintenance mode, and a deployment-success GitHub workflow with quality gates.
- Added least-privilege GitHub Actions secret provisioning: the migration quality gate uses a target database URL and does not require a Supabase account access token.
- Added migrations `0038_hierarchical_feature_control.sql`, `0039_release_management.sql`, and `0040_maintenance_status_invoker.sql`.

### Changed

- Standardized existing company branding as runtime CSS, logo, favicon, browser theme-color, manifest, navigation, focus, and action styling without replacing the existing company-settings model.
- Upgraded Quick Links to a three/four-column mobile launcher and added Company Admin long-press management with image-aware permanent deletion cleanup.
- Removed disabled feature metrics, settings shortcuts, and settings panels so the Company Admin grid reflows without hidden-module gaps.

### Security

- Centralized multi-feature route denial through the platform-first feature resolver and retained action-level authorization, company scope, RLS, and Storage path enforcement.
- Added published-only release visibility and per-user release-receipt RLS without exposing deployment secrets or internal logs.

### Company Admin architecture

- Renamed the tenant authority from `Admin` to `Company Admin` without changing stable `/admin/*` URLs or the completed System Admin control plane.
- Added middleware Company Admin authorization and effective-feature checks inside privileged Server Actions, notification actions, media actions, and export/template handlers.
- Replaced broad administrator Storage mutation policies with company-prefixed shared-media and same-company employee-object authorization; Company Admins cannot mutate global `system-assets`.
- Scoped Company Admin storage metrics and announcement upload paths to the authenticated company.
- Protected the Company Admin authority role from deactivation and reserved platform role names from tenant role creation.
- Added migrations `0036_company_admin_architecture.sql` and `0037_company_admin_helper_privileges.sql` and advanced schema telemetry to `0037`.
- Expanded browser coverage for Company Admin tenant isolation, reset, disabled-feature denial, routes, and responsive layouts.

### Fixed

- Selected a WCAG-aware black or white foreground for stored company brand colors, preventing low-contrast branded badges and controls.
- Preserved signed-out `401` semantics on notification tracking while retaining feature-disabled `404` denial for authenticated callers.
- Kept platform-disabled features completely absent from Company Admin feature controls.
- Kept Lucide navigation components on the client side and passed only serializable feature keys through Server Component boundaries, removing the dashboard runtime Application Error found during production-mode regression testing.
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

- Added migration `0035_platform_architecture_v2.sql` with the default-deny singleton `platform_settings` table, archived platform company status, and schema telemetry advancement.
- Added migration `0030_platform_control_center.sql` with explicit platform administrators, 14 feature definitions, company overrides, audit telemetry, daily usage aggregation, a security-invoker overview, default-deny RLS, and caller-derived authorization RPCs.
- Added migration `0031_platform_security_and_schema_version.sql` to advance runtime schema telemetry and explicitly revoke anonymous execution from notification/schema helpers.
- Added migration `0032_schema_version_invoker.sql` so constant-only runtime schema telemetry no longer executes with definer privileges.
- Added migration `0033_platform_company_update.sql` for atomic company-name synchronization, schema telemetry, and centralized historical activity import.
- Added migration `0034_fix_platform_company_update.sql` to correct the company-name RPC argument ambiguity without rewriting applied history.
- Added employee, role, action, status, date, company, feature, and keyword audit filters plus bounded CSV/Excel exports.

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
