# Engineering Backlog

Last reconciled: 2026-08-13

Phase 4.1 note: SHEETS-001 through SHEETS-006 are complete (Holidays contract, migration `0044`, batched adapter, leased worker, secure schedule, retry/recovery, reconciliation, quiet health, terminal Updates alerts, tests, and production verification tooling). Future dataset expansion requires new privacy allowlists.

Items are ordered by production risk and value. Every item requires an owner, acceptance criteria, and explicit implementation authorization.

## P0 — Release and governance blockers

- **SEC-001:** Confirm rotation of any Supabase credential that may have appeared in repository history.
- **DEP-001:** Perform compatibility-tested dependency maintenance. Validate the available `nanoid` fix, plan a supported Next.js/PostCSS/Sharp upgrade, and replace or formally accept `xlsx` risk because no upstream fix is available. Never use `npm audit fix --force`.
- **QA-001:** Establish the isolated Supabase QA project, synthetic identities, mutation opt-in, deterministic cleanup, and protected authenticated test secrets.
- **GOV-001:** Approve Google account recovery owners, credential rotation, media consent/retention/deletion, incident response, workbook access, field allowlists, protected ranges, freshness SLA, and failure-notification ownership.

## P1 — Next integration milestone

- **SHEETS-001:** Approve a governed Holidays reporting contract with stable IDs, company scope, typed columns, timezone, deletion semantics, privacy classification, and reconciliation rules.
- **SHEETS-002:** Design forward-only migration `0044` or later for durable reporting events/runs. Reuse attendance-media lease/retry patterns without overloading media-only payload constraints.
- **SHEETS-003:** Expand `GoogleSheetsClient` with bounded batch operations, deterministic row upserts, header/schema validation, quota-aware behavior, and protected raw-range safeguards.
- **SHEETS-004:** Add the server-only worker, authenticated schedule, expiring leases, retry/dead-letter behavior, replay, tombstones, watermarks, reconciliation, and rollback runbook.
- **SHEETS-005:** Surface actionable freshness, failed-sync, retry, and drift state inside Updates; healthy systems should not occupy dashboard space.
- **SHEETS-006:** Prove success, duplicate replay, stale lease, provider outage, deletion, tenant isolation, row drift, and no-op reruns in isolated tests before production activation.

## P1 — Reliability and security

- **PLATFORM-001:** Explicitly provision the first approved System Admin in `platform_admins`; migrations deliberately do not auto-promote a Company Admin.
- **OBS-001:** Add structured redacted logging, correlation IDs, and production error monitoring for Auth, cron, imports, Storage, Drive, Sheets, and offline replay.
- **SEC-002:** Review exposed authenticated `SECURITY DEFINER` helpers and leaked-password protection without breaking RLS, Storage, Realtime, or middleware contracts.
- **SEC-003:** Add rate limiting and replay protection for login, notification tracking, cron, and future integration/location endpoints.
- **DB-001:** Reconcile historical migration reproducibility in an isolated project and automate safe drift/advisor checks.
- **OPS-002:** Document and test backup restoration, disaster recovery, integration credential recovery, and incident ownership.

## P1 — Product Phase 5

- **LOCATION-001 — DECIDED:** Flutter Android foreground-location service is the production mode; web/PWA is a foreground-only fallback with no screen-off guarantee.
- **LOCATION-002 — DESIGN RECORDED, LIMITED OWNER DECISIONS OPEN:** Duty-only collection, lifecycle, own-route access/download, existing-model Admin and supervisor visibility, manual Admin stop, adaptive sampling, native battery behavior, bounded technical offline handling, disclosure, RLS, and permission-denial behavior are locked. Concrete retention/deletion values where technically required, notice acknowledgement, correction/deletion requests, Android device matrix, and incident ownership remain `DECISION REQUIRED`.
- **LOCATION-003:** After approval, design tenant-isolated sessions, immutable route history, current-location projection, admin live map, replay, geofence events, adaptive intervals, bounded offline queue, and supported mock-location signals. See [docs/LIVE_LOCATION_TRACKING.md](docs/LIVE_LOCATION_TRACKING.md).

## P2 — Product and experience

- **MSG-001:** Design lightweight internal operational messaging with Admin messages, employee replies, unread/read state, notification integration, tenant isolation, rate limits, and verified automatic deletion after 30 days.
- **DASH-001:** Hide birthday and work-anniversary cards when counts are zero; visible cards link to the corresponding employees.
- **HEALTH-001:** Keep healthy integration metrics out of the main dashboard and use a small Updates indicator only for actionable failures.
- **ANDROID-001:** Define the Flutter client architecture, shared API/auth contracts, local encrypted cache, offline queues, branding system, accessibility, and native release process.
- **ANDROID-002:** Design controlled signed-APK distribution plus trusted optional/mandatory update checks using backend release metadata, signed artifacts, and checksums.
- **OFFLINE-001:** Add inspect/retry/discard controls for failed browser-local attendance items and make queued-versus-submitted status explicit.
- **AUTH-002:** Decide whether controlled invitation or employee-claim registration is required; unsupported public registration currently returns to login.
- **DOC-001:** Define employee-document and leave-attachment lifecycle or retire unused storage surfaces until approved.

## P2 — Quality and maintainability

- **TEST-001:** Add unit and service/database integration coverage for authorization, attendance, retry/lease behavior, cleanup, and reporting contracts.
- **TEST-002:** Extend isolated Playwright coverage for bootstrap, employee import, attendance, leave approval, announcements, and integration failure states.
- **A11Y-001:** Run keyboard, screen-reader, axe, and native accessibility audits.
- **FORMAT-001:** Establish a scoped Prettier baseline; do not mix repository-wide formatting with behavior work.
- **PERF-001:** Add cursor pagination and bounded generation to large operational lists, exports, and future reporting batches.
- **DEBT-001:** Split oversized services/components only behind behavior-preserving tests.

## P3 — Future and optional

- Leave balance/accrual rules.
- Attendance correction/approval workflow.
- Rich announcement editing with an approved sanitization model.
- Advanced analytics and scheduled reports.
- Warehouse/semantic layer after measured Sheets thresholds are exceeded.
- External push provider beyond browser notification foundations.
- Play Store distribution after native signing, privacy, support, and release readiness.
- AI assistance only after purpose, access, audit, and privacy controls are approved.

Completed work moves to [CHANGELOG.md](CHANGELOG.md). Strategic direction is maintained in [PRODUCT_VISION_2027.md](PRODUCT_VISION_2027.md).
