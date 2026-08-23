# Live Location Tracking — Product Phase 5

**Priority:** High

**Status:** Tracking core, native observation, and bounded native ingestion are
implemented for isolated QA; production rollout is not started

**Dependency:** Phase 4 attendance and durable media automation are complete;
native Android is selected, while the explicitly marked privacy and policy
decisions remain outstanding

## Objective

Provide tenant-isolated, real-time location visibility for field employees only
while an attendance duty session is active. Successful check-in starts an
explicit tracking session; successful checkout ends it immediately. The system
must reject and avoid collecting updates outside that server-authorized window.

## LOCATION-001 — tracking technology decision

A browser or installed PWA cannot reliably guarantee 30–60 second location
updates after the screen locks, the browser is suspended, or the operating
system applies background limits.

**Decision:** the production mode is a Flutter Android employee client with a
native foreground-location service. A web/PWA fallback is supported only while
the tracking page and browser remain active in the foreground.

The web fallback does not guarantee updates after screen lock, tab or browser
suspension, process termination, operating-system background throttling, or
loss of foreground execution. It must display that limitation before tracking
begins and whenever delivery is suspended.

Reliable screen-off collection, native lifecycle recovery, platform battery
controls, an operating-system persistent tracking notification, and supported
native mock-location signals are Android-only. Android support still requires
an approved minimum OS/device matrix. Battery level remains optional because
device support and its approved operational purpose are not yet defined.

While tracking is active, Android must display persistent OS disclosure and the
application must display a tracking-active state. Web must display an equivalent
in-application indicator while its foreground tracker is active.

The native client must reuse the existing Company Hub backend, roles, business rules, and security model. See [PRODUCT_VISION_2027.md](../PRODUCT_VISION_2027.md).

## LOCATION-002 — privacy and policy decision record

| Topic | Decision |
| --- | --- |
| Duty-only tracking | Location may be collected only during an active server-authorized duty tracking session associated with attendance. Collection outside that session is rejected and must not be stored. |
| Employee notice and consent | Employees must be prompted to grant required location permission, receive clear duty-only notice, and see persistent active/suspended tracking disclosure. Permission denial produces no points and must never be presented as active tracking. Exact policy text and whether a separate acknowledgement record is required remain **DECISION REQUIRED**. |
| Start | A successful check-in creates/activates the server tracking session. Client collection starts only after that response, required permission, and active-session confirmation. |
| Stop | Successful checkout closes the session immediately. Permission denial, session expiry/revocation, employee/company deactivation, or server rejection suspends collection and upload. A Company Admin may manually end tracking when authorized by the existing Company Admin and effective-feature model. |
| Retention period | Retention follows the existing Company Hub/company administration policy model. No arbitrary default is authorized. A concrete value remains **DECISION REQUIRED** if schema, cleanup, or rollout requires one. |
| Deletion behavior | Expired points are removed through bounded, auditable cleanup under the configured Company Hub/company policy without deleting attendance records. A concrete deletion SLA, exception handling, and backup propagation remain **DECISION REQUIRED** if required for implementation or rollout. |
| Employee access/requests | An employee may view and download only their own route history. Correction and deletion-request workflow, approvers, and response SLA remain **DECISION REQUIRED** because no existing workflow implements them. |
| Admin access | Current and historical location access follows the existing Company Admin, effective-feature, company, and attendance authorization model. System Admin status alone does not imply tenant route access. Manual stop uses the same boundary. |
| Supervisor access | Direct reports only: a supervisor may view a target employee only when `target.manager_id = supervisor.id`, within the same company and effective feature boundary. Recursive descendants are denied. No parallel hierarchy is introduced. |
| Tenant isolation | Every session, point, projection, geofence event, query, and stream is company-scoped. Cross-company access is denied. |
| RLS | Every new table requires RLS, explicit grants, caller-derived identity, tenant predicates, and denial tests. Browser roles must not receive broad history access. |
| Sampling | Use adaptive sampling: moving updates remain within the planned configurable 30–60 second range and stationary updates slow adaptively. Do not introduce a new fixed product interval unless a technical constraint requires and documents it. Server minimums still prevent abusive polling. |
| Battery | Use native battery-aware/adaptive behavior without an arbitrary hard battery cutoff. The client must disclose degraded or suspended delivery rather than silently stopping. Device-specific power-management behavior is validated through the supported device matrix. |
| Supported devices | Flutter Android with a native foreground service is the production target. Exact minimum Android version, supported device matrix, OEM battery-policy guidance, and unsupported-device behavior are **DECISION REQUIRED**. |
| Offline behavior | Cache only points belonging to the same active duty session. The queue is ordered, encrypted on supported native storage, deduplicated, and discarded/rejected after the session becomes invalid. There is no arbitrary product-level limit; implementation must choose, document, and test technical bounds for safety, memory, storage, and abuse protection. |
| Incident response | Logs exclude coordinates and route payloads. The operational owner, privacy/security escalation owner, evidence retention, notification threshold, and response SLA are **DECISION REQUIRED**. |
| Persistent disclosure | Android shows the foreground-service OS notification for the entire tracking period; both clients show an in-app active/suspended state. Tracking must not continue invisibly. |
| Permission denial/failure | Location permission is required for duty-bound tracking. If denied, tracking cannot operate: explain the failure, create no points, show tracking as inactive/suspended, and provide a permission/settings retry path. Attendance continues to follow the existing approved attendance policy rather than a new tracking-specific attendance rule. |

