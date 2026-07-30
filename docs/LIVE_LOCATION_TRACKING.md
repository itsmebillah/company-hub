# Live Location Tracking — Product Phase 5

**Priority:** High  
**Status:** Planned; not implemented  
**Dependency:** Phase 4 attendance and durable automation completion

## Objective

Provide tenant-isolated, real-time location visibility for field employees only
while an attendance duty session is active. Successful check-in starts an
explicit tracking session; successful checkout ends it immediately. The system
must reject and avoid collecting updates outside that server-authorized window.

## Architecture decision required

A browser or installed PWA cannot reliably guarantee 30–60 second location
updates after the screen locks, the browser is suspended, or the operating
system applies background limits. Production acceptance therefore requires one
of these explicitly approved operating modes:

1. A native mobile application with foreground-location service, persistent
   tracking indicator, OS permissions, and platform-specific battery controls.
2. Foreground-only web tracking with a clearly documented limitation that live
   updates stop when the page or browser is suspended.

Do not claim complete background tracking from the web application without
device-matrix evidence. Battery level is optional because browser/device support
is inconsistent.

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
changes are deferred until the native-versus-foreground decision and privacy
review are approved.

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

## Future enhancements

Heatmaps, verified customer visits, SOS/panic workflows, supervisor monitoring,
route optimization, idle/suspicious-movement analysis, stronger mock-location
signals, and geofence notifications remain separately scoped enhancements.
