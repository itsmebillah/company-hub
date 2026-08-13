# Company Hub Product Vision 2027

Status: strategic direction

Last reconciled: 2026-08-13

This document describes intended product and architecture direction. It is not an implementation claim or authorization to create migrations, deploy features, or change external resources.

## Status legend

- **CURRENT:** implemented in the production architecture.
- **PLANNED:** prioritized and awaiting an approved implementation milestone.
- **FUTURE:** directional work requiring later design and prioritization.
- **OPTIONAL:** useful only if measured business need justifies it.

## Vision

Company Hub should evolve into a fast, reliable, simple, secure, and privacy-conscious employee operations platform. Employee experiences are mobile-first; Company Admin and System Admin experiences are web-first. Core writes remain dependable during external-provider outages, while non-critical work continues through durable background synchronization.

Product principles:

1. Performance first.
2. Security and tenant isolation first.
3. Minimal data collection and retention.
4. Background processing for non-critical work.
5. Idempotent, observable, recoverable integrations.
6. Clear operational ownership and failure visibility.
7. Mobile usability and native capability where required.
8. Accessibility across supported clients.
9. One backend and one authorization model.
10. Documentation that distinguishes implemented from intended behavior.

## Platform shape

### Admin web application — CURRENT AND PERMANENT

The Next.js web application remains the primary client for Company Admin and System Admin work:

- dashboards and employee management;
- attendance, leave, calendar, resources, and HR operations;
- reports, analytics, settings, and company administration;
- platform governance, release management, integration health, and messaging management.

Large-screen information density, keyboard accessibility, precise tables/forms, and secure server-side control remain core requirements. The Admin web application is not a transitional client.

### Employee web/PWA — CURRENT

The responsive employee web/PWA experience continues to provide authentication, attendance, leave, announcements, resources, calendar, profile, notifications, and limited browser-local offline replay. It remains supported during any native transition.

Browser and PWA limitations must be stated accurately. They cannot guarantee screen-off background location delivery across Android devices and operating-system policies.

### Native Android employee application — PLANNED

Flutter is the preferred technology for the eventual Android employee client because reliable background location, camera, push notifications, offline persistence, battery-aware services, and device integration require native control.

The application must reuse the Company Hub backend. It must not create a parallel operational system. Reused contracts include:

- Supabase Authentication and current Employee-ID login policy;
- Supabase PostgreSQL, RLS, and tenant model;
- existing server APIs, business rules, roles, and feature controls;
- Google Drive permanent media and planned Google Sheets projections;
- release metadata, maintenance state, and security boundaries.

The native application should preserve Company Hub branding, typography, colors, terminology, and visual language while following Android-native interaction, permission, accessibility, lifecycle, and background-service patterns.

## Native distribution and updates

### Signed APK distribution — PLANNED

Initial distribution may use controlled internal channels such as the company portal, an authenticated internal download page, restricted Google Drive, approved WhatsApp distribution, or mobile-device management. APK signing keys, checksums, provenance, access, revocation, and rotation need documented owners.

The build and release architecture must leave a future Google Play Store path open without requiring an application rewrite.

### Secure version enforcement — PLANNED

At startup, the native client should:

```text
Read installed version
  -> fetch trusted backend release metadata
  -> compare latest and minimum-supported versions
  -> continue, offer an optional update, or require an update
```

Optional updates show the version, release notes, **Update Now**, and **Later**. Mandatory updates block unsupported application use, provide a trusted update path, and resume normal use after a verified installation.

The client must accept APKs only from trusted Company Hub release metadata and a controlled HTTPS source. Release artifacts should be signed and accompanied by a verified checksum. Redirects, downgrade attempts, signature mismatch, and untrusted URLs must fail closed.

## Backend and integration direction

### Operational source of truth — CURRENT

Supabase Auth, PostgreSQL, RLS, Storage, and Realtime remain the shared backend for web and future native clients. Next.js server routes/actions/services remain the privileged application control plane. A native client should call approved authenticated APIs or RLS-safe direct interfaces; it must not embed service-role credentials or duplicate authorization logic insecurely.

### Attendance media — CURRENT

Version `v0.3.0` and migration `0043` implement this durable path:

```text
Selfie capture
  -> private Supabase Storage recovery cache
  -> attendance record + attachment metadata + transactional outbox
  -> leased retry/recovery worker
  -> restricted Google Drive permanent archive
  -> verified cleanup after 72 hours
```

Attendance succeeds independently of Drive availability. Google Drive is the permanent archive; Supabase Storage is a temporary recovery cache after verified synchronization.

### Durable Google Sheets reporting — PLANNED NEXT

The authenticated Sheets client and self-cleaning API verifier exist, but no production dataset is synchronized. The next integration milestone should add governed reporting contracts, durable events, idempotent bounded upserts, leases/retries, reconciliation, freshness, tenant isolation, and actionable health reporting. Sheets remains a derived MIS layer and must never approve or mutate operational HR state.

