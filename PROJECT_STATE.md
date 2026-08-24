# Project State

Last repository reconciliation: 2026-08-23

Production milestone evidence: 2026-08-13, version `v0.4.0`

## Summary

Company Hub is a functional Next.js/Supabase employee operations portal with separate Employee, Company Admin, and explicit System Admin workflows. Company Admin is the highest authority inside one company; System Admin is an explicit global authorization outside tenant roles.

Supabase is the operational source of truth. Attendance selfies use restricted Google Drive as permanent storage and private Supabase Storage as a temporary recovery cache. Google Sheets is a derived, durable Holidays reporting projection and never an operational authority.

The repository is the portable application source of truth. A committed
allowlisted setup helper and redacted doctor command rebuild local configuration
from an externally protected plaintext or SOPS/age source without committing
secrets or automatically repeating Google OAuth.

The complete workstation workflow can now export one externally stored
SOPS/age bundle containing allowlisted development/QA profiles and the two
Google credential documents, then rebuild ignored env files and machine-local
credential paths on another trusted PC. Production service-managed and Android
signing secrets remain excluded.

## Authoritative baseline

- Next.js 15 App Router, React 19, strict TypeScript, and Tailwind CSS 4.
- Node.js 24 and npm 11 are pinned by repository configuration.
- Supabase project `jjfktbgfwvekhlvyjlww` is the authoritative linked project.
- Migrations `0001` through `0044` are applied with matching local/remote history.
- Runtime `get_app_schema_version()` reports `0044`.
- Migration `0041` removed the Activity Log and Platform Audit systems.
- Migration `0042` advanced schema telemetry after that removal.
- Migration `0043` added provider-neutral attendance attachments, the durable integration outbox, leased retry/recovery RPCs, cleanup records, RLS, indexes, triggers, historical backfill, and schema-version reporting.
- Migration `0044` adds reporting destinations, the Holidays tenant key, durable Sheets events, leased retry/recovery, reconciliation health, RLS, and indexes.
- Migration `0045` is implemented and validated only in isolated QA; production
  remains at `0044`. It adds attendance-bound tracking sessions, immutable
  idempotent route points, a current-location projection, tenant RLS, and
  direct-report-only supervisor visibility.
- The Phase 5 ingestion boundary derives tenant/employee/session identity from
  authenticated server context, accepts bounded ordered batches, verifies
  persistence, handles session-scoped retries deterministically, and emits no
  coordinate-bearing logs. It remains inactive in production.
- Migration `0046` is applied only in isolated QA and provides distributed
  PostgreSQL session/tenant abuse counters with atomic concurrency control,
  retryable denial, fail-closed backend behavior, and no location payloads.
- The next migration number after production approval of `0045` is `0046`;
  applied migrations must not be modified or renumbered.
- Application tables use RLS. Integration tables added by `0043` default-deny browser roles and are accessed through authorized server-only code.
- No System Admin is auto-provisioned. `platform_admins` remains empty until the owner explicitly approves an active Auth identity.

## Implemented product areas

- Employee-ID login, bootstrap, session and role routing, profile, password management, and protected reset flows.
- Employee lifecycle, roles, hierarchy, bulk import/export, and tenant-scoped administration.
- Resource categories, resources, audience permissions, Quick Links, and visual/icon fallbacks.
- Targeted announcements, notification summaries/tracking, realtime delivery, browser notifications, and celebration processing.
- GPS-aware attendance, locations, work modes, server-time validation, offline replay, selfies, Company Admin review, reports, and CSV/XLSX/PDF exports.
- Leave types, employee requests, approval/rejection/cancellation, calendars, and holidays.
- Company branding/settings, feature controls, release management, maintenance state, and responsive role-aware navigation.
- System Admin company lifecycle, people, feature, settings, release, and health surfaces.
- Pull-request quality and production-release workflows.
- Public product homepage, Privacy Policy, and Terms of Service with an explicit login handoff and documented Google Drive/Sheets data practices.

## Phase 4.0.3 attendance media — COMPLETE

Production version: `v0.4.0`

Production flow:

```text
Employee selfie
  -> private Supabase Storage recovery cache
  -> attendance row + attachment metadata + transactional outbox
  -> immediate attempt and scheduled leased worker
  -> restricted Google Drive permanent file
  -> verified cleanup of the Supabase cache after 72 hours
```

Attendance persistence does not wait for Drive. Upload recovery uses attachment-level idempotency, expiring leases, bounded retry, partial-upload lookup, and redacted errors. Company Admin media reads are tenant-authorized server streams that prefer Drive and fall back to the retained cache while needed. Cleanup re-verifies the permanent object and removes only the cache object.

At milestone completion, all three historical attendance selfie references were verified in restricted Drive and the outbox had zero pending rows. The daily Vercel cron provides recovery and cleanup; new attendance also schedules a small immediate post-response delivery attempt.

## Google integration state

### Google Drive — ACTIVE