This record defines product and security boundaries, not legal compliance. No
labor-law conclusion or jurisdiction-specific employee right is asserted.

### Locked decisions

- Native Flutter/Android foreground-location service is the production mode;
  web/PWA is foreground-only.
- Tracking is duty-only, starts after successful check-in, and stops immediately
  after checkout or an authorized Company Admin manual stop.
- Employees may view and download only their own route history.
- Company Admin current/history access and manual controls reuse the existing
  tenant and effective-feature authorization model.
- Supervisor visibility is limited to direct reports where
  `target.manager_id = supervisor.id`; recursive descendants are denied and no
  new hierarchy is introduced.
- Sampling is adaptive, battery-aware, and has no arbitrary hard battery cutoff.
- Offline storage has no arbitrary product limit but remains technically bounded
  and protected against memory, storage, and abuse risks.
- Permission denial produces no points and must never appear as active tracking;
  attendance continues under its existing approved policy.
- Coordinates never enter logs or reporting sheets, and tenant isolation/RLS
  remain mandatory.

### Decisions still required

- Exact employee notice text and whether a separate acknowledgement record is
  required.
- A concrete retention duration if schema, cleanup, or rollout requires one.
- Deletion SLA, exception handling, and backup propagation where required.
- Employee correction/deletion-request workflow, approvers, and SLA.
- Minimum Android version, supported device/OEM matrix, and unsupported-device
  behavior.
- Operational incident owner, privacy/security escalation owner, evidence
  retention, notification threshold, and response SLA.

The tracking-core `0045` migration can be designed without inventing these
values: it must use policy/configuration references rather than a hard-coded
retention duration and must not activate retention cleanup or production
collection until the required operational values are configured and approved.

## Tracking contract

- The server creates one tracking session for an authenticated employee's
  successful check-in and closes it on checkout.
- Location ingestion verifies the active employee, company, attendance record,
  tracking-session state, timestamp bounds, payload limits, and replay key.
- The client displays a persistent tracking-active indicator and a clear reason
  for permission denial or tracking suspension.
- Moving interval default: configurable within 30–60 seconds.
- Stationary interval: adaptive and slower, with server-enforced minimums to
  prevent abusive polling.
- Offline points are bounded by age and count, ordered, deduplicated, and
  synchronized only while the same duty session remains valid.

Each immutable point records tenant, employee, attendance/session, server receipt
time, device observation time, latitude, longitude, accuracy, optional speed and
heading, movement state, source, and idempotency key. Do not store battery level
in immutable route history unless the privacy review approves a clear purpose
and retention period.

## Privacy and security

