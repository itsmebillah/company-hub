# Phase 4 Attendance Workflow Audit

Audit date: 2026-07-30

## Scope

The audit covered employee and Company Admin routes, server actions, attendance/policy/selfie services, repositories, offline replay, database migrations `0009`, `0010`, `0017`, `0018`, `0021`, `0022`, and `0023`, generated types, and committed Playwright coverage.

## Current workflow

The authenticated employee page loads today's server-derived attendance record and policy. The client requests geolocation, sends coordinates and device metadata to a feature-authorized server action, and optionally uploads a selfie before check-in or checkout. Server services resolve the active employee/company again, evaluate calendar, work-mode, GPS, accuracy, geofence, and time rules, then persist through the service-role repository. Offline actions are stored locally and replayed through the same server actions.

## Findings before implementation

### High — Selfie references trusted client-controlled paths

The upload action generated a tenant/employee path, but check-in and checkout accepted any `selfiePath` string supplied to the action. A crafted action could associate another path with an attendance record. Fixed by independently validating company, employee code, server attendance date, phase, and filename at persistence time.

### High — Existing selfie evidence could be overwritten

Selfies used deterministic `checkin.ext`/`checkout.ext` paths with `upsert: true`. A repeated upload could replace evidence before the attendance write was accepted. Fixed with unique immutable filenames, `upsert: false`, phase-state validation, MIME allowlisting, and image-signature checks.

### High — Concurrent checkout could overwrite completion

Checkout read the record and then updated by record ID only. Two concurrent requests could both pass the initial check and the last write would win. Fixed by adding company/employee predicates and `check_out is null` to the update, with an explicit already-completed response when no row changes.

### High — Secondary notification failure caused false action failure

Attendance was persisted before notification creation. A notification error then returned an action failure even though attendance succeeded, encouraging retries. Fixed by publishing best-effort attendance events whose handler failures are logged without reversing or misreporting the source-of-truth write.

### Medium — Service orchestration mixed unrelated responsibilities

The main service contained server-time calculations alongside identity, policy, reverse-geocode, persistence, media, and notification behavior. Time/status rules were extracted to a focused validation service; media and automation now have explicit boundaries.

### Medium — Unbounded client metadata and client-provided address

Attendance notes and device strings were written without explicit length limits, and a client-provided address could override reverse-geocoded display data. Phase 4 bounds optional text metadata and uses server-side reverse-geocode output only. Coordinates remain the authoritative location evidence.

### Medium — Automation events are not durable

The Phase 4 event contracts are process-local. A server interruption after attendance persistence can lose downstream work. This is documented and intentionally deferred until a transactional outbox migration is reviewed and approved.

### Medium — Sync metadata has no safe current persistence model

The live schema has no reporting sync/outbox or attachment-provider records. Adding status columns directly to attendance would not model check-in and checkout attachments cleanly. Recommended future design: an attendance outbox table plus attachment metadata records containing provider, object path, external file ID, status, attempt count, next attempt, last error, and last sync timestamp.

### Medium — Orphan selfie cleanup is not automated

A valid unique selfie may remain private in storage if the subsequent attendance action fails. Automatic deletion is unsafe without a durable attachment/claim record because a retry may still reference the object. Add age-based orphan reconciliation only with the future attachment metadata model.

### Medium — Offline queue durability and recovery are limited

The queue is browser-local, can be cleared, and retries failed actions only on existing sync triggers. Server-side duplicate and policy validation prevents silent invalid persistence, but the UI has limited retry/discard controls.

### Low — Reverse geocoding is best-effort but adds latency

Both check-in and checkout wait for reverse geocoding before persistence. The service already tolerates lookup failure, but a future performance phase may move address enrichment behind a durable event while retaining coordinates as source data.

### Low — Automated workflow coverage depends on isolated QA

Committed tests cover routes, responsiveness, accessibility, image selection limits, and real private bucket operations. Deterministic check-in/check-out/GPS/duplicate tests require the protected isolated QA project, explicit accounts, reversible data setup, and working Supabase connectivity.

## Security and isolation assessment

- Active employee context is resolved from the authenticated Auth identity.
- Company and employee IDs are server-derived, never accepted as action inputs.
- GPS distance is calculated server-side.
- Attendance timestamps and attendance date are server-derived.
- The database unique constraint enforces one record per employee/date.
- Company Admin detail lookup includes company scope.
- Selfie objects are private and read through short-lived signed URLs.
- Phase 4 adds write-time selfie ownership validation and conditional checkout isolation.

## Migration decision

No migration was created or applied. Migration `0041` is still pending review/amendment, and durable sync preparation needs explicit schema approval. TypeScript contracts describe the intended provider/sync vocabulary without pretending that delivery state is currently durable.

## Verification status

- `npm install`, lint with zero warnings, strict typecheck, and the production build pass.
- Installed Brave launched against the production build. The manifest returned 200, signed-out `/attendance` redirected to `/login`, and the 375px viewport had no horizontal overflow.
- Both credential-redacted anonymous and service-role Supabase REST probes failed at the connectivity layer. The login render logged `Unable to check company setup status`; this is an environment/infrastructure failure, not evidence of an attendance application regression.
- Full Brave mutation coverage for check-in, checkout, GPS, selfie upload, duplicate prevention, and error recovery was not run. The isolated QA project reference, designated accounts, mutation opt-in, and `.env.test.local` are not configured. Production data was not used as a substitute.
- No unit/service integration runner is committed, so extracted validation, storage, concurrency, and event boundaries are covered by lint/type/build but not lower-level automated behavioral tests.

## Recommended follow-up order

1. Provision and prove the isolated authenticated QA environment.
2. Add deterministic reversible attendance workflow tests.
3. Review and approve a transactional outbox plus attachment metadata migration.
4. Implement an outbox worker with idempotency, leases, retry policy, and monitoring.
5. Add Google Drive and Google Sheets adapters behind the existing contracts in separate approved phases.
