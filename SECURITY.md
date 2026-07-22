# Security

## Platform authorization and feature enforcement

- Global authority is allow-listed in `platform_admins`; tenant role names never imply System Admin access.
- Platform tables and the overview view are revoked from browser roles; server services re-check System Admin before privileged access.
- Cross-company people reads, password resets, company lifecycle changes, and platform settings writes remain server-only and require `requireSystemAdmin`; reset and soft-delete operations require exact business-identifier confirmation and are audited.
- Company status and feature state are enforced in middleware for pages, route handlers, and Server Action posts. Denied direct access returns a 404 rewrite and records a security event.
- Disabled modules are removed from desktop/mobile navigation, dashboard shortcuts, and cards. UI filtering is not treated as authorization.
- Company Admin changes are constrained to the current authenticated company and cannot override a platform-level disable.
- Company deletion is a soft lifecycle state and never deletes tenant rows.

## Security model

Company Hub uses defense in depth: authenticated sessions, server-side role/company authorization, RLS on all public tables, scoped storage policies, and server-only service-role operations. The service-role key bypasses RLS and is therefore the highest-risk application credential.

## Secrets

Required secrets are `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET`; the Supabase anonymous key is public by design but should still be environment-configured. `.env.local` is ignored. `.env.example` must contain safe placeholders only.

`.env.example` contains safe placeholders. Any service-role key that may have entered Git history must still be treated as compromised until rotation is independently confirmed across local machines and Vercel.

Never place secrets in:

- `NEXT_PUBLIC_*` values unless intentionally public.
- client components or browser logs.
- Markdown, screenshots, issues, CI output, or migration SQL.
- command output included in support tickets.

## Database access

- All 22 public tables have RLS enabled.
- Direct browser access is default-deny except scoped notification SELECT.
- Storage policies require an active employee and owner/Admin relationship as appropriate.
- Notification RLS derives identity from `auth.uid()` through a constrained security-definer helper.
- Anonymous execution is revoked for storage, notification, schema-version, and platform helpers.
- Service-role services must call current-context/role checks before accessing data.

Current critical gap: many Admin-facing service-role operations check only active employee/company context, and some ID mutations omit a current-company predicate. Add service-boundary role checks and cross-company denial tests before production.

New tables require RLS, grants/policies, indexes, and security-advisor review in the same change.

## Storage

Quick Link media uploads are Admin-only and company-scoped. The server validates allowed MIME types, binary signatures, size, and potentially active SVG content before writing unique immutable object paths. Cleanup removes only unreferenced objects inside the authenticated company’s resource prefix.

- Public buckets expose object bytes by URL; do not store confidential content there.
- Private employee documents and leave attachments require owner/Admin policies.
- Attendance selfies are private and uploaded through server service role.
- Object paths must be normalized and scoped; validate MIME type and size before production hardening.
- Database rows store paths, not long-lived signed URLs.

## HTTP and browser controls

- Protected/auth routes are no-store.
- Celebration cron requires constant secret equality through the Bearer header in production.
- Notification tracking validates event names and current-user ownership in the service.
- Raw Supabase errors are replaced with bounded messages.
- React rendering supplies default output escaping; any future rich HTML requires sanitization.
- Browser permissions are requested in a user-visible onboarding flow.

Production gaps include rate limiting, CSP/security headers beyond removing `X-Powered-By`, centralized audit monitoring, and automated dependency scanning.

The service worker caches only immutable public assets. Activation removes legacy page-cache generations so authenticated HTML cannot survive logout/account switching in Cache Storage.

## Logging and privacy

Approximately 120 explicit console statements exist, mainly server-side error paths. Before production, route logs through structured redaction and monitoring. Never log credentials, session cookies, precise location beyond operational necessity, private storage URLs, import source rows, or notification content without a retention decision.

Sensitive data includes contact details, date of birth, attendance/GPS/selfies, leave reasons, reporting hierarchy, notification content, and activity metadata. Define retention and least-privilege access for each.

## Security verification

```powershell
./node_modules/.bin/supabase.cmd db lint --linked --level warning
./node_modules/.bin/supabase.cmd db advisors --linked --type security
npm audit
npm run lint
npm run typecheck
npm run build
```

Previous disposable-user checks verified Auth login, RLS isolation, employee notification visibility, realtime delivery, storage policy upload/download, service-role attendance storage, and cleanup. The latest advisor run has no anonymous-definer warning. It reports eight authenticated `SECURITY DEFINER` helpers that intentionally derive scope from `auth.uid()` for middleware/RLS/telemetry, plus disabled leaked-password protection. These remain explicit review items rather than silent passes.

## Incident response minimum

1. Contain: disable affected endpoint/deployment and revoke leaked keys.
2. Preserve evidence without copying secrets into tickets.
3. Assess Supabase Auth, database logs, storage access, and Vercel logs.
4. Rotate secrets and invalidate sessions when relevant.
5. Repair through reviewed migration/code changes.
6. Document timeline, scope, customer impact, and prevention actions.

Report vulnerabilities privately to the repository owner; do not open a public issue containing exploit details or credentials.
