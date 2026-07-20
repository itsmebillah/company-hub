# Project State

Last verified: 2026-07-20

## Summary

Company Hub is a functional Next.js/Supabase operations portal with substantial admin and employee workflows. The application installs, compiles, builds, and starts successfully against the new Supabase project. The verified old-project backup has been restored into the new project, including application data, Auth identities and metadata, Storage objects, RLS/storage policies, and Realtime configuration.

The project is suitable for continued staging use, but production release remains gated by secret hygiene, automated testing, CI, and resolution or acceptance of dependency/security warnings.

## Verified baseline

- Next.js 15 App Router, React 19, strict TypeScript, Tailwind CSS 4.
- Node.js 24.16.0 and npm 11.13.0 used for the latest verification.
- Supabase CLI 2.109.1 and Vercel CLI 56.3.2 installed as dev dependencies.
- Supabase project `jjfktbgfwvekhlvyjlww` linked and active.
- Migrations `0001`–`0028` applied remotely.
- 22 public application tables with RLS enabled.
- Exact restored content parity for 1,748 application rows across all 22 tables; all application IDs and hierarchy references were preserved.
- Nine storage buckets, 11 storage-object policies, four checksum-verified objects, and notification realtime publication.
- 17 Auth identities recreated with matching email, metadata, confirmation state, and employee linkage. All 17 passwords are synchronized to the canonical Employee-ID-derived policy and individually verified; no Auth emails changed and no duplicate users were created.
- `npm install`, lint, typecheck, and production build pass.
- Local production runtime boots cleanly with Supabase network access. `/`, `/setup`, and `/login` return 200; unauthenticated protected routes redirect to login; migrated Admin and employee sessions render their dashboards; non-Admin access to the Admin dashboard is redirected.

## Implemented product areas

- Employee ID login, first-admin bootstrap, session and role routing.
- Employee, role, hierarchy, bulk import, profile, and password management.
- Resource categories, resources, audience permissions, employee resource portal.
- Targeted announcements, notification summaries/tracking, browser/native notifications, realtime delivery.
- GPS-aware attendance, locations, work modes, attendance policy/settings, offline queue, selfies, admin attendance, reports, CSV/XLSX/PDF exports.
- Leave types, employee requests, approval/rejection/cancellation.
- Holiday calendars and events.
- Company branding/settings, dashboard summaries, audit activity, celebrations cron.
- Responsive admin/employee shells, theme support, PWA install flow, service worker, permission onboarding.

## Current quality signals

- Lint: zero errors, 13 warnings.
- Typecheck: zero errors.
- Production build: successful.
- Prettier check: failed; 353 files currently differ from configured formatting.
- Database lint: no schema errors.
- Admin dashboard runtime logs retain a non-fatal `PGRST106` warning because `SchemaVersionService` cannot query the unexposed `supabase_migrations` schema through PostgREST; CLI migration parity passes.
- Supabase Security Advisor: no RLS-disabled errors; four warnings for externally executable `SECURITY DEFINER` functions. Anonymous execution of `can_receive_notification` is confirmed, although its caller-derived predicate returned `false` anonymously.
- npm audit: 33 findings (1 low, 14 moderate, 18 high).
- Automated tests: none committed.
- CI/CD workflow: none committed.
- Vercel CLI: authenticated and linked to `company-hub`; all five required environment variable names are present for Production and Preview. Values were not printed during verification.
- Production deployment for the canonical password flow is Ready at `company-hub-zeta.vercel.app`; public pages return 200 and protected routes redirect to login.
- Authenticated Admin/employee runtime: canonical-password login, session creation, dashboard rendering, unauthenticated middleware denial, and non-Admin role denial passed. Full browser-based feature regression remains manual because the in-app browser was unavailable during migration verification.

## Release blockers

See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for details. The highest-priority blockers are:

1. Enforce Admin authorization inside every privileged server action, route handler, and service; tenant-scope every service-role ID operation.
2. Stop caching authenticated HTML in the service worker and purge per-session page caches.
3. Sanitize `.env.example` and rotate any credential ever committed there.
4. Add automated tests and CI for Auth, authorization, RLS/storage, attendance, imports, and critical APIs.
5. Review npm audit findings, the four security-advisor warnings, and the formatting baseline.

## Canonical references

- Scope: [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md)
- Feature status: [FEATURES.md](FEATURES.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Data model: [DATABASE.md](DATABASE.md)
- Operational readiness: [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
