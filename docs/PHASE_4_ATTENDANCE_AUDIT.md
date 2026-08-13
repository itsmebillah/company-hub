# Phase 4 Attendance Workflow Audit

Audit date: 2026-07-30

Status: historical pre-activation audit. Its media architecture findings were resolved by production version `v0.3.0` and migration `0043`. Current truth is maintained in [PROJECT_STATE.md](../PROJECT_STATE.md).

## Scope

The audit covered employee and Company Admin routes, server actions, attendance/policy/selfie services, repositories, offline replay, database migrations `0009`, `0010`, `0017`, `0018`, `0021`, `0022`, and `0023`, generated types, and committed Playwright coverage.

## Workflow at audit time

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

### Medium — Automation events were not durable at audit time

At audit time, all Phase 4 event contracts were process-local. Migration `0043` subsequently made attendance-media delivery durable through `integration_outbox`. Non-media notification events remain process-local and best-effort.

### Medium — Sync metadata lacked a safe persistence model at audit time

Resolved for attendance media by migration `0043`, which added provider-neutral attachment records, permanent Drive identity, sync/cache status, attempt state, leases, errors, timestamps, and the durable media outbox. Durable Google Sheets reporting still requires a separately governed event and reconciliation contract.

### Medium — Orphan selfie cleanup before attendance persistence remains limited

A valid unique selfie may still remain private in the temporary cache if upload succeeds but the subsequent attendance action never persists a record, because migration `0043` captures attachment metadata from persisted attendance paths. Synchronized attachment cleanup is automated and verified; pre-persistence orphan reconciliation remains separate future work.

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

## Historical migration decision and resolution

No migration was created during the original audit. Subsequently, `0041` removed the retired audit systems, `0042` advanced telemetry, and `0043` implemented durable attendance media. All are applied in the authoritative environment, and runtime schema telemetry reports `0043`.

## Verification status

- `npm install`, lint with zero warnings, strict typecheck, and the production build pass.
- Installed Brave launched against the production build. The manifest returned 200, signed-out `/attendance` redirected to `/login`, and the 375px viewport had no horizontal overflow.
- Both credential-redacted anonymous and service-role Supabase REST probes failed at the connectivity layer. The login render logged `Unable to check company setup status`; this is an environment/infrastructure failure, not evidence of an attendance application regression.
- Full Brave mutation coverage for check-in, checkout, GPS, selfie upload, duplicate prevention, and error recovery was not run. The isolated QA project reference, designated accounts, mutation opt-in, and `.env.test.local` are not configured. Production data was not used as a substitute.
- No unit/service integration runner is committed, so extracted validation, storage, concurrency, and event boundaries are covered by lint/type/build but not lower-level automated behavioral tests.

## Reconciled follow-up order

1. Provision and prove the isolated authenticated QA environment.
2. Add deterministic reversible attendance and media-recovery tests.
3. Monitor scheduled retry/cleanup and pre-persistence orphan behavior.
4. Implement durable Google Sheets synchronization as a separate approved milestone.
5. Keep Product Phase 5 live location unimplemented until native/background and privacy decisions are approved.
