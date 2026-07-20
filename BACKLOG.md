# Engineering Backlog

This backlog is ordered by risk and production value. Items require an owner and acceptance criteria before implementation.

## P0 — Release blockers

- **AUTHZ-001:** Add throwing Admin/permission guards to every privileged server action, route handler, and service. Add company predicates to all service-role ID reads/mutations and verify wrong-role/cross-company denial.
- **AUTH-003:** Replace Employee-ID initial passwords with random activation/reset credentials and enforce first-login password rotation for created/imported employees.
- **PWA-001:** Remove authenticated page HTML from service-worker caches, purge legacy page caches, and verify account switching/offline behavior cannot reveal a prior session.
- **SEC-001:** Replace populated values in `.env.example` with safe placeholders and rotate any affected Supabase keys.
- **OPS-001:** Link the authenticated Vercel CLI to the intended project; configure Preview and Production variables.
- **AUTH-001:** Create the real first Admin and verify recovery/password ownership.
- **TEST-001:** Add a test runner and critical Auth/authorization/attendance/import tests.
- **CI-001:** Add pull-request checks for format, lint, typecheck, tests, and build.
- **DEP-001:** Triage 33 npm audit findings and upgrade or accept each risk.

## P1 — Reliability and security

- **OBS-001:** Add structured, redacted server logging and production error monitoring.
- **AUTH-002:** Decide whether `/register` is invitation-based, employee-claim registration, or removed.
- **SEC-002:** Review whether storage authorization helpers should move to a non-exposed schema to eliminate remaining advisor warnings.
- **SEC-004:** Revoke anonymous execution of `can_receive_notification`, review all three exposed `SECURITY DEFINER` helpers, and reduce the current four advisor warnings without breaking storage/realtime policies.
- **SEC-003:** Add rate limiting/abuse protection for login, registration, notification tracking, and cron endpoints.
- **API-001:** Return an explicit authentication failure from notification tracking instead of `204` when no current employee context exists.
- **DB-001:** Add automated migration drift and security-advisor checks.
- **OPS-002:** Document and test backup restoration and disaster recovery.
- **DATA-001:** Define retention for activity logs, notification events, import staging, and storage objects.

## P2 — Quality and product completion

- **UI-001:** Replace admin dashboard activity/system-status placeholders.
- **UI-002:** Remove or implement settings and attendance “future” panels.
- **TEST-002:** Add Playwright smoke tests for login, bootstrap, admin navigation, attendance, leave, and resources.
- **A11Y-001:** Run axe/manual keyboard and screen-reader audits.
- **QA-001:** Establish and enforce a scoped Prettier baseline; the current repository-wide check reports 353 files.
- **PERF-001:** Add pagination/cursor limits to large exports and operational lists.
- **OFFLINE-001:** Add user controls to inspect, retry, or discard failed offline attendance items.
- **NOTIF-001:** Decide whether an external push provider is required.
- **DOC-001:** Add employee-document and leave-attachment lifecycle UI or remove unused buckets until needed.
- **DOC-002:** Add feature READMEs for celebrations, device onboarding, offline sync, and PWA, and remove/update the disconnected `home-login` documentation.

## P3 — Enhancements

- Leave balance/accrual rules.
- Attendance correction/approval workflow.
- Rich announcement editor and sanitization model.
- Advanced analytics and scheduled reports.
- Multi-company administration beyond current company isolation.

Completed items should move to [CHANGELOG.md](CHANGELOG.md), not remain checked off indefinitely.
