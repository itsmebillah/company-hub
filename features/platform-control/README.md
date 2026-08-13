# Platform Control Center

This feature owns global Company Hub operations. `/platform/*` requires an active row in `platform_admins`; a `Company Admin` tenant role is never sufficient.

## Resolution and enforcement

Feature availability is `active company AND enabled platform feature AND company override not disabled`. Missing overrides inherit enabled so existing companies keep working. Middleware rejects disabled direct routes and Server Action posts; server layouts also remove navigation and dashboard affordances.

## Provisioning

Migration `0030` does not auto-promote anyone. Approve the first System Admin only after confirming the intended active employee/Auth identity, then insert its Auth UUID and display name into `platform_admins` through a trusted service-role or database administration session. Never expose internal Auth email mappings or accept a client-supplied UUID as proof of authority.

## Routes

- `/platform/dashboard`: platform health and operating metrics.
- `/platform/companies`: atomic company bootstrap and reversible lifecycle status.
- `/platform/features`: global state, company overrides, and 30-day usage.
- `/platform/settings`: default-deny global branding and operational configuration.
- `/platform/people`: cross-company employee and Company Admin visibility.
- `/platform/releases`: release metadata, update policy, and maintenance state.
- `/admin/settings/features`: current-company feature overrides.

The former Platform Audit and Company Audit routes were removed with migration `0041`.
