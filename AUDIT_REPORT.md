# Company Hub Phase 0 Audit Report

Audit date: 2026-07-30
Scope: repository, documentation, local migration history, and read-only inspection of the official Google Sheet and Google Drive folder
Change boundary: documentation and analysis only; no application code, migration, deployment, external-resource write, commit, or push was performed

## Executive summary

Company Hub is a mature Next.js 15/Supabase operations portal rather than an early prototype. It has separate employee, Company Admin, and System Admin planes; server-first business services; tenant-aware authorization; RLS; private attendance media; realtime notifications; exports; PWA behavior; and a production release workflow. The repository contains 45 routed pages, 365 TypeScript/TSX files, 41 ordered migrations, and 51 Markdown files at the time of this audit.

The highest-risk future-integration prerequisites are governance work, not new UI: ensure temporary public sharing is reverted before production use, define least-privilege access, design idempotent outbound synchronization, establish privacy/retention rules, and reconcile the pending `0041` migration. Supabase remains the operational source of truth. Neither Google Drive nor Google Sheets is integrated in current code.

Operational decision recorded for Phase 1: the existing company Google account and its Google Drive/Sheets workspace are the approved operational resources. Account ownership is an accepted assumption, not a migration requirement or P0 blocker. Project resources are not intended to be public; temporary public sharing may be used for development/review only and must be reverted and verified afterward.

The codebase is generally well structured, but service-role-heavy data access increases the impact of any missed application authorization check. Large services/components, absent unit/service integration tests, formatting debt, dependency advisories, a browser-local offline queue, and unbounded export/list growth remain material technical risks.

## Audit method and evidence limits

- Read all 51 Markdown files, their headings and local links, plus the root project guidance.
- Inspected route topology, feature modules, shared components, Supabase clients, authorization services, storage code, workflow configuration, package metadata, and all migration names/schema declarations.
- Compared documentation statements with implementation-visible evidence.
- Read Google Drive metadata and folder contents for `Selfies`; the folder was empty at inspection time.
- Read Google Sheets workbook metadata for `Database for Company Hub`; no cell values were changed or broadly extracted.
- Did not rerun production/browser flows, linked database commands, dependency audit, lint, typecheck, or build because this phase is documentation-only and the repository guide requires link/path checks and diff inspection for documentation changes. Prior verification results quoted below are labeled as documented baseline, not newly reproduced results.

## Priority model

| Priority | Meaning                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------- |
| P0       | Resolve before storing production HR media/data in the new resource or before Phase 1 release. |
| P1       | High operational, security, correctness, or scale risk; schedule early.                        |
| P2       | Important maintainability, UX, or completeness issue.                                          |
| P3       | Improvement with limited immediate risk.                                                       |

## Current architecture summary

The browser uses Next.js App Router pages/client components, Supabase Auth cookies, approved Storage operations, and a scoped realtime notification subscription. Next.js on Vercel provides middleware, server components, server actions, route handlers, cron, domain services, and repositories. Supabase provides PostgreSQL, Auth, Storage, RLS, and Realtime.

The preferred dependency direction is page -> server action/read service -> domain service/validation -> repository -> Supabase. `app/` composes routes, `features/` owns business behavior, `components/` owns shared presentation, and `lib/` owns cross-cutting infrastructure. This boundary is followed broadly, though several features access Supabase directly from services instead of a repository layer.

Authorization has three relevant scopes:

- Employee: active Auth identity joined to one employee, one company, and one role.
- Company Admin: canonical tenant authority, enforced in middleware and rechecked in privileged actions/services with company scope.
- System Admin: explicit global membership in `platform_admins`, separate from tenant roles.

Feature availability is platform-first, optionally narrowed per company. UI filtering complements but does not replace route/action/API authorization. Privileged CRUD commonly uses the server-only service-role client after context checks; RLS remains defense in depth.

## Current project status

Documented baseline as of 2026-07-26:

- Next.js 15, React 19, strict TypeScript, Tailwind CSS 4.
- Migrations `0001`-`0040` reported applied with local/remote parity.
- Local migration `0041_remove_audit_systems.sql` is pending linked verification/application.
- Lint, typecheck, and production build were reported passing; Prettier reports 353 differing files.
- A production-deployment workflow runs install, lint, typecheck, build, migration parity/dry-run, database lint, HTTP verification, and release publication after a successful Production deployment.
- Playwright route/Auth/authorization/mobile/PWA/Storage/attendance/export/Realtime coverage exists, but authenticated browser tests are not part of the automatic release gate and unit/service integration coverage is absent.
- No first System Admin is provisioned by design.

