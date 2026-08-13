# Phase 2 Infrastructure Review

Review date: 2026-07-30
Scope: testing, QA isolation, migration `0041`, dependencies, code quality, security, and performance
Boundary: no Google integration, business module, architecture redesign, migration application, deployment, commit, or push

Status: historical pre-application review. Migration `0041` was later applied, migration `0042` advanced schema telemetry, and migration `0043` activated durable attendance media. Do not follow the historical amendment/application instructions below; applied migrations must never be modified. Current state is [PROJECT_STATE.md](../PROJECT_STATE.md).

## Engineering decisions

1. Bundled Playwright Chromium is the portable default. Branded Edge is opt-in through `PLAYWRIGHT_INCLUDE_EDGE=true`; it supplements rather than blocks the baseline.
2. The web-server readiness probe uses `/manifest.webmanifest`, which does not require a working Supabase connection.
3. Public infrastructure smoke tests run without privileged secrets. Authenticated tests require an isolated QA environment, two explicitly named accounts, a matching Supabase project ref, and `PLAYWRIGHT_ALLOW_QA_MUTATIONS=true`.
4. Pull requests run install, lint, typecheck, build, and database-independent browser smoke tests. Authenticated mutation tests are manual through the protected `qa` GitHub environment until isolated secrets/fixtures are configured and proven.
5. Node 24 and npm 11 are the repository runtime baseline through `engines` and `.nvmrc`.
6. XLSX parsing is lazy-loaded only after a file is selected, reducing initial Employee Import client work without changing supported formats.

## Testing foundation

### Coverage retained

The Playwright suite continues to cover public routes, signed-out authorization, Employee/Company Admin/System Admin sessions, tenant isolation, feature denial, responsive navigation, attendance media, Storage, Realtime, exports, PWA behavior, and automated accessibility checks.

### Runner improvements

- Default project: Playwright-managed `chromium`; no dependency on a locally installed branded Chrome channel.
- Optional Edge project: enabled only when explicitly requested and installed.
- Server readiness: static manifest rather than a Supabase-dependent page.
- Separate commands: `test:e2e:smoke`, `test:e2e:public`, and `test:e2e:authenticated`.
- Traces and failure screenshots remain enabled.
- The suite remains serial because its authenticated scenarios share QA accounts and temporarily change company/platform state.

### Remaining limitations

- There is no unit test runner or isolated service/database integration suite.
- Authenticated tests still contain large scenarios and direct fixture orchestration; they are safe only in the isolated QA project.
- Full Edge coverage requires an installed Edge binary and explicit opt-in.
- Public page rendering beyond infrastructure smoke still requires reachable Supabase because login/setup state is database-backed.
- Test cleanup is implemented with `finally`, but process termination or provider outage can leave fixtures; QA cleanup audits remain necessary.

## QA environment contract

Use `.env.test.example` as the safe template and place real values only in ignored `.env.test.local` or protected CI secrets.

Required safeguards for authenticated tests:

- `NEXT_PUBLIC_SUPABASE_URL` points to the isolated QA project.
- `PLAYWRIGHT_QA_PROJECT_REF` exactly matches the URL hostname project ref.
- `PLAYWRIGHT_QA_ADMIN_EMPLOYEE_ID` names an active Company Admin QA employee.
- `PLAYWRIGHT_QA_EMPLOYEE_ID` names a different active non-admin QA employee in the same company.
- Both employees have Auth linkage and canonical Employee-ID-derived QA passwords.
- `PLAYWRIGHT_ALLOW_QA_MUTATIONS=true` is deliberately set for the run.
- QA credentials are never available to untrusted pull-request jobs.

Production credentials must never be copied into `.env.test.local`. The existing linked production-like project is not an acceptable target for mutation-enabled CI.

## Historical migration 0041 review

### State at review time