- No ingestion outside an active server-authorized duty session.
- RLS and server services enforce company and employee boundaries; administrators
  can see only their company and approved reporting hierarchy.
- Define consent/notice, retention, deletion, export, correction, labor-policy,
  and incident-response ownership before migration approval.
- Minimize precision and retention for operational need. Broad reporting sheets
  must not receive raw route coordinates.
- Detect impossible timestamps, excessive speed, low accuracy, replay, and known
  mock-location signals where platforms expose them; never treat heuristics as
  proof of misconduct.
- Logs must exclude coordinates and other route payloads.

## Planned data model

- `location_tracking_sessions`: duty/attendance relationship, lifecycle,
  start/stop reason, last heartbeat, and device state.
- `location_history`: append-only points partitioned or retention-managed by
  observation date, with indexes beginning `(company_id, employee_id,
observed_at desc)` and `(tracking_session_id, observed_at)`.
- `employee_current_locations`: derived current-state projection rather than a
  second source of historical truth.
- `geofence_events`: idempotent enter/exit transitions tied to configured company
  locations and tracking points.

Every new table requires RLS, explicit grants, foreign-key/filter indexes,
retention ownership, and an approved forward-only migration. Exact DDL and ER
changes remain deferred until every `DECISION REQUIRED` item that affects
collection, access, or retention is approved.

## API and realtime boundaries

- Authenticated, rate-limited location ingestion endpoint.
- Tenant-scoped current-location query for authorized administrators.
- Date- and employee-bounded route query with pagination and point limits.
- Scoped Supabase Realtime projection or server stream for current state; do not
  broadcast immutable history rows broadly.

## Admin experience

- Live interactive map with online/offline, last update, accuracy, movement, and
  optional supported battery state.
- Employee search and date/region filters.
- Route timeline/replay, distance summary, stop duration, and visit history.
- Configurable geofences with enter/exit events. Automatic attendance actions
  remain a separate future safety-reviewed feature.

## Proposed Phase 5 architecture

```text
Successful check-in
  -> server creates one active tracking session
  -> Android foreground service or foreground-only web client collects points
  -> authenticated, rate-limited ingestion validates session and payload
  -> immutable location history
  -> transactional current-location projection
  -> tenant-scoped realtime/admin queries
  -> checkout or revocation closes the session and stops collection
  -> retention worker removes expired route data under the approved policy
```

Responsibilities:

- **Database:** sessions, immutable points, current-location projection,
  geofence events, RLS, indexes, idempotency constraints, retention state, and
  cleanup audit.
- **API/server:** session authorization, bounded ingestion, clock/payload/replay
  checks, tenant-scoped current/history queries, geofence evaluation, and
  redacted errors.
- **Web dashboard:** live tenant map, freshness/online state, filters, route
  timeline/replay, distance, stops, and approved geofence administration.
- **Flutter Android:** foreground service, runtime permissions, persistent
  notification, adaptive sampling, native lifecycle recovery, encrypted bounded
  offline queue, and supported device-integrity signals.
- **Web fallback:** foreground-only permission, active-state disclosure,
  adaptive sampling while active, bounded local queue, and explicit suspension
  messaging.
- **Background processing:** retention cleanup, stale-session closure,
  projection/reconciliation repair, and bounded geofence processing where it is
  not part of ingestion.
- **Testing:** deterministic route fixtures, authorization/RLS denial, duty
  boundaries, replay/idempotency, offline expiry, clock skew, retention cleanup,
  map freshness, geofences, accessibility, battery/performance, Brave foreground
  behavior, and the approved Android device matrix.

## Proposed migration and API sequence

Migration `0045` is implemented and validated against the isolated QA project
only. It is not applied to production, and production collection remains
inactive. Later migrations and application layers remain proposals until their
own approval gates.

The authenticated ingestion boundary is also implemented in isolated QA. It
derives all identity from the current employee, resolves the active
attendance-backed session, accepts ordered batches of at most 100 points and
128 KiB, permits no timestamp before session start or more than five minutes
ahead of server time, and uses the `0045` session-scoped idempotency constraint.
These values are technical safety/database bounds rather than product cadence
or retention policy.