The repository is therefore deployable according to its prior verification record, but not ready for Google Workspace synchronization without a dedicated integration design and security gate.

## Completed features

- Employee-ID login, bootstrap, session restoration, routing, logout, password update/reset, and canonical short-ID password transformation.
- Employee CRUD/lifecycle, roles, hierarchy, bulk CSV/XLSX import, export, profile, and company-scoped administration.
- Resource categories, resources, targeted permissions, Quick Links, uploaded visuals, favicon/icon fallbacks, and employee resource portal.
- Targeted announcements, notification summaries/tracking, realtime delivery, native browser notification bridge, and celebration cron.
- Attendance check-in/out, server time, GPS/geofence validation, locations, work modes, policy snapshots, optional/required selfies, offline queue, admin detail, reports, and CSV/XLSX/PDF exports.
- Leave types and employee request/approve/reject/cancel flows; holiday calendars/events.
- Company branding/settings, feature controls, platform control center, release management, maintenance mode, responsive shells, theme support, and PWA install/update behavior.

## Prioritized findings

### P0

| ID      | Area                    | Finding                                                                                                                                                                                        | Impact                                                                                                                           | Recommendation                                                                                                                                                  |
| ------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GD-001  | Google Drive security   | The official `Selfies` folder granted `writer` to `anyone` with the link (not discoverable) when inspected. The business permits temporary public sharing only for development/review.         | If not reverted before production use, anyone obtaining the link could add, alter, or remove sensitive attendance media.         | Treat public sharing as time-bounded; record an owner/reason/expiry and verify the resource returns to restricted access before production data is stored.      |
| GD-002  | Privacy/governance      | No documented consent, retention, deletion, legal basis, incident response, malware/content validation, or subject-access process exists for facial images and future HR attachments in Drive. | Biometric-like/HR media may be retained or exposed without defensible controls.                                                  | Approve a data classification and retention policy before migration/upload; define deletion propagation, access review, audit, and breach response.             |
| INT-001 | Integration correctness | There is no Google API client, credential model, queue/outbox, sync ledger, idempotency key, retry/dead-letter flow, or reconciliation job in the repository.                                  | Direct dual writes could lose or duplicate media/reporting data and make attendance submission dependent on Google availability. | Use Supabase-first transactions plus an asynchronous outbox/worker; never make Google Sheets the write authority or block attendance on reporting sync.         |
| DB-001  | Schema state            | Migration `0041` removes activity/platform audit systems but is pending remote application while documentation alternates between audit features being present and removed.                    | Runtime schema and docs can diverge; planned integrations cannot rely on retired audit tables.                                   | Verify/apply `0041` only in the separately authorized database phase, regenerate types, and define a replacement integration-operation audit trail if required. |

### P1

