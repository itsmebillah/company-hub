# Security

## Platform authorization and feature enforcement

- Global authority is allow-listed in `platform_admins`; tenant role names never imply System Admin access.
- Platform tables and the overview view are revoked from browser roles; server services re-check System Admin before privileged access.
- Cross-company people reads, password resets, company lifecycle changes, and platform settings writes remain server-only and require `requireSystemAdmin`; reset and soft-delete operations require exact business-identifier confirmation.
- Company status and feature state are enforced in middleware for pages, route handlers, and Server Action posts. Denied direct access returns a 404 rewrite without exposing authorization detail.
- Disabled modules are removed from desktop/mobile navigation, dashboard shortcuts, and cards. UI filtering is not treated as authorization.
- The effective feature state is platform-first and is rechecked by middleware, APIs, and Server Actions. Company state cannot enable a platform-disabled feature or override a platform lock. Shared resource routes use one caller-derived any-of RPC so denial does not reveal inaccessible module details.
- Release notes are public only after publication; drafts and cross-user receipts remain protected by RLS. Automated release notes must never include environment values, secrets, internal auth email, provider errors, or stack traces.
- Company Admin changes are constrained to the current authenticated company and cannot override a platform-level disable.
- Company deletion is a soft lifecycle state and never deletes tenant rows.

## Security model

Company Hub uses defense in depth: authenticated sessions, server-side role/company authorization, RLS on all public tables, scoped storage policies, and server-only service-role operations. The service-role key bypasses RLS and is therefore the highest-risk application credential.

## Secrets

- Pull-request quality checks use no repository secrets. Their build-only values are explicit placeholders.
- Mutation-enabled browser tests load real credentials only from ignored `.env.test.local` or the protected GitHub `qa` environment. They require a matching project ref and explicit mutation opt-in.
- Never configure production Supabase credentials as QA test credentials.

Required secrets are `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET`; the Supabase anonymous key is public by design but should still be environment-configured. `.env.local` is ignored. `.env.example` must contain safe placeholders only.

Portable development setup uses the allowlisted `setup:local` importer and the
read-only `doctor` diagnostic. Plaintext local env files, OAuth JSON, service
account JSON, SOPS/age unlock keys, and decrypted artifacts remain outside Git.
If a SOPS bundle is used, both the encrypted bundle and its master key/KMS
credential are externally controlled; the application contains no custom
cryptography. Production secrets belong in Vercel, while protected CI/release
secrets belong in the applicable GitHub environment. The setup and diagnostic
commands redact all values and never launch OAuth automatically.

The complete portable bundle contains only allowlisted local-runtime and QA
values plus the two external Google credential documents. Vercel, Render,
GitHub environment, Supabase CLI-session, and Android signing stores are never
queried. If the Home-PC local runtime uses the authoritative Supabase project,
its allowlisted local service-role and database credentials are included and
the encrypted bundle must be treated as Production-sensitive.
QA import is pinned to the documented isolated project and Render API origin;
cross-wiring to Production fails validation.

Google Sheets uses a dedicated service account with no domain-wide delegation.
The Holidays projection is restricted to one explicitly configured company/workbook destination. Browser roles cannot read reporting destinations or outbox state; server-only service-role code performs delivery. No Employee, Leave, or Attendance fields are approved for Sheets.
Google Drive uses OAuth 2.0 offline access delegated by the operational account
with the least-privilege `drive.file` scope. The Selfies folder is explicitly
selected in Google Picker, and folder/file operations require Drive's
`isAppAuthorized` signal. Its client secret and refresh token are server-only.
Google credential files,
private keys, client secrets, refresh tokens, and access tokens must never appear
in client bundles, logs, Markdown, migrations, or test output. Production stores
individual credential values as sensitive Vercel environment variables. Local
credential file paths may point outside the repository from an ignored local env
file. The resource IDs are configuration, not authorization. See
`docs/GOOGLE_INTEGRATION_SETUP.md` for provisioning and rotation.

`.env.example` contains safe placeholders. Any service-role key that may have entered Git history must still be treated as compromised until rotation is independently confirmed across local machines and Vercel.

Never place secrets in:

- `NEXT_PUBLIC_*` values unless intentionally public.
- client components or browser logs.
- Markdown, screenshots, issues, CI output, or migration SQL.
- command output included in support tickets.

## Database access

- All 22 public tables have RLS enabled.
- Direct browser access is default-deny except scoped notification SELECT.
- Storage policies require an active employee and either ownership, a company-prefixed shared path, or a same-company Company Admin relationship. Company Admins cannot mutate global `system-assets`.
- Notification RLS derives identity from `auth.uid()` through a constrained security-definer helper.
- Anonymous execution is revoked for storage, notification, schema-version, and platform helpers.
- Service-role services must call current-context/role checks before accessing data.

Company Admin service-role operations resolve active Company Admin context, effective feature state, and authenticated company scope before privileged work. Cross-company employee-detail denial and Company Admin route denial are regression-tested.

New tables require RLS, grants/policies, indexes, and security-advisor review in the same change.

## Storage

Quick Link media uploads are Company Admin-only and company-scoped. The server validates allowed MIME types, binary signatures, size, and potentially active SVG content before writing unique immutable object paths. Cleanup removes only unreferenced objects inside the authenticated company’s resource prefix.

- Public buckets expose object bytes by URL; do not store confidential content there.
- Private employee documents and leave attachments require owner or same-company Company Admin policies.
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
