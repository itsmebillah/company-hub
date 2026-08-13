# Company Hub Master Specification

This file is retained as a stable entry point for older links. The synchronized specification is now split into focused root documents so product, engineering, security, and operations can evolve without one stale monolith.

## Canonical documents

- Product scope and acceptance outcomes: [PRODUCT_REQUIREMENTS.md](../PRODUCT_REQUIREMENTS.md)
- Strategic product direction: [PRODUCT_VISION_2027.md](../PRODUCT_VISION_2027.md)
- Current feature inventory: [FEATURES.md](../FEATURES.md)
- Current readiness and risk: [PROJECT_STATE.md](../PROJECT_STATE.md), [KNOWN_ISSUES.md](../KNOWN_ISSUES.md)
- Architecture and durable decisions: [ARCHITECTURE.md](../ARCHITECTURE.md), [DECISIONS.md](../DECISIONS.md)
- Database and external interfaces: [DATABASE.md](../DATABASE.md), [API.md](../API.md)
- Identity and security: [AUTH.md](../AUTH.md), [SECURITY.md](../SECURITY.md)
- Engineering and operations: [DEVELOPMENT.md](../DEVELOPMENT.md), [TESTING.md](../TESTING.md), [DEPLOYMENT.md](../DEPLOYMENT.md)
- Delivery planning: [ROADMAP.md](../ROADMAP.md), [BACKLOG.md](../BACKLOG.md), [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md)

## Current non-negotiable invariants

- Employees log in with Employee ID, not visible email identity.
- `internal_auth_email`, `auth_user_id`, service-role credentials, tokens, and raw provider errors stay server-side.
- Each employee has one company and role; hierarchy uses `employees.manager_id`.
- Company/role authorization is established before service-role data access.
- Resource and announcement filtering is enforced server-side.
- All public tables use RLS; direct browser access requires an explicit policy.
- Attendance time/location decisions are server-authoritative.
- Company settings are the branding and operational policy source of truth.
- Database changes are forward-only ordered migrations.
- New behavior is incomplete until tests, docs, security impact, and operational rollout are addressed.

## Current implementation baseline

Company Hub includes Auth/bootstrap, employees/import/hierarchy/roles, resources/permissions, announcements, notifications/realtime, attendance/GPS/selfies/reports/offline sync, durable Drive media, leave, holiday calendars, settings, profile, celebrations, responsive shells, themes, and PWA foundations. The former Activity Log and Platform Audit systems were removed by migration `0041`.

The linked Supabase project is `jjfktbgfwvekhlvyjlww`, with migrations `0001`–`0043` applied and runtime schema telemetry at `0043`. Production version is `v0.3.0`; active risks are maintained in [KNOWN_ISSUES.md](../KNOWN_ISSUES.md).

When this file conflicts with a focused canonical document, the focused document and current implementation win. Resolve the inconsistency in the same change.