| ID       | Area                 | Finding                                                                                                                                                                                                                    | Impact                                                                                                           | Recommendation                                                                                                                                              |
| -------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GS-001   | Reporting workbook   | The workbook title is currently `Database for Company hub` and contains `Sales Data Base Monthly` (133 columns) plus `Sheet2`; it has no HR domain tabs, contracts, keys, schema version, sync status, or data dictionary. | It is not ready to act as a stable MIS interface and could mix unrelated/manual data with synchronized HR facts. | Establish governed tabs, immutable keys, typed headers, timezone rules, schema version, `_sync_status`, and a data dictionary before loading data.          |
| GS-002   | Reporting security   | Workbook permission details, protected ranges, editor roles, revision/audit ownership, and downstream viewer model were not supplied/validated in this audit.                                                              | HR reporting data could be edited or shared beyond intended audiences.                                           | Perform a Workspace permission review; use protected/raw tabs, least-privilege editors, and separate curated dashboard tabs/views.                          |
| SEC-001  | Secrets/dependencies | Historical Supabase credential rotation remains unconfirmed; leaked-password protection is disabled; documented production dependency advisories remain unresolved.                                                        | Credential and supply-chain exposure persists independently of Google integration.                               | Close the existing security backlog before expanding integrations; do not use forceful incompatible package fixes.                                          |
| SEC-002  | Privileged access    | Most business CRUD uses service role after application checks. The pattern is valid but makes every missing `company_id`/role check high impact.                                                                           | A single authorization regression may bypass RLS.                                                                | Add isolated service/database authorization tests and a review checklist for every privileged query/mutation.                                               |
| SEC-003  | Abuse controls       | Login, notification tracking, cron, and future Google webhooks/sync triggers lack a documented common rate-limit/replay-protection layer.                                                                                  | Brute force, resource exhaustion, or replay risk.                                                                | Add rate limiting, signed requests, bounded payloads, and idempotency/replay windows before exposing integration endpoints.                                 |
| PERF-001 | Scale                | Attendance export/report services and import services are large; backlog already notes pagination/cursor limits for large datasets and exports.                                                                            | Memory, query latency, timeouts, and Google API quotas will worsen with growth.                                  | Add bounded/cursor extraction and batch sync; measure query plans and export memory before report synchronization.                                          |
| TEST-001 | Verification         | No unit or isolated service/database integration suite exists; browser tests use production-linked fixtures and are only partly release-gated.                                                                             | Business rules, rollback, tenant isolation, and sync failure behavior are costly to validate safely.             | Create an isolated QA project and prioritize auth, tenant boundaries, attendance, leave, storage, and outbox tests.                                         |
| DOC-001  | Documentation drift  | Root docs disagree on CI, registration placeholders, current Admin terminology, audit removal, helper warning counts, test counts, and migration/schema telemetry.                                                         | Engineers may follow incorrect operational or security guidance.                                                 | Treat `PROJECT_STATE.md` plus migrations/code as present-state authority and complete a focused documentation reconciliation before Phase 1 implementation. |

### P2

| ID       | Area                 | Finding                                                                                                                                                                                                                                      | Impact                                                                                | Recommendation                                                                                                                                                                              |
| -------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MOB-001  | Offline/mobile       | Attendance queue is browser-local and can be cleared; failed items have limited inspect/retry/discard controls. Selfie-required attendance cannot queue its media offline.                                                                   | Mobile workers can lose submissions or be blocked in weak connectivity.               | Design explicit queue diagnostics and a secure media retry experience; communicate that queued is not submitted.                                                                            |
| UX-001   | UI consistency       | Two employee-management component families (`features/employees/components` and `features/employees/ui`) coexist; several forms use dense one-file implementations and mixed primitives.                                                     | Visual/behavior drift and duplicate maintenance are likely.                           | Inventory route ownership, retire the unused family after tests, and standardize shared form/table primitives.                                                                              |
| TD-001   | File size            | Notable files include company settings form (852 lines), attendance report service (764), employee import service (761), import UI (750), attendance card (728), and attendance policy service (645).                                        | Changes have broad regression surfaces and slow reviews.                              | Split only behind characterization tests along validation, orchestration, transport, and presentation boundaries.                                                                           |
| TD-002   | Repository structure | Some domains have repositories while others query Supabase directly from services. Feature READMEs are missing for celebrations, releases, PWA, device onboarding, and offline sync; `home-login` appears disconnected from routed auth.     | Architecture expectations and ownership are unclear.                                  | Document intentional exceptions, add missing READMEs, and remove/retire disconnected documentation only in a scoped cleanup.                                                                |
| DOC-002  | Encoding/structure   | Multiple Markdown files display mojibake for arrows/dashes/quotes. `AUTH.md` repeats its top-level heading/content, `DECISIONS.md` reuses ADR numbers, `NEXT_SPRINT.md` skips item 6, and `docs/project-foundation.md` is effectively empty. | Readability, searchability, and decision traceability suffer.                         | Normalize UTF-8 and repair structure in a dedicated documentation cleanup, avoiding unrelated bulk formatting.                                                                              |
| DATA-001 | Storage model        | Current attendance columns store Supabase object paths only. Future Drive requirements mention file ID, URL, and timestamp, but no provider, ownership, checksum, MIME, size, retention, or sync-state fields.                               | A URL-only design is brittle and cannot support reconciliation or provider migration. | Model provider-neutral attachment metadata with immutable provider file ID, folder/tenant scope, checksum, MIME, size, capture/upload times, status, and deletion state; avoid public URLs. |
| DATA-002 | Attachments          | `leave-attachments` and `employee-documents` buckets exist without complete UI/lifecycle; leave requests currently do not implement attachment workflows.                                                                                    | Storage exists without governed end-to-end behavior.                                  | Decide each attachment domain explicitly; do not silently repurpose unused buckets or fields.                                                                                               |

