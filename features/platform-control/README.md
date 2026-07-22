# Platform Control Center

This feature owns global Company Hub operations. `/platform/*` requires an active row in `platform_admins`; a company `Admin` role is never sufficient.

## Resolution and enforcement

Feature availability is `active company AND enabled platform feature AND company override not disabled`. Missing overrides inherit enabled so existing companies keep working. Middleware rejects disabled direct routes and Server Action posts; server layouts also remove navigation and dashboard affordances.

Platform, company, login/logout, bridged activity, and denied-access events are stored in `platform_audit_logs`. Successful routed feature use increments `feature_usage_daily`. Company Admins see only their own company events; System Admins can filter across companies.

## Provisioning

Migration `0030` does not auto-promote anyone. Approve the first System Admin only after confirming the intended active employee/Auth identity, then insert its Auth UUID and display name into `platform_admins` through a trusted service-role or database administration session. Never expose internal Auth email mappings or accept a client-supplied UUID as proof of authority.

## Routes

- `/platform/dashboard`: platform health and operating metrics.
- `/platform/companies`: atomic company bootstrap and reversible lifecycle status.
- `/platform/people`: cross-company employee/Admin visibility and confirmed, audited initial-password reset.
- `/platform/features`: global state, company overrides, and 30-day usage.
- `/platform/audit`: searchable/filterable paginated cross-company events with CSV/Excel export.
- `/platform/settings`: default-deny global branding and operational configuration.
- `/admin/settings/features`: current-company feature overrides.
- `/admin/audit`: current-company event history.

PDF export and retention automation are planned enhancements.
