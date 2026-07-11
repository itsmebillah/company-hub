# Company Hub Architecture

Company Hub is a Next.js App Router application backed by Supabase. The codebase is organized around feature modules so future work can be scoped quickly and safely.

## Top-Level Structure

- `app/`: route groups, pages, layouts, route handlers, loading and error boundaries.
- `components/`: shared UI, app shell, admin shell, layout primitives, common visual components.
- `features/`: business modules with their actions, components, services, repositories, constants, and types.
- `lib/`: cross-cutting infrastructure such as Supabase clients, environment parsing, dates, media helpers, and navigation.
- `docs/`: project specifications and architecture references.
- `supabase/`: schema migrations and seed files.

## Feature Architecture

Feature modules follow this shape when needed:

```text
features/<feature>/
  actions/
  components/
  constants/
  repositories/
  services/
  types/
  ui/
  utils/
  README.md
```

Keep files focused. Components should primarily render UI. Server actions should validate request boundaries and call services. Services own business flow. Repositories own direct Supabase access when the feature has a repository layer.

## Dependency Direction

Preferred dependency flow:

```text
Page
  -> Action
  -> Service
  -> Repository
  -> Supabase
```

Pages may call read-only services for server-rendered data. Client components may call server actions but must not contain privileged Supabase logic.

## Authentication Flow

Users sign in with Employee ID and password. The server resolves the Employee ID to the internal Supabase Auth email, verifies employee status, signs in through Supabase Auth, loads role context, and redirects by role.

Rules:

- Never expose `internal_auth_email`.
- Never expose `auth_user_id`.
- Inactive employees cannot sign in.
- Admin users land in `/admin/dashboard`.
- Non-admin employees land in `/dashboard`.

## Authorization Flow

Authorization is role-aware and company-aware. Services should resolve the current employee or company context through shared auth helpers rather than selecting the first active company.

Resource visibility is server-side:

```text
employee -> company_id + role_id -> active categories/resources -> active permissions
```

Announcements are server-side:

```text
employee -> company_id + role_id -> active announcements -> publish window -> target audience
```

## Dashboard Flow

Admin dashboard data is loaded through `DashboardService`. The page composes presentation components only. Dashboard UI config lives in dashboard constants so the route stays small and searchable.

Employee dashboard data is loaded from employee-resource and announcement services. It must only display resources and announcements the employee can access.

## Attendance Flow

Attendance uses server timestamps and attendance services. GPS validation is handled server-side using assigned company locations. UI should call actions, not repositories.

## Leave Flow

Leave requests are created by employees, reviewed by admins/managers, and logged through notifications and activity logs. Leave balance remains foundation-level unless a sprint explicitly extends it.

## Announcement Flow

Admin creates or updates announcements with a target audience. Targeting supports company, roles, and employees. Employee pages and tickers consume the same filtered service.

## Resource Flow

Admins create categories, resources, and permissions. Employee portals load active resources grouped by active category and filtered by active permissions.

## Employee Flow

Admins create employees. Employee ID is immutable after creation. Creation generates internal auth email, creates Supabase Auth user, stores `auth_user_id`, and uses Employee ID as initial password.

## Media Flow

Components should use shared media helpers for rendering object paths. Upload logic should be centralized in storage services when media architecture is expanded. Database columns should store object keys, not public URLs.

## Coding Conventions

- Prefer feature-local code over global utilities unless shared by multiple features.
- Keep services focused and split large services by responsibility.
- Keep route files as composition layers.
- Prefer barrel exports for feature public APIs.
- Add comments only for non-obvious business rules.
- Preserve business behavior during refactor-only sprints.

## Dependency Rules

- Do not call service-role Supabase clients from client components.
- Do not bypass services for mutations.
- Do not hardcode company IDs.
- Do not duplicate permission filtering in UI.
- Do not change database schema in refactor-only sprints.

## AI Navigation Tips

- Start with this file and `docs/MASTER_SPEC.md`.
- Then open the feature `README.md`.
- Then inspect that feature's action, service, repository, and component folders.
- Use constants files for labels, routes, and display config before editing UI strings.
