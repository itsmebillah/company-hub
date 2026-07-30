# Company Hub Project Plan

Status: planning baseline created during Phase 0 audit on 2026-07-30
Authority: Supabase remains the operational source of truth; Google Drive and Google Sheets are derived supporting systems

Operational assumption approved for Phase 1: Company Hub uses the company's existing operational Google account and Drive/Sheets workspace. No ownership migration is required. Resources are private by default; temporary public sharing is allowed only for development/review and must be reverted and verified afterward.

This plan extends the existing architecture and roadmap. It does not replace [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md), [BACKLOG.md](BACKLOG.md), or [PROJECT_STATE.md](PROJECT_STATE.md), and it does not authorize implementation, migration, deployment, or external-resource changes.

## Existing architecture preserved

Company Hub remains a server-first Next.js App Router application hosted on Vercel and backed by Supabase PostgreSQL, Auth, Storage, RLS, and Realtime. Employee, Company Admin, and System Admin boundaries remain unchanged. Business mutations continue through authenticated server actions/services with current-company resolution and explicit feature authorization.

The long-term extension adds two derived layers:

```text
Employees and Company Admins
          |
          v
Next.js server actions/services
          |
          v
Supabase operational source of truth
   |                         |
   | async reporting events  | async attachment finalization
   v                         v
Google Sheets MIS layer   Google Drive managed media
   |
   v
Curated dashboards and scheduled reports
```

Core rules:

- A Google outage must not corrupt Supabase or silently confirm an incomplete operational write.
- Google Sheets is read-oriented reporting infrastructure, not an operational write authority.
- Google Drive stores selected business media only where its governance/access model is appropriate.
- Synchronization is asynchronous, idempotent, observable, replayable, and reconcilable.
- Tenant isolation, feature controls, retention, and deletion apply across every provider.

## Google Drive storage strategy