### P3

| ID       | Area           | Finding                                                                                                                                            | Impact                                                                          | Recommendation                                                                                              |
| -------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| PERF-002 | Observability  | Structured correlation IDs, external error monitoring, slow-query baselines, and integration health dashboards are planned but incomplete.         | Failures will be harder to diagnose across Supabase, Vercel, Drive, and Sheets. | Add redacted correlation and sync-run telemetry before scale rollout.                                       |
| UX-002   | Browser/device | Edge cannot currently be run on the audit workstation; documented accessibility/browser coverage is stronger in Chrome than in the automatic gate. | Device-specific regressions may escape release.                                 | Restore Edge/device execution in isolated CI and retain manual camera/GPS testing on representative phones. |

## Existing bugs and broken controls

No deterministic application-critical defect or universally broken button was proven by static inspection. The known production issue is one isolated, non-reproduced `POST /login` 500 originating near the Company Admin guard after the 2026-07-26 deployment. It remains P1 monitoring work: capture request/action identifiers before changing authorization.

Static inspection found expected disabled states rather than a clear broken-button pattern. Runtime verification is still required for destructive/fixture-dependent controls: employee create/deactivate/reset, resource media lifecycle, leave decisions, attendance check-in/out, offline replay, feature controls, platform lifecycle, and release dialogs. These should not be labeled bug-free based only on static review.

## Mobile findings

Strengths include one configuration-driven mobile shell, a centered Dashboard FAB, safe-area handling, responsive Quick Link grids, touch-target guidance, theme/reduced-motion support, mobile table alternatives, and prior Playwright geometry/axe coverage at common widths.

Remaining risks are the browser-local offline queue, camera/GPS permission dependency, selfie upload requiring connectivity, incomplete failure recovery, device/browser variation, and very large interactive components. Real-device checks should cover low memory, slow/failed uploads, revoked permission between prepare/submit, orientation changes, 200% zoom, installed PWA updates, and background/foreground transitions.

## Performance findings

- Server-first rendering and no-store protected routes reduce client disclosure and stale authenticated content, but middleware performs multiple Auth/RPC calls on protected navigation.
- Feature usage recording issues one RPC per matched feature on GET and should be measured for shared resource routes.
- Large reports/exports/imports need explicit row/batch ceilings, streaming or asynchronous generation where appropriate, and query-plan monitoring.
- Favicon loading is non-blocking and images use fallbacks; company branding moved to dimensioned Next images. User-generated/private image optimization still needs measured review.
- Google integrations must respect Drive/Sheets quotas through bounded batches, exponential backoff with jitter, and per-run checkpoints; never rewrite an entire workbook for incremental changes.

## Security findings

Positive controls include server-only service-role construction, hidden internal Auth email, canonical employee password transformation, explicit System Admin membership, current-company resolution, server-side GPS/time checks, RLS, private selfie storage, signed URLs, feature fail-closed behavior, bounded user errors, and scoped notification realtime.

Open concerns are GD-001/GD-002, historical secret rotation, dependency advisories, leaked-password protection, authenticated definer-helper review, service-role authorization regression risk, missing abuse controls, and the absence of a Google credential/key-rotation design. Google OAuth refresh tokens or service-account credentials must be server-only, separately scoped for Drive and Sheets where possible, never exposed through `NEXT_PUBLIC_*`, and never stored in workbook cells or repository files.

## Supabase schema and storage assessment

Migration history creates 29 public application/platform tables across employees, companies, roles, settings, content, permissions, notifications, attendance, locations, leave, calendars, imports, celebrations, feature control, platform control, and releases. Migration `0041` drops `activity_logs` and `platform_audit_logs`, reducing the intended live total to 27 after application. Generated TypeScript types still reflect the current pre-`0041` state until regeneration.

