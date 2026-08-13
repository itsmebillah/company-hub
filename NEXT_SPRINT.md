# Next Sprint Handover

Checkpoint date: 2026-08-13

Status: planning handover only; no item authorizes implementation, migration, deployment, or an external-resource change.

## Completed baseline

- Production version `v0.3.0` and migrations through `0043` are the current baseline.
- Runtime `get_app_schema_version()` reports `0043`; the next migration is `0044`.
- Attendance media uses provider-neutral attachment metadata, a transactional outbox, expiring leases, retries, idempotent Google Drive recovery, authorized reads, historical backfill, and verified 72-hour Supabase cache cleanup.
- Google Drive is the permanent attendance-selfie archive. Supabase Storage is the temporary private recovery cache.
- Google Sheets service-account authentication, API access, and self-cleaning verification exist, but no production dataset is synchronized.
- Pull-request quality and automatic production-release workflows are committed.
- Current state, plan, status, architecture, risks, roadmap, backlog, audit, README, and product vision are reconciled.

## Recommended next milestone

### Durable Google Sheets synchronization — PLANNED

1. Approve a low-risk Holidays dataset contract, field allowlist, keys, company scope, timezone, deletion behavior, protected ranges, and freshness SLA.
2. Design forward-only migration `0044` or later for durable reporting events/runs, reusing proven lease/retry/idempotency patterns without overloading the media-only contract.
3. Add bounded deterministic Sheets upserts, schema/header validation, quotas, tombstones, and protection against overwriting curated ranges.
4. Add a server-only worker, authenticated schedule, replay/recovery, reconciliation, and actionable Updates health.
5. Prove outage independence, duplicates, stale leases, deletion, tenant isolation, row drift, no-op reruns, and rollback in an isolated environment.

## Parallel quality gates

- Establish isolated authenticated QA accounts, mutation opt-in, cleanup monitoring, and lower-level service/database tests.
- Confirm historical credential rotation and formal Google/privacy governance ownership.
- Perform compatibility-tested dependency maintenance; never run `npm audit fix --force`.
- Reconcile historical migration reproducibility in an isolated project.
- Establish the repository formatting baseline in a separate mechanical change.

## Planned after the integration milestone

- Product Phase 5 duty-bound live location, preferring native Android background tracking and treating web/PWA as foreground fallback.
- Lightweight internal operational messaging with verified 30-day deletion.
- Smart Updates-based system health and conditional birthday/anniversary cards.
- Future Flutter Android employee application reusing the existing backend and security model.

See [PROJECT_PLAN.md](PROJECT_PLAN.md), [ROADMAP.md](ROADMAP.md), and [PRODUCT_VISION_2027.md](PRODUCT_VISION_2027.md).