- OAuth 2.0 offline access uses the approved operational Google account.
- Restricted Drive is the permanent attendance-selfie archive.
- Supabase Storage is the temporary 72-hour recovery cache after verified sync.
- Durable metadata, outbox, retry, recovery, secure reads, and cleanup are implemented.
- The local-only `drive.file` migration is implemented and verified: Picker
  preserved the existing folder, all four stored attendance files are
  app-authorized, authorized downloads and the self-cleaning verifier passed,
  and unrelated-resource denial remains covered. Production remains on the
  prior full-scope credential until an explicitly approved cutover.

### Google Sheets — FOUNDATION ONLY

- A dedicated service account, explicit workbook configuration, bounded Google API retries, redacted errors, and a self-cleaning read/write verifier are implemented.
- The governed Holidays dataset uses UUID row identity, protected schema headers, durable leased delivery, bounded retry, deletion handling, duplicate repair, and daily reconciliation.
- Terminal failures create one Company Admin Update; healthy synchronization adds no dashboard clutter. Employees, Leave, and Attendance remain unapproved.

## Quality signals from this reconciliation

- Dependency installation: successful.
- ESLint: passed with zero reported warnings/errors.
- Strict TypeScript: passed after regenerating Next route types.
- Production build: passed on Next.js `15.5.22`.
- Markdown local-link/path verification: passed for the changed documentation.
- Portable-configuration and existing integration unit coverage: 19/19 passed.
- Playwright browser flows were not rerun for this documentation-only milestone; committed coverage includes public routes and protected authenticated flows, while isolated mutation coverage remains incomplete.
- A committed Node test runner covers Drive, Sheets, attendance-media recovery,
  and portable configuration merge/placeholder behavior.
- Repository-wide Prettier debt remains documented; bulk formatting is outside this milestone.

## Dependency security

The 2026-08-13 installation audit reported 36 findings: 1 low, 11 moderate, 23 high, and 1 critical across production and development dependencies.

The production-only audit reported five high-severity affected packages/paths:

- `nanoid`: a non-breaking `npm audit fix` is reported as available, but compatibility and lockfile changes require a separate dependency-maintenance change.
- Next.js-bundled `postcss` and `sharp`: npm proposes a breaking Next.js 16 upgrade; do not force this change without framework compatibility verification.
- `xlsx`: prototype-pollution and ReDoS advisories have no available upstream fix. Employee import loads the parser only after a file is selected, but uploaded workbooks remain untrusted input and require bounded size/row handling and operational risk acceptance or a replacement plan.

Do not run `npm audit fix --force`. Audit counts are time-sensitive and must be rechecked during dependency maintenance.

## Active release and operational risks

1. Historical Supabase credential rotation remains unconfirmed.
2. Full authenticated Playwright coverage still requires an isolated QA project, explicit synthetic accounts, mutation opt-in, and cleanup monitoring.
3. Historical migrations do not fully reproduce the linked schema in an isolated declarative diff; never apply the broad destructive generated diff.
4. Production dependency advisories require a compatibility-tested maintenance decision.
5. Authenticated `SECURITY DEFINER` helpers and leaked-password protection require formal policy review.
6. Repository-wide formatting and unit/service integration coverage remain incomplete.
7. The browser-local offline attendance queue can be cleared and has limited recovery controls.
8. Google Sheets durable Holidays synchronization is active; additional datasets require separate approval.

## Planned direction

- Durable Google Sheets Holidays synchronization is complete; further datasets require separate approval.
- Product Phase 5 production collection remains inactive. Tracking storage,
  ingestion, distributed rate limiting, the isolated Flutter Android shell,
  and the six mobile Auth/attendance server adapters are implemented in QA/local
  development. Flutter authentication, Keystore-backed sessions, attendance
  reconciliation, precise-location/notification permission gates, persistent
  disclosure, revocation handling, and the native Android `LocationManager`
  observation lifecycle passed API 36 emulator QA. The QA Android client now
  validates and session-binds observations, keeps up to five API-sized batches
  in Android Keystore AES-GCM encrypted storage, and delivers ordered,
  idempotent batches through the existing ingestion route with bounded retry
  and authoritative invalidation. Adaptive sampling and production activation
  remain unimplemented.
- Internal operational messaging, smart Updates-based health, and conditional dashboard cards remain planned/future work.
- Strategic direction is maintained in [PRODUCT_VISION_2027.md](PRODUCT_VISION_2027.md).

## Canonical references

- Delivery plan: [PROJECT_PLAN.md](PROJECT_PLAN.md)
- Milestone status: [PROJECT_STATUS.md](PROJECT_STATUS.md)
- Product direction: [PRODUCT_VISION_2027.md](PRODUCT_VISION_2027.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Data model: [DATABASE.md](DATABASE.md)
- Risks: [KNOWN_ISSUES.md](KNOWN_ISSUES.md)
- Operational readiness: [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
