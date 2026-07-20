# Contributing

## Before starting

- Read [AGENTS.md](AGENTS.md), [PROJECT_STATE.md](PROJECT_STATE.md), and [ARCHITECTURE.md](ARCHITECTURE.md).
- Review the target feature README, [KNOWN_ISSUES.md](KNOWN_ISSUES.md), and relevant decision records.
- Create or reference a backlog item with scope and acceptance criteria.
- Check `git status`; do not overwrite unrelated changes.

## Branches and commits

Use short-lived branches and focused commits. Conventional-style subjects are encouraged:

```text
feat(attendance): add correction request flow
fix(auth): reject inactive employee sessions
docs(database): document notification RLS
```

Do not combine feature behavior, broad formatting, dependency upgrades, and migrations without a clear reason.

## Implementation workflow

1. Trace the full current flow and identify authorization/data boundaries.
2. Write or update tests first when changing a critical rule.
3. Implement through established page/action/service/repository layers.
4. Add forward-only migrations and RLS/policy decisions where needed.
5. Update feature/root documentation and changelog.
6. Run required verification and review the diff for secrets/generated files.

## Pull request expectations

Describe:

- Problem and user/operational impact.
- Solution and alternatives considered.
- Authorization, privacy, migration, and rollback implications.
- Screenshots for UI changes at mobile/desktop and light/dark where relevant.
- Commands/tests executed and their results.
- Known limitations and follow-up backlog items.

Reviewers should reject raw provider errors, client-side-only authorization, service-role access without context checks, rewritten migrations, secrets, unbounded queries, and undocumented behavior.

## Local verification

```powershell
npm.cmd install
npm.cmd run format:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

For database changes, also run dry-run/history/lint/security checks against an authorized non-production project before production.

## Documentation changes

Implementation is the source of truth, but undocumented implementation is incomplete. Update:

- `FEATURES.md` and `PROJECT_STATE.md` for status.
- `DATABASE.md` for schema/storage/realtime.
- `API.md` for handlers/actions with external contracts.
- `AUTH.md`/`SECURITY.md` for identity/access changes.
- `ROADMAP.md`, `BACKLOG.md`, and `KNOWN_ISSUES.md` as status changes.
- `DECISIONS.md` for durable architecture choices.
- `CHANGELOG.md` for user-visible, operational, security, or schema changes.

## Security and data

- Never commit `.env.local`, keys, tokens, employee exports, precise location samples, or production screenshots containing personal data.
- Use disposable `example.invalid` identities in tests and clean all test records.
- Report vulnerabilities privately.

## Definition of done

The change is scoped, reviewed, tested proportionately, documented, migration-safe, accessible, and free of secrets/generated artifacts. Warnings and incomplete behaviors are disclosed rather than hidden.