- Migrations `0001`-`0040` are documented as remotely applied.
- `0041_remove_audit_systems.sql` is local and unapplied.
- It removes the retired `activity_logs` and `platform_audit_logs` tables, their denial-log functions, the `audit_retention_days` setting, and two audit enum types.
- Application code no longer references the removed tables/functions. Remaining references are historical migrations, generated pre-`0041` types, schema history, and documentation.

### Dependencies and order

The migration correctly drops denial functions before `platform_audit_logs`, drops both tables before their enum types, and drops the retention column separately. No current application view, policy, service, or middleware reference was found. Historical migration `0033` copied activity data into the platform audit table, but creates no persistent dependency that should block the drops.

### Risks

- Both tables are destroyed with their retained data. Recovery requires a verified backup.
- The migration does not update `get_app_schema_version()` to `0041`; runtime telemetry would continue reporting `0040` after application.
- `lib/supabase/types.ts` still contains the removed tables/types until regeneration.
- Unknown remote-only dependencies cannot be excluded without linked dry-run/introspection.
- Removing denial/audit storage reduces forensic history; replacement application/hosting telemetry and retention ownership should be explicit.

### Historical decision — superseded

At review time, the recommendation was to retain but amend `0041` before application. That window is closed: `0041` is applied and must not be edited. Additive migration `0042` corrected telemetry, and `0043` now reports runtime schema version `0043`.

The original pre-application checklist below is retained only as historical audit evidence and is not an active instruction:

1. Back up/export the two retired audit tables if retention is required.
2. Run linked migration history and `supabase db push --linked --dry-run`.
3. Inspect remote dependencies and database lint/security advisors.
4. Amend `0041` to update schema telemetry.
5. Apply only with explicit authorization.
6. Regenerate TypeScript database types.
7. Verify application build, runtime schema status, local/remote parity, table absence, and absence of stale API calls.

## Dependency classification

Classification uses the installed lockfile and the production audit captured during Phase 1. A fresh registry query was not authorized, so no uncertain upgrade was performed.

| Package/finding            | Installed evidence                                                    | Classification                                 | Decision                                                                                                                                                                                                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js                    | `15.5.22`; audit attributes transitive PostCSS/Sharp findings to Next | Requires testing                               | Do not accept npm's invalid downgrade suggestion. Plan a controlled supported Next release upgrade with build, runtime, image, middleware, PWA, and full browser tests.                                                                                                                                         |
| PostCSS direct tooling     | `8.5.23`                                                              | Acceptable risk for direct package             | Installed direct version is newer than the vulnerable ranges recorded in the audit; the remaining vulnerable `8.4.31` copy is nested under Next. Do not force an override without framework compatibility testing.                                                                                              |
| Sharp                      | `0.34.5`, supplied through Next                                       | Requires testing                               | The recorded advisory requires a later Sharp line than Next currently resolves. Upgrade through a compatible Next release or a separately tested override; no blind override.                                                                                                                                   |
| `xlsx`                     | `0.18.5`; direct runtime dependency                                   | Requires replacement                           | npm provides no fixed compatible registry version for the recorded prototype-pollution/ReDoS findings. It parses user-controlled workbooks and generates reports. Evaluate a maintained replacement or vendor-supported SheetJS distribution; keep the 10 MB upload bound and add parser timeout/fixture tests. |
| React/React DOM            | `19.2.7`                                                              | Acceptable risk based on captured audit        | No production advisory was attributed in the captured audit. Continue framework compatibility testing.                                                                                                                                                                                                          |
| Supabase SSR/JS            | `0.12.3` / `2.110.8`                                                  | Acceptable risk based on captured audit        | No production advisory was attributed in the captured audit. Patch updates require Auth/cookie/Realtime/Storage regression tests.                                                                                                                                                                               |
| Development CLI/lint chain | Full audit contains additional development-only findings              | Requires testing / acceptable operational risk | Not shipped in the browser/server runtime, but CI and developer workstations remain exposed to build-time tooling risk. Upgrade in controlled batches and keep CI permissions minimal.                                                                                                                          |

## Code quality and maintainability