Nine Storage buckets are declared: public profile photos, announcement images, company assets, resource icons, category icons, and system assets; private employee documents, leave attachments, and attendance selfies. Attendance currently uploads to private Supabase Storage and records `check_in_selfie_path`/`check_out_selfie_path`; server services create short-lived signed URLs.

Moving selected media to Drive is an architectural change, not a path substitution. Existing invariants say database fields store object paths, while the new direction requires provider metadata. Phase 1 should introduce a provider-neutral attachment contract and a controlled migration/dual-read plan rather than overloading existing path columns with Google URLs.

## Google Drive readiness

Current readiness: **not ready for production writes**.

Verified resource state:

- Folder name: `Selfies`; ID `1beJRuQVHmAyxxRFcYrTF_XyfRhfjTD6O`.
- Created/modified 2026-07-28; empty at audit time.
- Owner is the company's approved operational Google account.
- Link permission grants `writer` to anyone with the link and is not search-discoverable.

Required design decisions:

- Documented recovery/access owners for the approved operational account and a least-privilege integration identity.
- Tenant/domain folder hierarchy, deterministic filenames, and collision rules.
- Private access model; store provider file ID and metadata, not an anonymously usable URL.
- Upload finalization, checksum verification, retry, orphan cleanup, deletion propagation, retention, legal hold, access review, and incident response.
- Whether attendance selfies, leave attachments, receipts, and visit photos have different retention/access policies.
- Supabase fallback and migration strategy for existing selfie paths.

## Google Sheets readiness

Current readiness: **resource accessible, reporting model not ready**.

Verified workbook state:

- Spreadsheet ID `1Kad8u6CV53AiR6XlTS40Ha9c5gi38AxfzqXKXg0sA80`.
- Actual title: `Database for Company hub`; locale `en_US`; timezone `Asia/Dhaka`.
- Tabs: `Sales Data Base Monthly` (1,000 x 133 grid) and `Sheet2` (1,000 x 26 grid).
- No HR reporting tab/schema contract is present in metadata; permission posture was not established by this audit.

Recommended raw tabs are `Employees`, `Attendance`, `Leave`, `Holidays`, `Resources` (only if approved), plus `_Data_Dictionary`, `_Sync_Runs`, and `_Control`. Each fact tab should include stable Supabase IDs, `company_id`, source `updated_at`, `synced_at`, schema version, and deletion/status semantics. Human-edited formulas/dashboards should live in separate protected presentation tabs so synchronization never overwrites them.

Sync should be asynchronous, incremental, idempotent, and reconcilable. Use Supabase IDs as keys, batch upserts, watermarks plus periodic full reconciliation, explicit timezone normalization, and a dead-letter/retry record. Sheets must never feed operational attendance/leave decisions back into Supabase unless a separately approved import workflow with validation and authorization is designed.

## Documentation findings

All 51 Markdown files were reviewed. Local Markdown targets were checked; the final validation result is recorded in the handoff. Findings by group:

