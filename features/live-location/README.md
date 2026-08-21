# Live Location

Phase 5 currently implements the database tracking core and authenticated
server-side ingestion boundary in isolated QA only. Production collection,
Flutter, maps, geofences, route replay, and reporting remain inactive.

`POST /api/location/points` accepts an authenticated employee's ordered batch.
The route derives company and employee identity from the current Auth session;
client company, employee, attendance, or tracking-session identifiers are
rejected. The repository resolves the caller's active attendance-backed session
and writes points with its server-derived IDs.

Technical abuse/database bounds:

- 128 KiB maximum UTF-8 request body;
- 1–100 points per batch;
- latitude `-90..90`, longitude `-180..180`;
- accuracy `0..10,000` metres;
- observations cannot precede session start or exceed server time by five
  minutes;
- ordered timestamps and unique 8–128 character idempotency keys per batch;
- optional speed `0..200 m/s`, heading `0..360`, and battery `0..100`.

These are technical safety limits, not tracking cadence, retention, employment,
or disciplinary policy. Database constraints remain the final lifecycle and
replay boundary. Errors and logs exclude coordinates and route payloads.

Migration `0046` supplies distributed fixed-window abuse protection through
Supabase PostgreSQL. Atomic transaction-scoped locks coordinate every Vercel
instance. Per minute, one active session may submit at most 60 requests and
1,000 new points; one tenant may submit at most 1,000 requests and 50,000 new
points. Duplicate points consume request budget but not new-point budget.
Denial returns HTTP `429` plus `Retry-After`; limiter unavailability returns
retryable HTTP `503` before any point is inserted. Closed-session counters are
removed automatically and old tenant windows are opportunistically bounded.
