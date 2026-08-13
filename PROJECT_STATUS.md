# Project Status

Last updated: 2026-08-13

Production version: `v0.3.0`

Current schema version: `0043`

This file is the concise milestone view. See [PROJECT_STATE.md](PROJECT_STATE.md) for technical evidence and [PROJECT_PLAN.md](PROJECT_PLAN.md) for delivery gates.

## Completed

- **COMPLETE — Phase 0:** technical audit and architecture documentation.
- **COMPLETE — Phase 1:** existing-system stabilization and usability hardening.
- **COMPLETE — Phase 2:** testing, QA, dependency, security, and release foundations.
- **COMPLETE — Schema alignment:** migrations through `0043`, authoritative project linkage, generated types, and runtime schema telemetry at `0043`.
- **COMPLETE — Google foundation:** Drive OAuth, Sheets service-account access, restricted-resource verification, bounded retries, redacted errors, and self-cleaning verification.
- **COMPLETE — Phase 4.0.3 attendance media:** transactional outbox, atomic leases, idempotent Drive recovery, retry processing, secure Company Admin delivery, verified 72-hour Supabase cache retention, cleanup records, and historical selfie backfill.
- **COMPLETE — Production release automation:** install, lint, typecheck, build, database connection validation, migration parity, database lint, production HTTP verification, release-history synchronization, and GitHub Releases.

## Current production truth

Google Drive is the permanent attendance-selfie archive. Supabase Storage is a private temporary recovery cache retained for 72 hours after verified Drive synchronization. Attendance persistence remains independent of Drive availability.

All three historical selfie references were verified in restricted Drive at milestone completion, and the durable media outbox was empty. Migration `0043` and runtime `get_app_schema_version()` agree on schema version `0043`.

## Next integration milestone

- **PLANNED — Durable Google Sheets synchronization:** define a governed low-risk dataset contract, add durable enqueue/lease/retry behavior, bounded idempotent upserts, deletion semantics, reconciliation, freshness/health reporting, isolated tests, and a recovery runbook.
- Current Sheets code is infrastructure only: service-account authentication, API access, raw read/write helpers, temporary tab lifecycle, and self-cleaning verification. No production reporting dataset is synchronized.

## Planned product milestones

- **PLANNED — Product Phase 5 live location:** duty-bound tracking, with native Android background location preferred and the web/PWA limited to an accurately described foreground fallback. See [docs/LIVE_LOCATION_TRACKING.md](docs/LIVE_LOCATION_TRACKING.md).
- **PLANNED — Internal messaging:** lightweight tenant-isolated threads with replies, read state, and verified deletion after 30 days.
- **PLANNED — Smart Admin experience:** actionable integration health inside Updates and conditional birthday/anniversary cards.
- **FUTURE — Flutter Android employee client:** reuse the existing backend, security model, business rules, and product identity. See [PRODUCT_VISION_2027.md](PRODUCT_VISION_2027.md).

## Active gates

- Prove the isolated authenticated-QA environment and cleanup discipline.
- Approve Sheets data contracts, privacy allowlists, protected ranges, freshness SLA, and operational ownership.
- Resolve or formally accept dependency advisories through compatibility-tested maintenance; never force a breaking audit fix.
- Complete credential rotation confirmation, security-helper review, formatting baseline, and lower-level automated coverage.
- Reconcile the historical migration baseline in an isolated project before claiming declarative schema reproducibility.
