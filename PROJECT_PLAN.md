# Company Hub Project Plan

Status: reconciled after the completed Phase 4.1 durable Google Sheets milestone on 2026-08-13

Authority: Supabase remains the operational source of truth. Google Drive is the permanent attendance-selfie archive, while Google Sheets is the derived Holidays reporting system.

This plan records delivery status and the next approved sequence. It extends, but does not replace, [PROJECT_STATE.md](PROJECT_STATE.md), [PROJECT_STATUS.md](PROJECT_STATUS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md), or [PRODUCT_VISION_2027.md](PRODUCT_VISION_2027.md). A planned item is not authorization to implement, migrate, deploy, or change an external resource.

## Status legend

- **COMPLETE:** implemented and verified in the authoritative environment.
- **IN PROGRESS:** approved work has started but its exit criteria are not complete.
- **PLANNED:** intended next work; implementation has not started or is not authorized.
- **FUTURE:** directional scope requiring later prioritization and design approval.
- **BLOCKED:** cannot safely proceed until the stated dependency is resolved.

## Current architecture

```text
Employee attendance action
          |
          v
Supabase operational record + private Storage recovery cache
          |
          v
Transactional integration_outbox
          |
          v
Leased retry/recovery worker
          |
          v
Restricted Google Drive permanent archive
          |
          v
Verified 72-hour Supabase cache cleanup

Supabase operational data
          |
          v
Durable Google Sheets Holidays projection (ACTIVE)
```

Core rules:

- Attendance persistence never waits for Google Drive or Google Sheets.
- Google outages must not corrupt Supabase or falsely report an operational write as failed.
- External synchronization is asynchronous, idempotent, observable, replayable, and reconcilable.
- Tenant isolation, least privilege, retention, deletion, and redacted errors apply across providers.
- Google Sheets is read-oriented reporting infrastructure, never an operational write authority.
- Provider identifiers and object paths are stored; credentials and signed URLs are not.

## Completed foundation

### Phase 0 - Audit and architecture baseline — COMPLETE

- Audited the repository, documentation, schema history, Google resources, security boundaries, and integration direction.
- Established Supabase as the source of truth and approved the existing company operational Google account and workspace.
- Recorded the provider-neutral media and derived-reporting architecture.

### Phase 1 - Stabilization and governance foundation — COMPLETE WITH OPEN GOVERNANCE ITEMS

- Hardened employee mutations, role hierarchy, form behavior, route behavior, and documentation foundations.
- Restricted production Google resources and separated Drive OAuth from the Sheets service account.
- Retained credential rotation, privacy/retention ownership, and formal access reviews as active operational work.

### Phase 2 - Integration and release foundation — COMPLETE

- Added bounded Google API retries, credential-redacted errors, explicit resource IDs, and self-cleaning verification.
- Added portable Chromium checks, protected authenticated-QA configuration, Node/npm pinning, and pull-request/release workflows.
- Applied schema alignment migrations `0041` and `0042` without rewriting migration history.

### Phase 4.0.3 - Durable attendance media — COMPLETE

Production version: `v0.3.0`

Migration: `0043_attendance_media_sync.sql`

Implemented flow:

1. Attendance stores the operational record and private Supabase cache path.
2. Migration `0043` atomically captures provider-neutral attachment metadata and an outbox event.
3. An immediate post-response attempt and the authenticated scheduled worker claim jobs with expiring leases.
4. The Drive adapter uses attachment-level idempotency metadata and recovers partial uploads.
5. Successful delivery stores the permanent Drive identity and starts the 72-hour cache-retention period.
6. Cleanup re-verifies Drive readability before deleting only the Supabase cache object.
7. Attendance rows, attachment metadata, and permanent Drive files are not deleted by cache cleanup.

All three historical selfie references were synchronized and verified in restricted Drive, with an empty outbox at milestone completion. This milestone does not implement Google Sheets reporting.

## Next integration milestone

### Durable Google Sheets synchronization — COMPLETE

Implemented contract:

- Server-only service-account authentication is implemented.
- The approved workbook ID is explicit configuration.
- Spreadsheet metadata, temporary tab creation, raw value write/readback, and cleanup are verified by `npm run verify:google`.
- Shared Google API retry and error-redaction infrastructure is available.

Expansion boundaries:

- Holidays is the only approved production dataset and uses the explicit columns documented in `features/reporting-sync/README.md`.
- Employees, Leave, and Attendance have no approved field allowlist or consumer access contract.
- Migration `0044`, the leased worker, secured schedule, reconciliation, failure health, and isolated unit coverage implement the durable contract.

### Completed work

1. **Governed workbook contract**
   - Approve the initial low-risk domain, preferably Holidays.
   - Define stable UUID keys, company scope, row grain, typed columns, timezone, privacy classification, deletion semantics, and refresh SLA.
   - Create protected machine-owned raw tabs separate from curated formulas and dashboards.

2. **Durable event contract**
   - Design migration `0044` or later as a forward-only additive change.
   - Reuse the proven lease/retry/idempotency patterns from attendance media while keeping domain-specific payloads and status transitions explicit.
   - Capture creates, updates, and deletes without making the source mutation depend on Google.

3. **Sheets adapter expansion**
   - Add bounded batch operations, deterministic row lookup/upsert, schema/header validation, and quota-aware retries.
   - Never rewrite an entire workbook for routine incremental changes.
   - Prevent synchronization from overwriting human-owned curated ranges.

