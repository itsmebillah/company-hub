# Roadmap

The roadmap prioritizes safe production operation before additional product breadth. Status is based on the current implementation, not historical sprint intent.

## Phase 0 — Production gate

- Sanitize `.env.example`; rotate exposed or uncertain Supabase credentials.
- Link the repository to the intended Vercel project and configure Preview/Production environments.
- Create the first real Admin through the bootstrap flow and verify login/logout/password update.
- Add CI for install, format check, lint, typecheck, tests, and build.
- Establish automated unit and integration coverage for critical business rules.
- Triage dependency vulnerabilities and document accepted residual risk.
- Remove or complete visible placeholder screens and panels.
- Validate backup, restore, migration rollback, and incident ownership.

## Phase 1 — Reliability and observability

- Provision the first approved System Admin and operationally validate the Platform Control Center without broadening tenant Admin access.
- Define retention and alert thresholds for centralized platform audit and feature-usage records.
- Add structured server logging with request/correlation IDs and redaction.
- Add production error monitoring and alerting for cron, Auth, imports, storage, and failed offline sync.
- Add database performance baselines, slow-query review, and index monitoring.
- Add idempotency protection to cron and externally retryable mutations where needed.
- Add health/readiness endpoints that do not disclose secrets.
- Add retention policies for activity logs, notification history, import staging rows, and private documents.

## Phase 2 — Product completeness

- Replace the `/register` placeholder with a supported registration/invitation decision.
- Finish dashboard activity/system-status panels and settings-center placeholder capabilities.
- Decide and implement leave balance/accrual rules if required by the business.
- Complete richer announcement editing or explicitly retain plain-text content.
- Add admin-visible offline sync diagnostics and retry controls.
- Add attendance correction/approval workflow if operationally required.

## Phase 3 — Scale and governance

- Formalize multi-company tenancy tests and administrative boundaries.
- Add pagination or cursor strategies to all large datasets and exports.
- Add accessibility audits and cross-browser/device matrices.
- Add data export/deletion processes and documented retention compliance.
- Introduce release environments, migration rehearsal, and automated smoke tests.
- Add filtered Platform Audit Center CSV/XLSX/PDF exports after retention and privacy requirements are approved.

## Future candidates

- Employee documents UI and lifecycle management.
- Push-provider integration beyond browser/native notification foundations.
- Analytics and operational trend reporting.
- Chat or collaboration capabilities.
- AI assistant features only after data access, audit, and privacy controls are defined.

Items should move into [BACKLOG.md](BACKLOG.md) with acceptance criteria before implementation.