Migration `0046` implements the distributed ingestion abuse boundary in QA:
atomic PostgreSQL fixed-window counters cover both active tracking session and
tenant, coordinate-free state is private to service-role code, duplicates do
not consume new-point budget, and concurrent denials return retry guidance.
Limiter unavailability fails closed before history insertion.

1. **`0045` — tracking core:** tracking sessions, immutable location history,
   current-location projection, lifecycle/idempotency constraints, indexes,
   RLS/grants, and schema telemetry.
2. **`0046` — distributed ingestion rate limiting:** private tenant/session
   counters, atomic concurrency control, retry semantics, and bounded cleanup.
3. **`0047` — geofence and retention operations:** geofence events, retention
   claims/cleanup audit, stale-session handling, and any approved reconciliation
   functions.
4. **Later additive migrations only if required:** partitioning, measured scale
   indexes, or policy changes proven necessary after QA/load evidence. Never
   rewrite `0045` or `0046` after application.

Proposed server boundaries:

- attendance completion invokes a tracking-session start/stop service;
- authenticated point ingestion accepts a bounded batch with session ID and
  idempotency keys;
- Company Admin and authorized-supervisor current-location queries/streams are
  tenant- and hierarchy-scoped through the existing permission model;
- employees may query/download only their own history; Company Admin and
  authorized-supervisor historical queries require tenant/hierarchy scope,
  employee/date bounds, pagination, and point limits;
- an authorized Company Admin stop operation closes the target session through
  the same tenant/effective-feature boundary used by attendance administration;
- geofence configuration reuses company locations where the approved model
  permits, while enter/exit events remain separate immutable records;
- cleanup and stale-session operations use authenticated scheduled workers.

## Acceptance gates

- Check-in starts and checkout stops the server tracking session.
- Ingestion outside duty is rejected and produces no stored point.
- Tenant isolation, authorization denial, replay, offline recovery, clock skew,
  provider outage, retention, and cleanup tests pass.
- Map freshness, route reconstruction, distance, stops, and geofence transitions
  pass deterministic test fixtures.
- Supported device/background behavior is proven and accurately documented.
- Accessibility, responsive behavior, battery/performance, Brave foreground
  behavior, and the selected native-device matrix pass.
- Migration, RLS, indexes, ER diagram, API/setup/architecture docs, README,
  screenshots, project status, changelog, GitHub milestone/issues, production
  deployment, and rollback evidence are complete.

## Native Android foundation status

The first native foundation is implemented and validated only in the isolated
QA Flutter flavor on the API 36 emulator. Flutter and Android communicate over
the ADR-016 tracking channel; only a server-confirmed active `0045` session may
start the foreground-service shell. Android requests coarse and precise
location together, requires precise access, requests notification permission
separately, and presents both an in-app disclosure and an ongoing service
notification. Denial or revocation stops/suspends the service and creates no
points.

The native `LocationManager` observation source and bounded delivery pipeline
are implemented for QA. Fresh precise observations are validated, bound to the
server-authorized session, chronologically queued under session-scoped
idempotency keys, encrypted with Android Keystore AES-GCM, and sent only through
the existing `POST /api/location/points` boundary. The queue is technically
bounded to 500 points/five API-sized batches; capacity exhaustion suspends
collection without silently discarding a still-valid queue. Automatic retry is
bounded, honors numeric `Retry-After` for `429`/`503`, and requires explicit
reconciliation after token rejection or retry exhaustion. Checkout, invalid
session, permission revocation, and explicit stop invalidate the session queue.

This foundation does not request `ACCESS_BACKGROUND_LOCATION`, implement
adaptive sampling, live maps, replay, geofences, distance/stops, mock-location
policy, or claim production device compatibility. Those remain separate gates.

## Future enhancements

Heatmaps, verified customer visits, SOS/panic workflows, supervisor monitoring,
route optimization, idle/suspicious-movement analysis, stronger mock-location
signals, and geofence notifications remain separately scoped enhancements.