### Current strengths

- Strict TypeScript, isolated modules, no emit, Next TypeScript plugin, and successful production type validation.
- ESLint uses Next core-web-vitals and TypeScript rules with zero current warnings.
- Server-only modules guard privileged Supabase and export services.
- Feature ownership and server action/service/repository direction are well documented.
- User-facing errors are generally bounded while server logs retain diagnostic context.

### Improvements made

- Portable browser configuration and explicit test commands.
- Central QA environment validation rather than duplicated implicit assumptions.
- Runtime pinning for local/CI consistency.
- Lazy XLSX loading on the Employee Import route.
- Dedicated pull-request and manual authenticated-QA workflows.

### Remaining debt

- Several services/components exceed 500 lines.
- Employee management has two routed presentation families.
- Error logging is consistent in intent but not yet structured around correlation IDs and redaction helpers.
- Repository-wide formatting is not normalized.
- No committed unit/service integration framework exists.
- The Employee Import route remains the largest client route because parsing and wizard behavior are client-side.

## Security review

- `.env.example` and `.env.test.example` contain placeholders only; `.env`, `.env*.local`, Playwright output, and generated build state are ignored.
- Service-role construction remains in server-only infrastructure; test service keys are used only by mutation-enabled QA tests.
- Public pull-request CI receives no repository secrets and uses explicit non-secret placeholders for build-time configuration.
- Authenticated CI uses the protected `qa` environment and explicit mutation opt-in.
- Application Auth, Company Admin/System Admin boundaries, tenant scoping, RLS, Storage policies, and hidden internal Auth identities remain unchanged.

Remaining risks: historical credential rotation is unconfirmed; leaked-password protection is disabled; service-role-heavy services require continued authorization tests; authenticated definer helpers need periodic review; logs lack universal correlation/redaction structure; and `xlsx` processes untrusted files.

## Performance review

- Production build remains the authoritative bundle report.
- Employee Import fell from approximately 232 kB to 122 kB first-load JS in the Phase 2 production build. Lazy-loading `xlsx` defers parser code until file selection; it does not remove the dependency or its file-processing risk.
- Shared first-load JS is approximately 102 kB in the Phase 1 baseline.
- The production build emits webpack cache warnings for serializing 106 KiB and 254 KiB strings. These affect build-cache deserialization efficiency, not the emitted runtime or build success; profile before changing bundler configuration.
- Middleware performs Auth plus company/feature RPCs on protected navigation; measure before changing authorization architecture.
- Large imports and attendance exports remain memory-bound and should gain isolated load tests before scale work.
- No speculative memoization or component splitting was applied without profiling evidence.

## Recommended engineering order

1. Provision the isolated QA Supabase project and protected CI environment; seed only explicit synthetic QA accounts.
2. Run the manual authenticated-QA job, audit cleanup, then promote it to a required check only when deterministic.
3. Add a unit runner and pure-rule coverage, followed by isolated service/database tests.
4. Historical item completed additively: `0041` was applied, `0042` corrected telemetry, and neither applied migration may now be edited.
5. Prototype and benchmark an `xlsx` replacement behind existing parser/export interfaces.
6. Upgrade Next/PostCSS/Sharp together in a dedicated framework-maintenance change.
7. Add structured redacted logging/correlation IDs and production error monitoring.

## Verification notes

- Dependency install, lint, strict typecheck, Playwright test discovery, and production build pass.
- The Playwright-managed Chromium binary installs and launches successfully.
- The PWA asset/service-worker and signed-out notification-denial smoke assertions pass in Chromium.
- On this Windows workstation, Playwright prints both passing assertions but does not exit after stopping its managed Next production server. Direct Next CLI invocation, a database-independent readiness URL, and graceful shutdown were configured, but the shell still required an external timeout. Treat teardown as runner debt; confirm the GitHub Ubuntu workflow independently.
- The authenticated guard was exercised without QA configuration and failed immediately with the expected missing-project-ref message before any browser mutation.
