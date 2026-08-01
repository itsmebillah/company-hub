# Project Status

Last updated: 2026-07-31
Production version: `0.3.0`

This file tracks milestone completion and active delivery work. See
`PROJECT_STATE.md` for the detailed technical inventory and quality signals.

## Completed milestones

- Phase 0: technical audit and architecture documentation.
- Phase 1: existing-system stabilization and usability hardening.
- Phase 2: testing, QA, dependency, security, and release foundations.
- Schema alignment: migrations through `0043`, authoritative project linkage,
  and runtime schema telemetry.
- Phase 4 foundation: attendance workflow hardening, provider-neutral selfie
  storage contracts, automation event contracts, and conditional persistence.
- Google infrastructure foundation: operational-account OAuth offline access for
  Drive, service-account Sheets access, restricted-resource verification,
  end-to-end temporary upload/metadata synchronization, and cleanup.
- Phase 4 attendance media activation: transactional outbox, atomic leases,
  idempotent Drive recovery, retry processing, secure admin media delivery,
  verified three-day cache retention, and historical selfie backfill.
- Production release automation: Session pooler validation, migration parity,
  database lint, production HTTP verification, synchronized database release
  history, and GitHub Release `v0.2.0` are passing.

## Active milestone

Phase 4 Drive activation is complete in the authoritative environment. All three
historical attendance selfie references are verified in restricted Drive,
metadata is synchronized, the outbox is empty, and their Supabase objects remain
available until the verified 72-hour retention deadline.

## Next milestone gates

- Observe the first scheduled production retry and the first eligible cache
  cleanup; cleanup must verify permanent Drive readability before deletion.
- Activate durable Sheets synchronization only after retry, idempotency, tenant
  isolation, and operational recovery behavior are verified.

## Planned milestone

Product Phase 5 adds duty-bound live location tracking after Phase 4. Its native
background versus foreground-only web architecture, privacy/retention policy,
and migration require explicit approval before implementation. See
`docs/LIVE_LOCATION_TRACKING.md`.
