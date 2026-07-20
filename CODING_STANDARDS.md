# Coding Standards

## Language and formatting

- TypeScript strict mode is mandatory; avoid `any` and unsafe assertions.
- Prettier is canonical: semicolons, double quotes, trailing commas, Tailwind class sorting.
- Folders/files use kebab-case; React components and TypeScript types use PascalCase.
- Database identifiers use snake_case; enum values use snake_case.
- Prefer named domain types over repeated object literals.

## Module ownership

- Put domain behavior in `features/<domain>`.
- Keep route/page files focused on authorization-aware composition.
- Server actions validate boundary input, call services, translate errors, and revalidate paths.
- Services own business rules and transactions/rollback orchestration.
- Repositories own direct Supabase queries when a repository layer exists.
- Add global helpers to `lib/` only when multiple features genuinely share them.

## Server and client boundaries

- Add `import "server-only"` to modules that access service role, privileged data, or server context.
- Do not import admin client into client components.
- Minimize `"use client"`; keep initial data loading in server components.
- Client-side filtering is never authorization.
- Pass minimal serializable props to clients.

## Data access

- Resolve current employee/company context before every service-role operation.
- Select only required columns; do not return internal identity fields.
- Check and handle every Supabase error.
- Avoid N+1 queries; batch IDs and use joins/parallel bounded reads.
- Paginate lists and bound exports/import batches.
- Use server timestamps for authoritative events.

## Validation and errors

- Validate required fields, enum membership, format, lifecycle transition, company ownership, and authorization server-side.
- Client validation is UX only.
- Return actionable user messages; log technical context server-side with redaction.
- Do not leak raw Supabase/Auth/database errors.
- Roll back partial Auth/database/storage work where a cross-system transaction is impossible.

## React and UI

- Prefer composition and small focused components.
- Use existing `app-*` design utilities and shared Button/component patterns.
- Use stable keys, semantic elements, accessible names, visible focus, and pending states.
- Avoid unnecessary effects and duplicated derived state.
- Respect dark mode, mobile navigation, reduced motion, and offline behavior.

## Database and security

- New schema changes require ordered migrations, indexes, constraints, and RLS decisions.
- Never edit an applied migration.
- Security-definer functions require a controlled `search_path`, least-privilege grants, and caller binding.
- Store object paths rather than signed/public URLs where the schema expects paths.
- Do not hardcode company IDs except documented fixed seed/test identifiers.

## Comments and documentation

- Comment non-obvious invariants and security decisions, not syntax.
- Keep feature README and root docs synchronized with behavior.
- Add a changelog entry for user-visible, operational, schema, or security changes.
- Record durable architectural choices in [DECISIONS.md](DECISIONS.md).

## Definition of done

- Scope is complete without unrelated refactors.
- Success, validation, denial, empty, failure, and cleanup paths are checked.
- Lint, typecheck, and build pass.
- Tests are added/updated once the test harness exists.
- Migrations and environment changes are documented.
- `git diff` contains no secrets, generated artifacts, or accidental user changes.
