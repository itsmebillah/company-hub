# Architecture Decision Log

This file records durable decisions reflected in code. Add an entry when changing a system boundary or invariant; do not rewrite history to make an old decision appear current.

## ADR-001 — Next.js App Router and server-first features

**Status:** Accepted

Use App Router route groups, server components, server actions, and feature modules. Pages compose; services own business behavior. This reduces privileged browser logic and aligns data loading with Next.js.

## ADR-002 — Supabase as backend platform

**Status:** Accepted

Use Supabase PostgreSQL, Auth, Storage, and Realtime. Schema changes are ordered SQL migrations. This centralizes core infrastructure while retaining explicit PostgreSQL constraints and policies.

## ADR-003 — Employee ID login over internal Auth email

**Status:** Accepted

Employees use Employee ID and password. A generated internal email bridges to Supabase Auth and is never exposed. This keeps business identity stable and provider implementation private.

## ADR-004 — One role and adjacency-list hierarchy

**Status:** Accepted

Each employee has one `role_id`; reporting hierarchy uses `manager_id` on employees. Do not add join-role or hierarchy tables without revisiting product requirements and migration compatibility.

## ADR-005 — Server-side service-role business access

**Status:** Accepted with risk

Most business CRUD uses a server-only service-role client after application-level authorization. This simplifies complex workflows and rollback across Auth/database operations, but makes service company/role checks security-critical. RLS remains default-deny defense for direct API access.

## ADR-006 — RLS on every exposed application table

**Status:** Accepted

All public tables enable RLS. Browser table access is denied unless explicitly required. Notifications have a scoped authenticated SELECT policy for realtime; other CRUD stays server-side.

## ADR-007 — Storage paths in data records

**Status:** Accepted

Persist bucket object paths rather than signed URLs. Shared helpers construct public URLs, while private access is resolved through Storage APIs. This avoids expiring URL persistence and makes bucket changes manageable.

## ADR-008 — Server-authoritative attendance

**Status:** Accepted

The server owns timestamps, GPS distance validation, work-mode/policy evaluation, and historical snapshots. Browser coordinates and offline queue entries are untrusted inputs.

## ADR-009 — Browser-local offline attendance queue

**Status:** Accepted as foundation

Queue attendance actions in local storage and retry online/through Background Sync. This provides lightweight resilience without a full offline database, but data can be lost with browser storage and conflicts need explicit UX.

## ADR-010 — Notification realtime as the only public-table subscription

**Status:** Accepted

Only `public.notifications` is added to `supabase_realtime`. Authenticated RLS filters events. Additional publications require a documented need, RLS behavior, volume analysis, and tests.

## ADR-011 — Forward-only production migrations

**Status:** Accepted

Never rewrite applied migrations. Correct defects through subsequent migrations and compensate rather than reset shared databases.

## ADR-012 — Vercel cron for celebrations

**Status:** Accepted

Run daily celebration generation through an authenticated GET route scheduled by `vercel.json`. The route is dynamic and requires `CRON_SECRET` in production.

## ADR-013 — Employee ID as the canonical default password

**Status:** Accepted business rule

Employees enter their original Employee ID as both username and default password. Existing internal Auth emails remain the Supabase identity bridge. Because Supabase requires six-character passwords, server code internally left-pads Employee-ID-derived credentials shorter than six characters before Auth calls. Padding is never exposed or entered by users. All provisioning, import, login, reset-to-initial, registration, and migration workflows must use the shared transformation in `features/auth/utils/employee-password.ts`.

## Open decisions

- Registration/invitation model and whether public Supabase signup stays enabled.
- Test runner, integration environment, and CI provider.
- Observability/logging platform.
- External push provider.
- Retention periods and privacy governance.
- Whether security helper functions move to a non-exposed schema.