4. **Worker and recovery**
   - Add a server-only processor with expiring leases, retry backoff, safe dead-letter behavior, and replay controls.
   - Add an authenticated scheduled route within hosting limits.
   - Keep credentials, raw provider errors, and sensitive row values out of logs.

5. **Reconciliation and observability**
   - Record run start/end, dataset, watermarks, attempted/succeeded/failed counts, schema version, freshness, and bounded error categories.
   - Compare source keys/counts/checksums with the reporting projection and surface unexplained drift.
   - Expose only actionable integration failures through the Updates area; do not add permanent healthy-system dashboard clutter.

6. **Verification and rollout**
   - Test success, validation failure, authorization denial, tenant isolation, outage, retry, duplicate, deletion, stale lease, and cleanup behavior in an isolated environment.
   - Backfill in bounded batches and prove a second run is a no-op.
   - Require domain-owner sign-off before Employees, Leave, or Attendance projections.

Exit criteria: repeatable idempotent synchronization, zero unexplained row drift, visible freshness/failure state, protected raw ranges, approved field allowlists, tested recovery, and no effect on operational writes during a Google outage.

## Planned product phases

### Product Phase 5 - Duty-bound live location — PLANNED

The dedicated specification is [docs/LIVE_LOCATION_TRACKING.md](docs/LIVE_LOCATION_TRACKING.md).
Migration `0045` implements the tracking database core in isolated QA only;
production, collection clients, ingestion APIs, and tracking UI remain inactive.

The approved production direction is a Flutter Android employee client using a
native foreground-location service and the existing backend. The web/PWA is a
foreground-only fallback and must not be represented as capable of guaranteed
screen-off tracking. The decision is recorded in ADR-015. Privacy policy,
notice acknowledgement, concrete retention/deletion values where technically
required, employee correction/deletion requests, device support, and incident
ownership contain explicit `DECISION REQUIRED` items in the Phase 5
specification and must be approved before implementation where they affect the
first release.

### Internal operational messaging — PLANNED

Provide lightweight Admin-to-employee threads with replies, unread/read state, and automatic deletion after 30 days. It is not a permanent archive or a general chat platform. Retention, cleanup, notification, tenant-isolation, and abuse controls must be designed before implementation.

### Smart dashboard and system health — PLANNED

- Hide birthday and work-anniversary cards when their count is zero; visible cards link to the relevant employee list.
- Keep healthy technical metrics out of the main dashboard.
- Surface actionable Drive, Sheets, queue, retry, cleanup, freshness, or database problems as a small indicator in Updates, with details inside that area.

### Native Android employee application — FUTURE

Flutter is the preferred client technology. It must reuse Supabase Auth, the database, existing APIs and business rules, roles, Drive, Sheets, and the current security model. Initial signed-APK distribution may use controlled internal channels while preserving a future Play Store path. See [PRODUCT_VISION_2027.md](PRODUCT_VISION_2027.md).

## Future analytics direction

Google Sheets is the near-term MIS projection, not necessarily the final warehouse. Measured quota pressure, row volume, concurrency, historical complexity, analytical security, or refresh duration may trigger a governed warehouse/lakehouse and semantic metrics layer. Provider-neutral event and data contracts should allow that evolution without weakening operational tables.

## Cross-phase quality gates

Every implementation phase must include:

- Explicit status labels that distinguish current, planned, future, and blocked work.
- Success, validation failure, authorization denial, tenant isolation, provider outage, retry, duplicate, deletion, and cleanup tests where applicable.
- No secrets, internal Auth identities, signed URLs, coordinates, or sensitive payloads in logs or client bundles.
- Bounded payloads and batches, documented quotas, pagination, and selective queries.
- Accessibility, mobile usability, performance, retention, and rollback review.
- Updates to architecture, database, API, security, testing, roadmap, backlog, status, changelog, and feature documentation in the same milestone.
- `npm install`, lint, typecheck, production build, relevant automated tests, migration dry-run/lint/advisors for database changes, and explicit authorization before applying migrations or changing external resources.

## Active decisions and risks

1. Historical Supabase credential rotation remains unconfirmed.
2. The isolated authenticated-QA project/accounts and cleanup monitoring are not complete.
3. Google Sheets field allowlists, protected-range ownership, freshness SLA, and failure-notification ownership require approval.
4. Selfie and future attachment consent, retention, deletion, legal-hold, and incident procedures require formal ownership.
5. Production dependency advisories require compatibility-tested maintenance; `xlsx` currently has no upstream fix.
6. The repository formatting baseline, unit tests, service/database integration tests, and historical migration reproducibility gap remain open.
7. Native Android and the core duty/access/battery/offline boundaries are
   selected. Remaining notice acknowledgement, concrete retention/deletion,
   employee request, device-matrix, and incident-owner decisions require
   explicit approval before the affected Product Phase 5 behavior ships.

## Success measures

- Zero operational writes lost or falsely failed because an external provider is unavailable.
- Zero anonymous or cross-company access to media, reporting rows, messages, or location data.
- Idempotent replay creates no duplicates and reconciliation has no unexplained drift.
- Reporting freshness meets its approved SLA and failures are actionable.
- Retention and deletion propagate predictably and are auditable.
- Employee workflows remain fast, mobile-first, offline-aware, and accessible.
- Documentation never presents planned functionality as implemented.
