# Mobile API

## Purpose

Versioned, server-only HTTP adapters for the Company Hub employee Android client. Bearer transport converges into the existing authenticated employee context and attendance behavior delegates to `AttendanceService`.

## Endpoints

- `POST /api/mobile/v1/auth/session`
- `POST /api/mobile/v1/auth/session/refresh`
- `DELETE /api/mobile/v1/auth/session`
- `GET /api/mobile/v1/attendance/state`
- `POST /api/mobile/v1/attendance/check-in`
- `POST /api/mobile/v1/attendance/check-out`

## Security boundaries

- Employee-ID lookup and `internal_auth_email` resolution stay server-only.
- Clients receive standard short-lived Supabase access and refresh tokens, never privileged credentials or internal Auth identifiers.
- Supabase validates each bearer token before the canonical active employee, company, role, hierarchy, and feature context is resolved.
- Client-supplied identity, company, attendance, and tracking-session identifiers are rejected.
- Attendance routes reuse the existing server-time, GPS, geofence, selfie, duplicate, policy, and persistence services.
- Responses and logs exclude passwords, tokens, internal Auth identities, raw provider errors, coordinates, and sensitive bodies.

Migration `0045` remains the only tracking-session lifecycle implementation: attendance persistence triggers activate and close sessions.
