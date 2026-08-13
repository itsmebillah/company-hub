# Roadmap

Last reconciled: 2026-08-13

Status labels describe implementation truth: **COMPLETE**, **IN PROGRESS**, **PLANNED**, **FUTURE**, or **BLOCKED**. Product direction is detailed in [PRODUCT_VISION_2027.md](PRODUCT_VISION_2027.md).

## Completed foundation

- **COMPLETE — Phase 4.1 Google Sheets:** migration `0044`, governed Holidays contract, tenant-bound destinations, durable retries, deterministic batched projection, reconciliation, and Updates-based failure health.

- **COMPLETE — Production hardening:** tenant authorization, RLS, private media, schema telemetry, responsive/PWA foundations, and release automation.
- **COMPLETE — Integration foundation:** separate Drive OAuth and Sheets service-account identities, bounded API retries, redacted provider errors, explicit resource IDs, and self-cleaning verification.
- **COMPLETE — Phase 4.0.3 attendance media:** migration `0043`, provider-neutral metadata, transactional outbox, leased retries, idempotent Drive recovery, secure reads, historical backfill, and verified 72-hour cache cleanup.

## Next integration milestone

### Durable Google Sheets synchronization — COMPLETE

- Holidays is the approved first low-risk projection with immutable UUID row keys and an explicit field allowlist.
- Migration `0044` extends the durable integration outbox with leased retries and recoverable terminal failures.
- The adapter validates protected headers, batches targeted writes, clears duplicates/deletions, and reconciles drift.
- Employees, Leave, and Attendance remain gated on separate privacy and domain-owner approval.

## Reliability and governance — PLANNED

- Confirm historical credential rotation and formal Google account recovery ownership.
- Approve media/reporting privacy classification, retention, deletion, consent, incident response, workbook access, and protected-range ownership.
- Establish the isolated authenticated-QA project and lower-level unit/service/database tests.
- Reconcile historical migration reproducibility in an isolated Supabase project.
- Add structured redacted correlation, integration health, and actionable alerting.
- Establish a scoped formatting baseline and compatibility-tested dependency maintenance.

## Product Phase 5: duty-bound live location — PLANNED

- Use native Android background location as the preferred direction; document any web/PWA mode as foreground-only.
- Start tracking only after successful check-in and stop immediately at checkout.
- Add tenant-scoped current location, immutable route history, replay, accuracy, geofence events, adaptive intervals, bounded offline replay, and supported mock-location signals.
- Approve privacy, consent, labor policy, retention, deletion, battery, device-matrix, and incident controls before schema work.

Detailed specification: [docs/LIVE_LOCATION_TRACKING.md](docs/LIVE_LOCATION_TRACKING.md).

## Employee native application — FUTURE

- Build a Flutter Android client that reuses the existing backend, Auth, roles, business rules, Drive, Sheets, release metadata, and security model.
- Preserve Company Hub branding while following native Android interaction, permissions, accessibility, and lifecycle patterns.
- Support controlled signed-APK distribution first and a future Play Store path.
- Add trusted optional and mandatory updates backed by signed artifacts, checksums, and minimum-supported-version metadata.

## Internal operational messaging — PLANNED

- Add lightweight Company Admin-to-employee threads, replies, unread/read state, and notifications.
- Automatically expire and delete messages after 30 days.
- Keep the feature tenant-isolated, storage-minimal, rate-limited, and explicitly non-archival.

## Smart Admin experience — PLANNED

- Surface only actionable Drive, Sheets, queue, retry, cleanup, freshness, or database problems through a small Updates indicator.
- Keep the main dashboard free of persistent healthy-system metrics.
- Hide birthday and work-anniversary cards when counts are zero; link visible cards to relevant employee lists.

## Scale and analytics — FUTURE

- Add pagination/cursors and bounded generation to all large lists, exports, and reporting projections.
- Measure Sheets quotas, row volume, refresh duration, concurrency, and governance limits.
- Introduce a governed warehouse/lakehouse and semantic metrics layer only when measured thresholds justify it.
- Add data export/deletion processes, retention compliance, accessibility audits, and broader device matrices.

Items need an owner and acceptance criteria in [BACKLOG.md](BACKLOG.md) before implementation. Completed milestones belong in [CHANGELOG.md](CHANGELOG.md), not as unchecked future work.
