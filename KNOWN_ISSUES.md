# Known Issues

Last reconciled: 2026-08-18

## Platform operations

- No first System Admin has been provisioned (`platform_admins` is empty by design). The control center remains inaccessible until the owner explicitly approves an existing active Auth identity.

## Critical

No unresolved application-critical defect was reproduced in the latest documented production verification. Historical Supabase credential rotation remains an operational action because repository history cannot prove whether prior example values were revoked.

## High

### Production Google Drive OAuth requires renewal

The 2026-08-13 Phase 4.1 regression check verified four attendance attachments as durably synced with Drive IDs, but all four live readability checks stopped at OAuth token acquisition. Production logs report the redacted `drive-oauth` authentication category; no file request or deletion occurred. The local least-privilege `drive.file` migration, Picker flow, and fail-closed `isAppAuthorized` checks are prepared but not cut over. The expired production full-scope grant remains untouched until explicit approval. Before rotation, the operational account must authorize the existing Selfies folder and all four stored references must pass the read-only authorization audit. Do not delete or recreate the existing Drive files.

### Authenticated browser and lower-level coverage are incomplete

Pull requests run install, lint, typecheck, build, and database-independent Chromium smoke coverage. The release workflow additionally runs database connection validation, migration parity, database lint, and production HTTP verification. Full authenticated mutation coverage remains a protected manual job until the isolated Supabase project, synthetic accounts, mutation opt-in, and cleanup monitoring are configured. No committed unit/service integration runner exists.

### Dependency advisories require compatibility-tested maintenance

The 2026-08-13 installation audit reported 36 findings: 1 low, 11 moderate, 23 high, and 1 critical across production and development dependencies.

The production-only audit reported five high-severity affected packages/paths:

- `nanoid` reports a non-breaking fix through `npm audit fix`, but the exact lockfile change and application compatibility require a separate reviewed maintenance change.
- Next.js-bundled `postcss` and `sharp` remain affected; npm proposes a breaking Next.js 16 upgrade.
- `xlsx` has prototype-pollution and ReDoS advisories with no available upstream fix. The Employee Import route lazy-loads it after file selection, reducing initial exposure but not eliminating untrusted-workbook parsing risk.

Do not run `npm audit fix --force`. Reassess `xlsx` replacement, bound workbook size/rows, and test a supported Next.js upgrade separately. Audit totals are time-sensitive.

## Medium

### Historical migrations do not fully reproduce the linked schema

`supabase db diff --linked` completes but emits a broad destructive diff across historical foreign keys, policies, views, functions, indexes, and the `pg_net` extension. Migration history and database lint pass through `0043`; this is a pre-existing canonical-history reproducibility gap, not an `0043` runtime failure. Never apply the generated destructive diff. Reconcile the historical baseline in an isolated project first.

### Additional Google Sheets datasets are not approved

Durable Holidays synchronization is active and production-verified. Employees, Leave, and Attendance remain excluded until separate privacy allowlists, row contracts, consumer access, and retention rules are approved.

### Integration governance remains incomplete

Formal owners are still required for Google account recovery, credential rotation, workbook editors/viewers, protected ranges, field allowlists, reporting freshness, failure notifications, facial-image retention/consent, deletion, legal hold, and incident response. Production resources must remain restricted.

### Isolated production authorization event requires monitoring

One `POST /login` returned 500 immediately after the 2026-07-26 deployment, with the bundled stack originating at `requireCompanyAdmin`. The event was not reproduced: subsequent Company Admin and Employee authentication, routing, profile, authorization, and logout checks passed, followed by an empty error-log check. Preserve request/action identifiers if it recurs; do not weaken the guard speculatively.

### Security Advisor retains reviewed warnings

Authenticated `SECURITY DEFINER` helpers remain executable because middleware, Storage/RLS, notification visibility, and caller-derived telemetry require them. Their predicates derive identity from `auth.uid()` and expose no service-role inputs, but each requires continued review. Supabase leaked-password protection is disabled.

### Repository-wide formatting baseline is incomplete

The last documented repository-wide Prettier check reported 353 differing files. Complete formatting as a scoped change; do not mix it with product behavior work.

### Local Supabase stack requires Docker Desktop

Schema dump/local-stack commands requiring Docker cannot run until Docker Desktop is available. Linked remote migration, lint, and type-generation commands remain usable.

## Low

### Windows Playwright teardown can hang

Portable Chromium smoke assertions pass, but the Playwright process can remain alive after its managed Next server stops on this Windows workstation. Validate the Ubuntu workflow separately before relying on the Windows teardown result.

### Isolated QA accounts block complete attendance mutation verification

Full check-in, checkout, GPS, selfie, duplicate, provider-outage, retry, and error-path verification requires the isolated QA contract. Production identities and records must not be used as substitutes.

### Edge coverage is optional

Bundled Chromium is the baseline. Set `PLAYWRIGHT_INCLUDE_EDGE=true` only where Edge is installed or `EDGE_EXECUTABLE_PATH` is provided.

### PowerShell npm shim

The workstation execution policy blocks `npm.ps1`. Use `npm.cmd` or an approved workstation policy change.

### Offline attendance queue is browser-local

Queued attendance actions use browser storage and can be lost if storage is cleared. Failed items have limited inspect/retry/discard controls, and selfie-required attendance still needs a network connection for evidence upload.

### Generated artifacts require routine cleanup

`.next/`, `tsconfig.tsbuildinfo`, Playwright output, Supabase CLI state, logs, exports, and disposable verification data are not product source and must not be committed.
