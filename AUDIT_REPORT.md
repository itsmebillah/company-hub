# Company Hub Documentation Reconciliation Audit

Original Phase 0 audit: 2026-07-30

Reconciled: 2026-08-13

Scope: documentation, repository code, migration history, attendance media, Google integration clients, scheduled recovery, dependency advisories, and committed test coverage.

Change boundary: documentation and architecture planning only. No product functionality, database migration, external-resource change, or deployment was introduced.

## Executive conclusion

The original Phase 0 audit was accurate when written but was superseded by the completed Phase 4.0.3 milestone. Its findings led to migration `0043` and the production attendance-media architecture. This reconciled report records resolution state rather than preserving obsolete implementation claims as active issues.

Current production truth:

- Production version is `v0.3.0`.
- Migrations and runtime schema telemetry are current through `0043`.
- Supabase remains the operational source of truth.
- Restricted Google Drive is the permanent attendance-selfie archive.
- Private Supabase Storage is a temporary recovery cache retained for 72 hours after verified Drive synchronization.
- Attendance media uses provider-neutral metadata, a transactional outbox, expiring leases, bounded retry, idempotent recovery, secure reads, and verified cleanup.
- Google Sheets API access is verified infrastructure only; no production reporting dataset is synchronized.
- Product Phase 5 live location, internal messaging, smart dashboard behavior, and a Flutter employee application are planned, not implemented.

## Evidence inspected

- Root state, plan, status, architecture, roadmap, backlog, changelog, README, known-issues, and engineering guidance.
- Ordered migrations through `0043` and the migration manifest.
- `get_app_schema_version()` in migration `0043` and the application schema-version constants.
- Attendance actions, service, repository, selfie adapters, permanent Drive adapter, media outbox repository/service, secure media route, and cleanup flow.
- Google authentication, Drive client, Sheets client, API retry layer, configuration, authorization helper, and self-cleaning verifier.
- Attendance-media cron route, Vercel schedule, immediate post-response attempt, processing script, and verification script.
- Playwright configuration and committed public/authenticated suites.
- Current npm installation and production-only audit results.

No production data or credential value was printed or changed during reconciliation.

## Original Phase 0 findings: resolution