### Analytics platform — FUTURE

If measured scale, quotas, historical depth, concurrency, or analytical security exceed Sheets, add a governed warehouse/lakehouse and semantic metrics layer. Operational tables should not be redesigned for every dashboard.

## Performance vision

Performance targets are goals, not current production claims:

- cold startup under two seconds where technically achievable;
- warm startup under one second where technically achievable;
- near-instant local navigation and interaction feedback;
- no unnecessary blocking loaders;
- bounded and optimized network/database operations;
- efficient image transfer and background synchronization.

### Offline-aware data access — PLANNED

Cache appropriate low-risk data such as the employee profile, company summary, effective permissions, settings, and recent attendance state. Render safe cached data immediately, then refresh in the background. Define freshness, invalidation, encryption, logout cleanup, company switching, and sensitive-data exclusions per dataset.

Offline queues must be bounded, inspectable, retryable, deduplicated, and tied to the authenticated user and active business context. “Queued” must never be presented as “submitted.”

### Smart caching — PLANNED

Prefer:

```text
Safe cache -> immediate UI -> background refresh
```

over a blocking fetch where the workflow allows it. Authorization, server time, attendance policy, and other safety-critical decisions remain server-authoritative.

### Background processing — CURRENT DIRECTION

Attendance media already demonstrates the target pattern. User-facing operations should not wait for Drive, Sheets, cleanup, retries, enrichment, or non-critical notifications. Each background path needs durable state when loss matters, bounded retry, idempotency, monitoring, and recovery.

### Image optimization — PLANNED

Before network transfer, resize and compress selfies to an approved maximum dimension, format, and quality while preserving enough evidence for the business purpose. Validate decoded content and metadata server-side; never trust client optimization alone. Avoid retaining unnecessary full-resolution originals.

### Lazy loading and efficient queries — CURRENT DIRECTION

Load modules only when required. Use selective columns, pagination/cursors, indexed filters, bounded exports, small payloads, and measured query plans. Avoid full-table reads and startup initialization for features the current user cannot access.

## Product Phase 5: live location — PLANNED, NOT IMPLEMENTED

The authoritative specification is [docs/LIVE_LOCATION_TRACKING.md](docs/LIVE_LOCATION_TRACKING.md).

Scope includes:

- check-in starts a server-authorized duty tracking session;
- checkout stops tracking immediately;
- current location, last update, accuracy, route history/replay, and tenant-scoped live map;
- geofence enter/exit events;
- battery-aware adaptive intervals;
- bounded offline location queue and replay;
- basic mock-location and impossible-movement signals where technically available.

No employee location may be collected outside an active duty session unless a future explicit policy is separately approved. The PWA must not be presented as guaranteed background tracking. Preferred implementation uses a native Android foreground-location service with persistent OS disclosure and explicit permissions.

## Internal operational messaging — PLANNED

The messaging feature should provide:

- Company Admin messages to employees;
- employee replies;
- tenant-isolated lightweight threads;
- unread/read state;
- notification integration;
- automatic expiry and deletion after 30 days.

It is not a permanent records archive and should not become a WhatsApp replacement. Design must cover retention jobs, legal/HR exceptions, attachment exclusion by default, rate limits, abuse reporting, offline behavior, and cleanup verification while minimizing database and Storage use.

## Smart Admin experience — PLANNED

### System health in Updates

Do not dedicate a large dashboard card to healthy infrastructure. When all monitored systems are healthy, show no red badge or persistent KPI. When action is required, show a small red indicator on Updates; opening Updates reveals bounded details.

Potential signals include Drive delivery, Sheets freshness, queued/failed sync, retry exhaustion, cleanup status, last successful run, and database/schema health. Only meaningful, actionable failures should alert users. Sensitive errors and credentials remain server-side.

### Conditional dashboard cards

- Hide **Today’s Birthdays** when the count is zero; otherwise show it and link to the relevant employees.
- Hide **Work Anniversaries** when the count is zero; otherwise show it and link to the relevant employees.

Conditional visibility keeps the dashboard focused on actionable information.

## Optional future capabilities

- Play Store distribution after signing, policy, privacy, and operational readiness.
- External push provider beyond current browser notification foundations.
- Employee document workflows after retention and access policy approval.
- Advanced route analytics, SOS workflows, and visit verification after separate privacy review.
- AI assistance only after purpose limitation, access controls, auditability, and data-governance approval.

## Delivery guardrails

Every future milestone must:

- reuse the existing backend and authorization model;
- make current, planned, future, optional, and blocked status explicit;
- preserve operational writes during provider outages;
- minimize data and retention;
- verify tenant isolation, denial paths, offline/retry behavior, cleanup, accessibility, and performance;
- update the synchronized documentation set in the same milestone;
- use the next forward-only migration number after the applied range; currently that number is `0044`.