| Document group                                                                                                    | Assessment                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PROJECT_STATE.md`, `KNOWN_ISSUES.md`, `NEXT_SPRINT.md`, `CHANGELOG.md`                                           | Best current operational history, but test counts and pending `0041` state need continued synchronization.                                                                                                  |
| `ARCHITECTURE.md`, `DATABASE.md`, `SECURITY.md`, `API.md`, `BUSINESS_RULES.md`                                    | Strong core references; must be extended later for provider-neutral attachments, reporting outbox, Google identity/quota/security, and post-`0041` audit strategy.                                          |
| `AUTH.md`, `PRODUCT_REQUIREMENTS.md`, `TROUBLESHOOTING.md`                                                        | Contain duplicated content or obsolete `Admin` terminology/redirect guidance; reconcile to `Company Admin`.                                                                                                 |
| `ROADMAP.md`, `BACKLOG.md`, `FEATURES.md`                                                                         | Several stale placeholder/CI/audit items conflict with current code and changelog. Preserve historical intent but refresh statuses in the next doc cleanup.                                                 |
| `DECISIONS.md`                                                                                                    | Encoding damage and duplicate ADR numbering reduce traceability; add future ADRs for Google Drive, reporting replica, and sync consistency.                                                                 |
| `TESTING.md`, `RELEASE_CHECKLIST.md`, `DEPLOYMENT.md`, `DEVELOPMENT.md`, `CONTRIBUTING.md`, `CODING_STANDARDS.md` | Useful operating guidance; clarify the distinction between the deployment-status release workflow and missing PR/authenticated-browser CI.                                                                  |
| `UI_UX_GUIDELINES.md`                                                                                             | Good responsive/accessibility direction; encoding cleanup and real-device/offline media cases should be added.                                                                                              |
| Feature READMEs                                                                                                   | Existing files consistently state purpose/flow/rules, but several newer domains lack READMEs and `home-login` is disconnected from the routed login implementation.                                         |
| `docs/MASTER_SPEC.md`, `docs/project-foundation.md`, screenshot READMEs                                           | Master spec mentions audit logs despite pending removal; project foundation is too thin to be useful; screenshot indexes are evidence pointers rather than full test records.                               |
| `AGENTS.md`                                                                                                       | Says there is no committed test runner or CI workflow, which conflicts with Playwright and `.github/workflows/automatic-release.yml`; its migration-range wording also needs to account for pending `0041`. |

## Technical debt

- Large service/component files and mixed direct-service/repository access patterns.
- No unit or isolated service/database integration suite.
- Authenticated browser suite not in automatic release gating.
- Repository-wide Prettier debt and widespread Markdown encoding damage.
- Incomplete observability, retention, disaster-recovery rehearsal, and incident ownership.
- Offline attendance durability/recovery limitations.
- Incomplete attachment/document lifecycle despite existing buckets.
- Documentation fragmentation and inconsistent present-state terminology.
- No integration abstraction, outbox, sync ledger, or reconciliation framework.

## Recommended development order

1. **Security and governance gate:** verify temporary sharing is reverted; document operational-account recovery, service identity, workbook permissions, data classification, consent, retention, and incident processes.
2. **Baseline reconciliation:** resolve/apply or explicitly defer migration `0041`, regenerate types after application, reconcile current docs, and confirm credential/security-advisor decisions.
3. **Integration architecture:** approve ADRs for provider-neutral attachments, Supabase-first outbox, reporting replica semantics, idempotency, deletion, and failure recovery.
4. **Quality foundation:** isolated Supabase QA environment, unit/service integration tests, authenticated CI, formatting baseline, and structured redacted telemetry.
5. **Reporting contract pilot:** create governed workbook tabs/data dictionary and synchronize a low-risk read-only domain (for example Holidays) with reconciliation and quota tests.
6. **Employee/leave reporting:** add Employees and Leave only after column-level privacy and deletion rules are approved.
7. **Attendance reporting:** add attendance facts without media URLs; verify timezone, late/working-minute definitions, and scale behavior.
8. **Drive media pilot:** introduce provider-neutral metadata and an asynchronous upload/finalization flow for one domain; preserve Supabase fallback and cleanup.
9. **Controlled migration/expansion:** migrate existing selfies only after checksum/access verification; then evaluate leave attachments, receipts, and visit photos independently.
10. **Analytics layer:** build protected curated tabs/dashboards from raw synchronized tabs, with freshness and failure indicators.

## Risks

- Publicly writable Drive media is the immediate external-resource risk.
- Dual-write coupling could make core HR operations dependent on Google availability.
- Google Sheets row/cell limits, API quotas, and human edits can corrupt an unguided reporting design.
- The approved operational Google account is a continuity dependency; recovery and access ownership should remain documented.
- Facial/HR data requires stricter privacy, access, retention, and deletion controls than ordinary public assets.
- Existing service-role access and absent lower-level tests raise regression impact.
- Pending schema removal and stale documentation can cause integration work to target retired structures.
- Reporting replication introduces eventual consistency; consumers must see freshness and failure state.

## Recommendations

- Keep Supabase authoritative and Google Workspace derived.
- Treat Drive IDs as durable references; do not store public/share links as the only locator.
- Use asynchronous, idempotent, observable synchronization with replay and reconciliation.
- Separate raw machine-owned Sheet tabs from curated human-owned reporting tabs.
- Minimize synchronized personal data and exclude selfie links from general reporting.
- Require explicit authorization before any external-resource permission change, schema change, migration, data backfill, or deployment.
- Use this report and [PROJECT_PLAN.md](PROJECT_PLAN.md) as the Phase 1 approval baseline, then update the canonical architecture/security/database docs as each ADR is accepted.
