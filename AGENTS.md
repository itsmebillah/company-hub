# Engineering Agent Guide

This file applies to the entire repository. Treat implementation, migrations, and the root documentation set as one synchronized system.

## Start here

1. Read [PROJECT_STATE.md](PROJECT_STATE.md) and [KNOWN_ISSUES.md](KNOWN_ISSUES.md).
2. Read [ARCHITECTURE.md](ARCHITECTURE.md) and the target feature's `README.md`.
3. Inspect the page, action, service, repository, types, and migrations involved before editing.
4. Check `git status` and preserve unrelated user changes.

## Architecture boundaries

- `app/` composes routes, layouts, loading/error states, and HTTP handlers.
- `features/` owns business behavior. Preferred flow: page → server action → service → repository → Supabase.
- `components/` contains shared presentation and shell components.
- `lib/` contains cross-cutting infrastructure, not feature business rules.
- Privileged Supabase access must use `lib/supabase/admin.ts` from server-only code.
- Client components may use the browser client only for Auth, approved storage operations, and scoped realtime subscriptions.
- Resolve the current company and employee from authenticated context. Never select an arbitrary or first company.

## Invariants

- Users sign in with Employee ID and enter that same original ID as the default password; internal auth email stays server-side.
- Before Supabase Auth receives an Employee-ID-derived password, use `toSupabaseEmployeePassword`: IDs shorter than six characters are left-padded with zeroes to six. Never expose or ask users for the padded value.
- Never expose `internal_auth_email`, `auth_user_id`, service-role keys, or raw provider errors.
- Employee ID is normalized and immutable after creation.
- An employee has one role; hierarchy uses `employees.manager_id`.
- Resource and announcement visibility is enforced server-side.
- Application tables have RLS enabled. New tables require RLS and explicit policy decisions in the same migration.
- Store storage object paths in database columns, not signed URLs.
- Use server timestamps for attendance and server-side GPS validation.

## Database changes

- Add a new ordered file after the canonical applied range `0001`–`0034`; never rewrite a migration already applied remotely.
- Make migrations deterministic and safe for the current live schema.
- Add indexes for foreign keys and high-frequency filters.
- Verify with `supabase db push --linked --dry-run`, then apply only with explicit authorization.
- Run database lint/security advisors and compare local versus remote migration history after applying.
- Do not place verification SQL or generated dumps outside `supabase/.temp/`; remove temporary artifacts when finished.

## Required validation

For documentation-only changes, run link/path checks and inspect the diff. For application or database changes, run:

```powershell
npm install
npm run lint
npm run typecheck
npm run build
```

Test the affected success path, validation failure, authorization denial, empty state, and rollback/cleanup behavior. Do not claim automated coverage: this repository currently has no committed test runner or CI workflow.

## Change discipline

- Keep changes scoped; do not mix feature work with opportunistic refactors.
- Use strict TypeScript and existing feature patterns.
- Keep route files small and business rules in services.
- Update relevant root docs, feature README, API docs, database docs, roadmap/backlog, and changelog when behavior changes.
- Do not edit or reveal `.env.local` values. `.env.example` must contain names and safe placeholders only.
- Do not commit `.next/`, `tsconfig.tsbuildinfo`, CLI state, logs, exports, or disposable test data.

## Handoff format

Report the outcome first, files changed, verification executed, migrations applied, and remaining risks. Distinguish warnings from failures and never hide incomplete behavior behind a PASS label.
