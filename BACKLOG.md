# Engineering Backlog

This backlog is ordered by risk and production value. Items require an owner and acceptance criteria before implementation.

## P0 — Release blockers

- **SEC-001:** Rotate any Supabase credential that may have appeared in repository history; safe placeholders are now committed.
- **CI-001:** Add pull-request checks for format, lint, typecheck, tests, and build.
- **DEP-001:** Replace or formally accept the production `xlsx` and bundled Next.js/PostCSS/Sharp high advisories.

## P1 — Reliability and security

- **LOCATION-001:** Product Phase 5 live location tracking. Decide native
  background service versus foreground-only web behavior; approve privacy,
  consent, retention, and labor-policy controls; then design tenant-isolated
  tracking sessions, immutable route history, current-location projection,
  realtime admin map, and geofence events. See
  [the feature specification](docs/LIVE_LOCATION_TRACKING.md).

- **PLATFORM-001:** Explicitly provision the first approved System Admin in `platform_admins`; migration `0030` deliberately does not auto-promote a company Admin.

- **OBS-001:** Add structured, redacted server logging and production error monitoring.
- **AUTH-002:** Decide whether controlled invitation/employee-claim registration should be introduced; unsupported `/register` requests currently return to login.
- **SEC-002:** Review whether storage authorization helpers should move to a non-exposed schema to eliminate remaining advisor warnings.
- **SEC-004:** Revoke anonymous execution of `can_receive_notification`, review all three exposed `SECURITY DEFINER` helpers, and reduce the current four advisor warnings without breaking storage/realtime policies.
- **SEC-003:** Add rate limiting/abuse protection for login, registration, notification tracking, and cron endpoints.
- **DB-001:** Add automated migration drift and security-advisor checks.
- **OPS-002:** Document and test backup restoration and disaster recovery.

## P2 — Quality and product completion

- **TEST-002:** Extend Playwright with destructive-flow coverage using isolated fixtures: bootstrap, employee creation/import, attendance submission, leave approval, and targeted announcements.
- **A11Y-001:** Run axe/manual keyboard and screen-reader audits.
- **QA-001:** Establish and enforce a scoped Prettier baseline; the current repository-wide check reports 353 files.
- **PERF-001:** Add pagination/cursor limits to large exports and operational lists.
- **OFFLINE-001:** Add user controls to inspect, retry, or discard failed offline attendance items.
- **NOTIF-001:** Decide whether an external push provider is required.
- **DOC-001:** Add employee-document and leave-attachment lifecycle UI or remove unused buckets until needed.
- **DOC-002:** Add feature READMEs for celebrations, device onboarding, offline sync, and PWA, and remove/update the disconnected `home-login` documentation.

## P3 — Enhancements

- Unique-user feature analytics and configurable usage-retention windows.

- Leave balance/accrual rules.
- Attendance correction/approval workflow.
- Rich announcement editor and sanitization model.
- Advanced analytics and scheduled reports.
- Multi-company administration beyond current company isolation.

Completed items should move to [CHANGELOG.md](CHANGELOG.md), not remain checked off indefinitely.
