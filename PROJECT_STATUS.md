# Project Status

Last updated: 2026-08-13

Production version: `v0.4.0`

Current schema version: `0044`

This file is the concise milestone view. See [PROJECT_STATE.md](PROJECT_STATE.md) for technical evidence and [PROJECT_PLAN.md](PROJECT_PLAN.md) for delivery gates.

## Completed

- **COMPLETE — Phase 4.1 Google Sheets:** governed Holidays projection, migration `0044`, durable enqueue/leases, deterministic batched writes, retry recovery, reconciliation, tenant-bound configuration, and actionable terminal-failure Updates.

- **COMPLETE — Phase 0:** technical audit and architecture documentation.
- **COMPLETE — Phase 1:** existing-system stabilization and usability hardening.
- **COMPLETE — Phase 2:** testing, QA, dependency, security, and release foundations.
- **COMPLETE — Schema alignment:** migrations through `0044`, authoritative project linkage, generated types, and runtime schema telemetry at `0044`.
- **COMPLETE — Google foundation:** Drive OAuth, Sheets service-account access, restricted-resource verification, bounded retries, redacted errors, and self-cleaning verification.
- **COMPLETE — Phase 4.0.3 attendance media:** transactional outbox, atomic leases, idempotent Drive recovery, retry processing, secure Company Admin delivery, verified 72-hour Supabase cache retention, cleanup records, and historical selfie backfill.
- **COMPLETE — Production release automation:** install, lint, typecheck, build, database connection validation, migration parity, database lint, production HTTP verification, release-history synchronization, and GitHub Releases.

## Current production truth

Google Drive is the permanent attendance-selfie archive. Supabase Storage is a private temporary recovery cache retained for 72 hours after verified Drive synchronization. Attendance persistence remains independent of Drive availability.

All three historical selfie references were verified in restricted Drive at milestone completion. Migration `0044` and runtime `get_app_schema_version()` agree on schema version `0044`.

## Current integration milestone

- **COMPLETE — Durable Google Sheets synchronization:** the governed Holidays dataset uses durable enqueue/lease/retry behavior, bounded idempotent upserts, deletion semantics, reconciliation, quiet health, terminal Updates alerts, and isolated unit tests.
- Durable Holidays reporting is active. Supabase writes remain independent of Google, healthy state is quiet, and Employees, Leave, and Attendance remain out of scope until separate privacy allowlists are approved.

## Planned product milestones

- **PLANNED — Product Phase 5 live location:** duty-bound tracking, with native Android background location preferred and the web/PWA limited to an accurately described foreground fallback. See [docs/LIVE_LOCATION_TRACKING.md](docs/LIVE_LOCATION_TRACKING.md).
- **PLANNED — Internal messaging:** lightweight tenant-isolated threads with replies, read state, and verified deletion after 30 days.
- **PLANNED — Smart Admin experience:** actionable integration health inside Updates and conditional birthday/anniversary cards.
- **FUTURE — Flutter Android employee client:** reuse the existing backend, security model, business rules, and product identity. See [PRODUCT_VISION_2027.md](PRODUCT_VISION_2027.md).

## Active gates

- Renew the production Google Drive OAuth consent/refresh token, then re-verify all four stored selfie references and cache-cleanup recovery. Phase 4.1 Sheets and Brave gates passed, but the broader production regression gate remains open until Drive authentication is restored.

- Prove the isolated authenticated-QA environment and cleanup discipline.
- Approve Sheets data contracts, privacy allowlists, protected ranges, freshness SLA, and operational ownership.
- Resolve or formally accept dependency advisories through compatibility-tested maintenance; never force a breaking audit fix.
- Complete credential rotation confirmation, security-helper review, formatting baseline, and lower-level automated coverage.
- Reconcile the historical migration baseline in an isolated project before claiming declarative schema reproducibility.
