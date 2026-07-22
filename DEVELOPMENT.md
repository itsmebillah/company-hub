# Development

## Prerequisites

- Git.
- Node.js and npm. Latest verified locally: Node 24.16.0, npm 11.13.0. The repository does not yet pin an engine version; align local and CI versions before production.
- Access to the Supabase project or a dedicated development project.
- Supabase CLI and Vercel CLI are installed as project dev dependencies.
- Docker Desktop only if using the local Supabase stack, schema dump, or local database reset.

## Setup

```powershell
git clone <repository-url>
Set-Location company-hub
npm.cmd install
Copy-Item .env.example .env.local
```

Populate `.env.local` with valid values. Do not copy unsafe committed credentials; obtain keys from the intended Supabase project.

| Variable                        | Scope       | Purpose                                                     |
| ------------------------------- | ----------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | Public      | Canonical app URL; local default is `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public      | Supabase project URL                                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public      | Browser/Auth/realtime key                                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server only | Privileged services and Auth administration                 |
| `CRON_SECRET`                   | Server only | Bearer secret for celebration cron                          |

The application validates Supabase variables lazily through `lib/env.ts`; a build can pass while a runtime path with missing variables fails. Validate the file explicitly.

## Start development

```powershell
npm.cmd run dev
```

Open `http://localhost:3000`. On a fresh database with no active Company Admin, `/` redirects to `/setup`. Otherwise it redirects to `/login` or the current user's dashboard.

PowerShell may block `npm.ps1`; use `npm.cmd` if `npm` reports an execution-policy error.

## Standard commands

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run format:check
npm.cmd run format
npm.cmd run build
npm.cmd run start
npm.cmd run test:e2e
```

The Playwright suite uses installed Chrome and Edge channels. Set `EDGE_EXECUTABLE_PATH` only when Edge is installed outside its standard channel location. Set `PLAYWRIGHT_USE_PRODUCTION=1` after `npm.cmd run build` to test the production server instead of the development server.

## Supabase workflow

```powershell
./node_modules/.bin/supabase.cmd projects list
./node_modules/.bin/supabase.cmd link --project-ref jjfktbgfwvekhlvyjlww
./node_modules/.bin/supabase.cmd migration list --linked
./node_modules/.bin/supabase.cmd db push --linked --dry-run
```

Create migrations under `supabase/migrations/` using the next ordered four-digit prefix used by this repository. Do not modify applied migrations. Apply remote migrations only with authorization and verify history, database lint, security advisors, generated types, and behavior.

## Working in a feature

1. Read the feature README and related root docs.
2. Trace page → action → service → repository → migration/types.
3. Put business rules in services/validators, not components.
4. Use current employee/company context before service-role access.
5. Update docs and changelog with behavior changes.
6. Run proportionate verification before handoff.

## Local generated files

Do not commit `.env.local`, `.next/`, `tsconfig.tsbuildinfo`, `.codex-dev.log`, `supabase/.temp/`, exports, or disposable verification data. Review `git status` before every commit.

## Database type synchronization

`lib/supabase/types.ts` describes the application schema. After an approved migration, regenerate or reconcile it with the linked schema and typecheck every consumer. Never hand-wave a schema/type mismatch.