Official initial folder: [Selfies](https://drive.google.com/drive/folders/1beJRuQVHmAyxxRFcYrTF_XyfRhfjTD6O).

The target strategy is provider-neutral attachment metadata in Supabase with bytes stored in an approved provider. Supabase records should identify the business entity and tenant plus provider, provider file ID, controlled view/reference URL when needed, MIME type, size, checksum, original name, capture time, upload time, owner/uploader, sync status, retention class, and deletion state.

Proposed Drive organization:

```text
Company Hub/
  <company-id>/
    attendance/YYYY/MM/<employee-id>/
    leave/YYYY/<employee-id>/
    expenses/YYYY/MM/<employee-id>/
    visits/YYYY/MM/<employee-id>/
```

Folder names are for operator readability; immutable IDs and Supabase metadata provide identity. Filenames should be deterministic, collision-safe, and free of unnecessary personal data.

Required controls before use:

- Use the approved company operational account with documented recovery and access owners.
- Keep production resources restricted. Any temporary public sharing must have an owner, reason, expiry, and verified reversion.
- Grant write access only to identities required for the approved integration and administration workflow.
- Private-by-default objects; no anonymously accessible attendance or HR attachments.
- Server-side MIME/signature/size validation, checksum verification, upload finalization, and malware/content policy where applicable.
- Idempotent retry, orphan detection, deletion propagation, retention enforcement, legal hold, access reviews, and auditable operations.
- A migration and rollback plan for existing Supabase attendance selfie paths.

Attendance must not be lost if Drive is temporarily unavailable. The approved implementation should either retain a controlled temporary object until Drive finalization or use an outbox-backed upload state that clearly distinguishes operational attendance success from media synchronization status.

## Google Sheets reporting layer

Official workbook: [Database for Company Hub](https://docs.google.com/spreadsheets/d/1Kad8u6CV53AiR6XlTS40Ha9c5gi38AxfzqXKXg0sA80/edit?usp=sharing).

Google Sheets is the Reporting/MIS layer. It receives governed projections from Supabase and supports dashboards, scheduled reports, pivots, and controlled business analysis. It must not be used to approve leave, alter attendance, change employees, or drive authorization unless a future separately approved inbound workflow is designed.

Target synchronization properties:

- Stable Supabase UUIDs are the primary reconciliation keys.
- Incremental changes use source `updated_at` watermarks plus periodic full reconciliation.
- Upserts are idempotent; deletes use documented soft-delete/tombstone semantics.
- Batches are bounded for Google quotas and include exponential backoff with jitter.
- Every run records start/end, domain, watermark, attempted/succeeded/failed counts, error category, retry state, and schema version.
- Workbook raw tabs are machine-owned and protected; dashboards/formulas use separate curated tabs.
- Dates/times carry an explicit timezone. The current workbook timezone is `Asia/Dhaka`.
- Reporting freshness and failed-sync indicators are visible to consumers.

## HR Reporting Database

The workbook should begin with a governed data dictionary rather than immediate bulk export. Proposed tabs:

| Tab                | Grain                            | Initial scope                                                                | Sensitive-data rule                                                         |
| ------------------ | -------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `_Data_Dictionary` | One row per field                | Name, type, meaning, source, owner, privacy class                            | No employee values.                                                         |
| `_Sync_Runs`       | One row per sync run/domain      | Status, watermarks, counts, errors, schema version                           | Admin-only.                                                                 |
| `_Control`         | One row per dataset/config       | Dataset version, freshness SLA, enabled state                                | Protected.                                                                  |
| `Employees`        | One row per employee             | IDs, company, role, manager, work mode, lifecycle, approved reporting fields | Exclude Auth IDs/internal email/password data.                              |
| `Attendance`       | One row per employee/date record | Server times, status, work mode, location references, minutes, sync metadata | Exclude selfie URLs and unnecessary precise coordinates from broad reports. |
| `Leave`            | One row per request              | Type, dates, days, status, approver reporting key                            | Exclude attachments and free text unless explicitly approved.               |
| `Holidays`         | One row per calendar event       | Company/calendar/date/title/workday effect                                   | Suitable first pilot.                                                       |
| `Resources`        | One row per approved resource    | Category/type/status/usage projection                                        | Include only if a reporting use case is approved.                           |

Every domain contract requires owner, purpose, lawful/approved use, field allowlist, row grain, keys, timezone, retention, consumers, refresh SLA, deletion behavior, and reconciliation query.

## Reporting workbook vision

The workbook evolves through three zones:

1. **Raw synchronized tabs:** protected, stable schemas, machine-written values only.
2. **Curated semantic tabs:** documented formulas/mappings for HR metrics such as headcount, presence, lateness, leave utilization, and holiday calendars.
3. **Presentation tabs:** manager dashboards, monthly MIS, pivots, charts, and scheduled exports with freshness notices.

Manual edits must never be mixed into raw synchronized ranges. Where HR needs annotations or targets, place them in separate keyed input tabs with explicit ownership and validation. Reporting definitions—present, absent, late, working day, active headcount—must be documented and match operational rules rather than being reinvented in formulas.

## Future analytics architecture

Google Sheets is an intentional near-term MIS layer, not necessarily the final analytical warehouse. The design should allow a later transition:

```text
Supabase operational data
  -> versioned change/outbox contract
  -> Google Sheets reporting projection (near term)
  -> governed warehouse/lakehouse (future scale)
  -> semantic metrics layer
  -> BI dashboards and scheduled reports
```

Triggers for moving beyond Sheets include quota pressure, high row counts, concurrent editor conflicts, complex history, row-level analytical security, long refresh times, or the need for reproducible multi-year models. Provider-neutral event contracts and data definitions should make that transition possible without changing operational tables for every dashboard.

Future analytics should include:

- Slowly changing employee/role/manager history where business reporting needs historical truth.
- Snapshot and event facts for attendance and leave.
- Metric definitions with owners, tests, and version history.
- Company/role-aware access, privacy minimization, retention, and auditability.
- Data-quality checks for uniqueness, referential integrity, freshness, completeness, and reconciliation totals.
- BI tools consuming curated datasets rather than querying mutable operational UI tables directly.

## Planned phased implementation approach

### Phase 0 - Audit and approval

Deliver this plan and [AUDIT_REPORT.md](AUDIT_REPORT.md). No implementation. Approval gates: architecture direction, privacy classification, resource ownership, and prioritized remediation.

### Phase 1 - System stabilization and governance baseline

- Confirm temporary public sharing has been reverted and document recovery/access ownership for the approved operational account.
- Review workbook sharing/protected ranges and define consumer groups.
- Approve data classification, retention, deletion, consent, incident response, and credential rotation.
- Resolve the pending schema/documentation baseline and current security backlog.

Exit criteria: approved owners and policies; no production public access; named integration identity; documented access matrix.

### Phase 2 - Integration foundation

- Approve ADRs for provider-neutral attachments and the reporting replica.
- Add an outbox/sync ledger, idempotency contract, retry/dead-letter behavior, reconciliation, and redacted telemetry.
- Establish an isolated QA environment and integration tests.

Exit criteria: failure/replay/duplicate/delete scenarios pass without making Google the operational authority.

### Phase 3 - Workbook contract and low-risk pilot

- Create data dictionary, control, and sync-run structures.
- Pilot Holidays or another low-risk dataset.
- Validate quotas, batches, timezones, permissions, protected raw ranges, freshness, and reconciliation.

Exit criteria: repeatable idempotent sync, zero unexplained row drift, visible freshness, and signed-off field allowlist.

### Phase 4 - HR reporting rollout

- Add Employees, Leave, and Attendance projections in that order.
- Keep sensitive free text, Auth identifiers, secrets, media links, and unnecessary GPS data out of broad reports.
- Build curated MIS definitions and dashboards separately from raw tabs.

Exit criteria: domain-owner sign-off, performance targets, privacy review, data-quality checks, and rollback/runbook completion.

### Phase 5 - Drive media pilot

This phase number belongs to the Google integration workstream. Product Phase 5
live location tracking is tracked separately in `ROADMAP.md` and
`docs/LIVE_LOCATION_TRACKING.md`; neither designation replaces the other.

- Implement one provider-neutral attachment domain with secure asynchronous finalization.
- Validate upload, checksum, access denial, retry, orphan cleanup, deletion, retention, and outage behavior.
- Preserve existing Supabase media until migration verification is complete.

Exit criteria: no public media, no lost operational records, deterministic reconciliation, and tested recovery.

### Phase 6 - Migration and domain expansion

- Migrate eligible historical selfies in bounded batches with checksum and access verification.
- Evaluate leave attachments, expense receipts, and visit photos independently.
- Decommission redundant Supabase objects only after verified cutover and explicit authorization.

Exit criteria: signed migration reconciliation, retained rollback evidence, and approved deletion of old objects.

### Phase 7 - Analytics scale decision

- Measure workbook size, API quota use, refresh duration, concurrency, and dashboard complexity.
- Continue with Sheets or introduce a warehouse/semantic layer based on measured thresholds.

## Cross-phase quality gates

Every implementation phase must include:

- Success, validation failure, authorization denial, tenant isolation, provider outage, retry, duplicate, deletion, and cleanup tests.
- No secrets/internal Auth identity in logs, Sheets, Drive names, URLs, or client bundles.
- Bounded batch sizes and payloads; documented quota/rate behavior.
- Documentation updates to architecture, database, API, security, testing, feature README, roadmap/backlog, changelog, and runbooks as applicable.
- `npm install`, lint, typecheck, build, relevant automated tests, migration dry-run/lint/advisors for database changes, and explicit authorization before applying migrations or changing external resources.

## Decisions required before Phase 1 implementation

1. Integration identity and recovery owners for the approved operational Google account.
2. Verification that temporary public sharing is reverted before production use and maintenance of the named administrator list.
3. Data retention/consent rules for selfies and each attachment class.
4. Workbook editors/viewers, protected raw-tab model, and reporting field allowlists.
5. Integration runtime/queue location and operational owner.
6. Attachment metadata contract and existing-selfie migration policy.
7. Reporting freshness targets, reconciliation owner, and failure notification channel.
8. Thresholds for graduating from Google Sheets to a warehouse.

## Success measures

- Zero operational writes lost because Google is unavailable.
- Zero cross-company or anonymous access to Drive media/reporting rows.
- Idempotent replay produces no duplicates and reconciliation reports no unexplained drift.
- Reporting freshness meets the approved SLA and failures are visible/actionable.
- All synchronized fields have documented source, meaning, owner, privacy class, and retention.
- Media deletion/retention propagates predictably and is auditable.
- Workbook dashboards use governed definitions consistent with Supabase business rules.
