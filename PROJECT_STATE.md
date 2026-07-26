# Project State

Last verified: 2026-07-26

## Summary

Company Hub is a functional Next.js/Supabase operations portal with employee, Company Admin, and explicit System Admin workflows. Company Admin is the highest authority inside exactly one company; System Admin remains an explicit global authorization outside tenant roles.

The quality-hardening baseline is deployable: privileged mutation boundaries, private attendance media, PWA caching, schema-version telemetry, and cross-browser smoke coverage are verified. CI, dependency advisories, historical secret rotation, and broader unit/integration coverage remain release-governance work.

## Verified baseline

- Next.js 15 App Router, React 19, strict TypeScript, Tailwind CSS 4.
- Node.js 24.16.0 and npm 11.13.0 used for the latest verification.
- Supabase CLI 2.109.1 and Vercel CLI 56.5.0 installed as dev dependencies.
- Supabase project `jjfktbgfwvekhlvyjlww` linked and active.
- Migrations `0001` through `0040` applied remotely with exact local/remote parity.
- Local migration `0041` removes the retired logging tables, enums, denial-log functions, and retention setting; linked verification and application are pending sufficient Supabase project privileges.
- 29 public application tables with RLS enabled; platform-control and draft release rows are default-deny to browser roles.
- Fourteen platform features are cataloged. Existing companies inherit enabled modules and `future_modules` starts disabled.
- No System Admin is auto-provisioned. `platform_admins` remains empty until the owner explicitly approves an existing active Auth identity.
- Exact restored content parity for 1,748 application rows across all 22 tables; all application IDs and hierarchy references were preserved.
- Nine storage buckets, 11 storage-object policies, four checksum-verified objects, and notification realtime publication.
- 17 Auth identities recreated with matching email, metadata, confirmation state, and employee linkage. All 17 passwords are synchronized to the canonical Employee-ID-derived policy and individually verified; no Auth emails changed and no duplicate users were created.
- `npm install`, lint, typecheck, and production build pass.
- Company Admin uses the canonical `Company Admin` tenant role, middleware authorization, action-level feature checks, tenant-scoped service-role queries, protected password reset, and company-aware Storage policies. `/admin/*` paths remain stable compatibility URLs.

## Implemented product areas

- Employee ID login, first-admin bootstrap, session and role routing.
- Employee, role, hierarchy, bulk import, profile, and password management.
- Resource categories, resources, audience permissions, and an employee portal with visual Quick Links. Quick Links support uploaded PNG/JPG/SVG/WebP artwork, non-blocking origin favicons, named built-in icons, and a default fallback without changing existing resource records.
- Targeted announcements, notification summaries/tracking, browser/native notifications, realtime delivery.
- GPS-aware attendance, locations, work modes, attendance policy/settings, offline queue, selfies, admin attendance, reports, CSV/XLSX/PDF exports.
- Leave types, employee requests, approval/rejection/cancellation.
- Holiday calendars and events.
- Company branding/settings, dashboard summaries, audit activity, celebrations cron.
- Responsive admin/employee shells, theme support, PWA install flow, service worker, permission onboarding.
- A single configuration-driven mobile navigation shell serves every role: four fixed groups plus a separate, centered 64px Dashboard FAB, with a reserved center lane and centralized role and effective-feature filtering.
- Company branding is resolved at the authenticated shell and propagated through shared CSS tokens, logo, metadata, favicon, manifest, and PWA theme color.
- Release Management stores semantic versions, notes, deployment/commit provenance, user receipts, optional/mandatory update policy, and maintenance state. Version `0.2.0` introduces the automated post-deployment publishing workflow.

## Current quality signals

- Lint: zero errors and zero warnings; dynamic company media now uses dimensioned Next images where appropriate.
- Typecheck: zero errors.
- Production build: successful.
- Prettier check: failed; 353 files currently differ from configured formatting.
- Database lint: no schema errors.
- Runtime schema status uses the least-privilege `get_app_schema_version()` contract from migration `0029`; the invalid `supabase_migrations` PostgREST request and `PGRST106` log are removed.
- Supabase Security Advisor: no RLS-disabled or anonymous-definer warnings. Twelve warnings remain: eleven intentionally authenticated caller-derived/RLS helper RPCs and the project-level leaked-password-protection setting.
- npm audit: 44 total findings after current registry advisories; most are development-only Vercel/ESLint transitive findings. Production scope contains 4 high findings through bundled Next.js/PostCSS/Sharp and `xlsx`; npm reports no safe compatible fix and suggests an invalid Next.js downgrade. Do not force-fix.
- Automated tests: Playwright route, Auth, authorization, mobile, PWA, Storage, attendance, export, and Realtime coverage is committed. Unit/service integration coverage is still absent.
- CI/CD workflow: the production `deployment_status` workflow gates release publication on install, lint, typecheck, build, migration parity, database lint, and production HTTP verification. Required repository secrets must be configured before its first run.
- Vercel CLI: authenticated and linked to `company-hub`; all five required environment variable names are present for Production and Preview. Values were not printed during verification.
- Production deployment for the canonical password flow is Ready at `company-hub-zeta.vercel.app`; public pages return 200 and protected routes redirect to login.
- Authenticated Company Admin/employee runtime covers canonical-password login, session restoration, logout, dashboards, major route surfaces, middleware denial, tenant isolation, feature denial, and responsive layouts.
- The P0 stabilization pass removed production-facing placeholder panels, redirects unsupported `/register` access to login, added a clear Account/logout card to Employee and Company Admin profiles, verified System Admin logout in the mobile Me panel, and preserved redacted before/after evidence under `docs/screenshots/stabilization/`.
- The 2026-07-26 checkpoint found no disposable QA companies, resource categories, resources, or platform administrators; migration history remains exactly `0001` through `0040`. The frozen handover and recommended continuation order are recorded in [NEXT_SPRINT.md](NEXT_SPRINT.md).

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
