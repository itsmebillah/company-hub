# Release Checklist

Every item must be checked or explicitly waived with owner, reason, and expiry.

## Scope and change control

- [ ] Release scope and acceptance criteria are approved.
- [ ] Changelog and project state are updated.
- [ ] No unrelated changes or generated artifacts are included.
- [ ] Database/application compatibility and rollout order are reviewed.

## Source quality

- [ ] `npm ci` or approved deterministic install succeeds.
- [ ] `npm run format:check` succeeds.
- [ ] `npm run lint` succeeds under the agreed warning threshold.
- [ ] `npm run typecheck` succeeds.
- [ ] Automated tests succeed with required coverage.
- [ ] `npm run build` succeeds using production-shaped variables.
- [ ] Dependency audit findings are resolved or formally accepted.

## Secrets and security

- [ ] `.env.example` contains placeholders only.
- [ ] Secret scanning passes and no credentials exist in the diff/history under review.
- [ ] Supabase service-role and cron secrets are rotated/configured as required.
- [ ] Security headers, rate limits, and error redaction are verified.
- [ ] Supabase database lint and security advisors are reviewed.
- [ ] RLS, storage policies, and cross-company denial tests pass.
- [ ] No client bundle references server-only variables.

## Database and Supabase

- [ ] Correct project ref and organization are confirmed.
- [ ] Backup/restore point is verified.
- [ ] Local and remote migration history are compared.
- [ ] Pending migrations pass dry run and staging rehearsal.
- [ ] Migrations are applied before the dependent app deployment.
- [ ] Seed/bootstrap behavior is appropriate for the environment.
- [ ] Auth providers, redirect URLs, signup policy, email delivery, and recovery are verified.
- [ ] Storage buckets/policies and realtime publication are verified.

## Deployment

- [ ] Vercel account/team/project link is confirmed.
- [ ] Preview and Production variables are complete and environment-specific.
- [ ] Preview deployment passes smoke and accessibility checks.
- [ ] Cron schedule and `CRON_SECRET` behavior are verified.
- [ ] Production deploy owner and rollback owner are available.

## Product smoke test

- [ ] Root/setup/login/logout and role redirects.
- [ ] Admin and employee navigation on mobile/desktop.
- [ ] Employee create/edit/status/import and hierarchy.
- [ ] Resources, permissions, and announcements visibility.
- [ ] Attendance, GPS/selfie, offline queue, and reports/export.
- [ ] Leave request/decision and calendar.
- [ ] Profile/password/storage.
- [ ] Notifications, delivery tracking, realtime, and celebrations.
- [ ] Empty/error/loading/offline and dark-mode states.

## Operations

- [ ] Monitoring, alerts, dashboards, and log redaction are active.
- [ ] Support/incident contacts and escalation paths are published.
- [ ] Data retention and privacy obligations are reviewed.
- [ ] Post-deploy validation completed and release announced.

Current state does not satisfy this checklist because automated tests/CI, secret hygiene, Vercel linking, and a real Admin remain incomplete.
