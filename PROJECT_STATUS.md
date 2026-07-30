# Project Status

Last updated: 2026-07-31
Production version: `0.2.0`

This file tracks milestone completion and active delivery work. See
`PROJECT_STATE.md` for the detailed technical inventory and quality signals.

## Completed milestones

- Phase 0: technical audit and architecture documentation.
- Phase 1: existing-system stabilization and usability hardening.
- Phase 2: testing, QA, dependency, security, and release foundations.
- Schema alignment: migrations through `0042`, authoritative project linkage,
  runtime schema telemetry, and local/remote parity.
- Phase 4 foundation: attendance workflow hardening, provider-neutral selfie
  storage contracts, automation event contracts, and conditional persistence.
- Google infrastructure foundation: operational-account OAuth offline access for
  Drive, service-account Sheets access, restricted-resource verification,
  end-to-end temporary upload/metadata synchronization, and cleanup.

## Active milestone

Phase 4 activation is in progress. The production release workflow is being
hardened with credential-redacted Session pooler validation. Attendance still
uses Supabase Storage until the attachment metadata and transactional outbox
migration is reviewed and explicitly approved.

## Next milestone gates

- Complete the production release workflow and synchronized GitHub Release.
- Prepare the attachment/outbox migration and rollback plan for explicit review.
- Activate the Drive selfie provider only after schema approval and full
  attendance success, validation, authorization, cleanup, and Brave coverage.
- Activate durable Sheets synchronization only after retry, idempotency, tenant
  isolation, and operational recovery behavior are verified.
