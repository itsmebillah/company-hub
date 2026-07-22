# Project State

Last verified: 2026-07-22

## Summary

Company Hub is a functional Next.js/Supabase operations portal with employee, company Admin, and explicit System Admin workflows. The Platform Control Center now provides cross-company health, company lifecycle controls, platform/company feature gates, usage metrics, and centralized audit visibility without conflating tenant and global authority.

The quality-hardening baseline is deployable: privileged mutation boundaries, private attendance media, PWA caching, schema-version telemetry, and cross-browser smoke coverage are verified. CI, dependency advisories, historical secret rotation, and broader unit/integration coverage remain release-governance work.

## Verified baseline

- Next.js 15 App Router, React 19, strict TypeScript, Tailwind CSS 4.
- Node.js 24.16.0 and npm 11.13.0 used for the latest verification.
- Supabase CLI 2.109.1 and Vercel CLI 56.3.2 installed as dev dependencies.
- Supabase project `jjfktbgfwvekhlvyjlww` linked and active.
- Migrations `0001` through `0032` applied remotely with exact local/remote parity.
- 26 public application tables with RLS enabled; platform-control tables are default-deny to browser roles.
- Fourteen platform features are cataloged. Existing companies inherit enabled modules and `future_modules` starts disabled.
- No System Admin is auto-provisioned. `platform_admins` remains empty until the owner explicitly approves an existing active Auth identity.
- Exact restored content parity for 1,748 application rows across all 22 tables; all application IDs and hierarchy references were preserved.
- Nine storage buckets, 11 storage-object policies, four checksum-verified objects, and notification realtime publication.
- 17 Auth identities recreated with matching email, metadata, confirmation state, and employee linkage. All 17 passwords are synchronized to the canonical Employee-ID-derived policy and individually verified; no Auth emails changed and no duplicate users were created.
- `npm install`, lint, typecheck, and production build pass.
- Playwright: 42 production-build checks are defined across Chrome and Edge, including Admin/Employee login, session restore, logout, role redirects, major routes, Quick Link visual priority and image lifecycle, PWA assets, private Storage, Realtime, attendance attachments, exports, signed-out API denial, responsive widths from 320px through 1024px, and WCAG A/AA scans. The 2026-07-22 build passes all 21 Chrome checks; Edge execution is currently blocked because Edge is not installed and its installer requires workstation elevation. The preceding foundation build passed both projects.
- Local production runtime boots cleanly with Supabase network access. `/`, `/setup`, and `/login` return 200; unauthenticated protected routes redirect to login; migrated Admin and employee sessions render their dashboards; non-Admin access to the Admin dashboard is redirected.
- Platform regression: a disposable explicit System Admin rendered all four control-center routes without horizontal overflow at 320/360/375/390/414/768/1024px; cleanup restored `platform_admins` to zero. A disposable company Attendance override hid navigation and returned HTTP 404 on direct access, then restored the prior state. Final Chrome checks pass for these flows, the complete Admin route matrix, and all 12 public/signed-out/PWA/accessibility checks.

## Implemented product areas

- Employee ID login, first-admin bootstrap, session and role routing.
- Employee, role, hierarchy, bulk import, profile, and password management.
- Resource categories, resources, audience permissions, and an employee portal with visual Quick Links. Quick Links support uploaded PNG/JPG/SVG/WebP artwork, non-blocking origin favicons, named built-in icons, and a default fallback without changing existing resource records.
- Targeted announcements, notification summaries/tracking, browser/native notifications, realtime delivery.
- GPS-aware attendance, locations, work modes, attendance policy/settings, offline queue, selfies, admin attendance, reports, CSV/XLSX/PDF exports.
- Leave types, employee requests, approval/rejection/cancellation.
- Holiday calendars and events.
- Company branding/settings, dashboard summaries, audit activity, celebrations cron.
- Platform Control Center with company status, two-level feature controls, usage, security/login/activity audit events, pagination, and company-scoped audit access.
- Responsive admin/employee shells, theme support, PWA install flow, service worker, permission onboarding.

## Current quality signals

- Lint: zero errors, 5 raw-image optimization warnings; all unused-code warnings were removed.
- Typecheck: zero errors.
- Production build: successful.
- Prettier check: failed; 353 files currently differ from configured formatting.
- Database lint: no schema errors.
- Runtime schema status uses the least-privilege `get_app_schema_version()` contract from migration `0029`; the invalid `supabase_migrations` PostgREST request and `PGRST106` log are removed.
- Supabase Security Advisor: no RLS-disabled or anonymous-definer warnings. Nine warnings remain: eight intentionally authenticated caller-derived/RLS helper RPCs and the project-level leaked-password-protection setting.
- npm audit: 35 total findings. Production scope contains 4 affected packages (1 moderate and 3 high) through Next.js/PostCSS/Sharp and `xlsx`; npm reports no safe in-range fix and suggests an invalid Next.js downgrade. Do not force-fix.
- Automated tests: Playwright route, Auth, authorization, mobile, PWA, Storage, attendance, export, and Realtime coverage is committed. Unit/service integration coverage is still absent.
- CI/CD workflow: none committed.
- Vercel CLI: authenticated and linked to `company-hub`; all five required environment variable names are present for Production and Preview. Values were not printed during verification.
- Production deployment for the canonical password flow is Ready at `company-hub-zeta.vercel.app`; public pages return 200 and protected routes redirect to login.
- Authenticated Admin/employee runtime: canonical-password login, session restoration, logout, dashboard rendering, all major route surfaces, middleware denial, and non-Admin role denial pass in Chrome and Edge.

## Release blockers

See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for details. The highest-priority blockers are:

1. Rotate any Supabase credential that may have appeared in Git history; `.env.example` is now sanitized.
2. Add CI for install, lint, typecheck, Playwright, build, migration parity, and secret scanning.
3. Replace or formally accept the unresolved `xlsx` and Next.js/PostCSS advisories.
4. Formally review the eight intentionally authenticated definer helpers, decide the leaked-password-protection policy, and finish the repository formatting baseline.

## Canonical references

- Scope: [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md)
- Feature status: [FEATURES.md](FEATURES.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Data model: [DATABASE.md](DATABASE.md)
- Operational readiness: [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