| Finding                                   | Original condition                                                                | Current status                                                                                                                                                                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GD-001` Drive sharing                    | Selfies folder was link-writable during the original audit.                       | **RESOLVED FOR ACTIVATION:** the production folder was subsequently verified restricted before attendance-media activation. Continued access review remains an operational control.                                            |
| `GD-002` media governance                 | Consent, retention, deletion, incident, and legal ownership were incomplete.      | **OPEN GOVERNANCE:** technical 72-hour cache retention is implemented; broader policy ownership remains required.                                                                                                              |
| `INT-001` no Google/outbox implementation | No active Google client or durable queue existed at audit time.                   | **RESOLVED FOR ATTENDANCE MEDIA:** Drive OAuth, attachment metadata, transactional outbox, leases, retries, recovery, secure delivery, and cleanup are active. **OPEN FOR SHEETS:** reporting synchronization remains unbuilt. |
| `DB-001` pending `0041`                   | Audit-system removal had not been applied.                                        | **RESOLVED:** `0041`, `0042`, and `0043` are applied; runtime schema version is `0043`.                                                                                                                                        |
| `GS-001` reporting contract               | Workbook had no governed HR schema.                                               | **OPEN:** choose a low-risk pilot and approve tabs, fields, keys, timezone, deletion semantics, protection, and freshness.                                                                                                     |
| `GS-002` reporting security               | Workbook editor/viewer and protected-range model was not approved.                | **OPEN:** required before production rows are synchronized.                                                                                                                                                                    |
| `SEC-001` credentials/dependencies        | Credential rotation and dependency risks were unresolved.                         | **OPEN:** historical rotation remains unconfirmed; current audit results are recorded below.                                                                                                                                   |
| `SEC-002` service-role authorization      | Missing application checks would have high impact.                                | **OPEN CONTROL:** current tenant guards remain required; isolated lower-level authorization tests are still absent.                                                                                                            |
| `TEST-001` isolated tests                 | No unit/service integration suite and incomplete isolated browser fixtures.       | **OPEN:** pull-request smoke coverage exists, but destructive authenticated paths remain protected/manual.                                                                                                                     |
| `DOC-001` documentation drift             | Root documents disagreed about migrations, Drive, audit removal, CI, and testing. | **RESOLVED BY THIS MILESTONE:** canonical documents now use one current-state boundary and explicit status labels.                                                                                                             |

## Phase 4.0.3 attendance-media verification

Migration `0043` provides:

- `attendance_attachments`, `integration_outbox`, and `attendance_media_cleanup_logs`;
- RLS/default-deny browser access, service-role grants, indexes, and constraints;
- atomic attachment/outbox capture from attendance records;
- historical attachment backfill;
- leased claim, completion, and failure RPCs for sync and cleanup;
- bounded retry timing and safe error storage;
- runtime schema version `0043`.

The server implementation provides:

- private Supabase cache download/existence/removal;
- OAuth-backed Drive lookup, upload, verification, download, and idempotency metadata;
- immediate limited delivery after attendance plus a scheduled recovery sweep;
- Drive verification before sync completion and again before cache deletion;
- authorized Company Admin delivery that does not expose credentials or raw provider errors;
- credential-redacted operational verification of schema, attachments, permanent files, cache state, and pending outbox count.

At milestone completion, all three historical selfie references were verified in restricted Drive and the outbox was empty. This is the authoritative media state.

## Google Sheets gap analysis

Implemented foundation:

- dedicated server-only service-account authentication;
- explicit approved workbook ID;
- shared bounded retry for 429/5xx responses with jitter;
- redacted operation/status/reason logging;
- metadata inspection, temporary tab creation/removal, raw value write/readback;
- self-cleaning cross-provider verification.

Required before production synchronization:

1. Approve dataset purpose, owner, stable keys, company scope, row grain, field allowlist, timezone, retention/deletion, consumers, and refresh SLA.
2. Add a forward-only durable reporting event/ledger design. The current outbox is constrained to attendance attachments and cannot silently become a generic reporting queue.
3. Expand the adapter for bounded batches, deterministic row upsert, schema/header validation, tombstones, and protected raw ranges.
4. Add a server-only worker and authenticated schedule with leases, retries, replay, failure exhaustion, and recovery.
5. Add run telemetry, watermarks, counts/checksums, freshness, and periodic full reconciliation.
6. Surface only actionable failure/freshness state through Updates.
7. Prove outage independence, duplicate replay, stale lease, deletion, tenant isolation, row drift, no-op rerun, and rollback in an isolated environment.

Holidays remains the recommended first pilot. Employees, Leave, and Attendance require separate field-level privacy sign-off.

## Dependency security assessment

The 2026-08-13 installation audit reported 36 findings: 1 low, 11 moderate, 23 high, and 1 critical across production and development dependencies.

The production-only audit reported five high-severity affected packages/paths:

- `nanoid` below the patched range; npm reports a non-breaking fix is available.
- Next.js-bundled `postcss`, with multiple CSS/source-map advisories.
- `sharp`, through bundled libvips advisories.
- `xlsx`, with prototype-pollution and ReDoS advisories and no available fix.

Exposure assessment:

- `xlsx` is directly used for employee import/export behavior and parses user-selected workbooks. Lazy loading reduces initial bundle work, not parser risk. Keep file/row limits, Company Admin authorization, and replacement/risk-acceptance work active.
- The affected PostCSS path is part of the Next.js build/runtime dependency tree. npm proposes Next.js 16, a breaking upgrade requiring framework, build, browser, and deployment compatibility verification.
- `sharp` is used by the Next.js image pipeline where applicable; remediation is coupled to the compatible Next.js dependency path.
- `nanoid` is transitive in the current installation. Apply the reported non-breaking fix only in a separately reviewed lockfile maintenance change with full verification.

Do not use `npm audit fix --force`. Advisory counts are time-sensitive; rerun both installation and production-only audits during maintenance.

## Test and verification boundary

Committed automation includes:

- ESLint and strict TypeScript checks;
- production build validation;
- public Chromium route/PWA/API checks;
- protected authenticated Playwright flows for role routing, tenant boundaries, attendance, Storage, exports, navigation, accessibility, and responsive behavior;
- credential-redacted Google and attendance-media operational verification scripts.

Remaining gaps:

- no committed unit/service integration runner;
- full destructive authenticated checks need isolated Supabase fixtures and cleanup;
- no production Sheets synchronization tests exist because the feature is not implemented;
- Windows Playwright teardown can hang after otherwise passing smoke assertions;
- Edge is supplemental rather than required baseline coverage.

## Residual risks and next order

1. Confirm historical credential rotation and complete Google/privacy governance ownership.
2. Build the isolated authenticated-QA and lower-level test foundation.
3. Implement durable Google Sheets synchronization as the next integration milestone, beginning with Holidays.
4. Complete compatibility-tested dependency maintenance and explicit residual-risk decisions.
5. Reconcile historical schema reproducibility in an isolated project.
6. Proceed to Product Phase 5 only after native/background and privacy approval.
7. Plan internal messaging, smart Updates health, conditional dashboard cards, and the Flutter employee client without claiming implementation.

## Documentation result

The canonical current-state boundary is now:

- [PROJECT_STATE.md](PROJECT_STATE.md): detailed current technical truth.
- [PROJECT_STATUS.md](PROJECT_STATUS.md): concise milestone status.
- [PROJECT_PLAN.md](PROJECT_PLAN.md): delivery sequence and exit criteria.
- [PRODUCT_VISION_2027.md](PRODUCT_VISION_2027.md): long-term direction with explicit status labels.
- [KNOWN_ISSUES.md](KNOWN_ISSUES.md): active risks only.

Historical statements are retained only when identified as original audit context and paired with current resolution status.
