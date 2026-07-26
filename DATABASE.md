# Database

## Source of truth

`supabase/migrations/` is the canonical schema history. Migrations `0001`–`0040` are applied to project `jjfktbgfwvekhlvyjlww`; migration `0041` removes the retired logging tables and related database objects and is pending remote application. Never edit an applied migration; add the next ordered migration.

`platform_features.state` is authoritative. `allow_company_override` determines whether `company_features.company_state` (`inherit`, `enabled`, or `disabled`) participates in resolution. `is_feature_enabled_for_company` and `can_access_any_feature` expose the canonical platform-first decision to server and middleware callers. `platform_feature_company_summary` supplies aggregate override counts without exposing tenant configuration rows.

`platform_releases` stores semantic release metadata, deployment/commit provenance, publication controls, and future-ready rollback metadata. `release_receipts` records per-Auth-user acknowledgement. RLS exposes only published release rows to ordinary clients and only a caller's own receipt; System Admin mutations remain server-authorized.

The live verified catalog contains 27 public tables and the security-invoker `platform_company_overview` view. The original 1,748 restored application rows remain intact; migration `0030` backfilled the existing company status and seeded only the 14-row feature catalog. Migration `0035` adds one default `platform_settings` singleton row.

## Domain tables

| Domain              | Tables                                                                          | Purpose                                                                          |
| ------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Organization        | `companies`, `company_settings`, `roles`, `employees`                           | Tenant, branding/policy, roles, employee identity/hierarchy                      |
| Resources           | `resource_categories`, `resources`, `resource_permissions`                      | Resource catalog and public/role/employee visibility                             |
| Announcements       | `announcements`, `announcement_roles`, `announcement_employees`                 | Scheduled content and targeting                                                  |
| Attendance          | `attendance_records`, `company_locations`, `employee_location_access`           | Daily records, GPS locations, assignments, policy snapshots                      |
| Leave/calendar      | `leave_types`, `leave_requests`, `holiday_calendars`, `holiday_events`          | Leave workflow and working-day context                                           |
| Import              | `employee_import_jobs`, `employee_import_rows`                                  | Durable bulk-import staging and outcomes                                         |
| Celebrations        | `employee_celebration_events`                                                   | Per-year birthday/anniversary generation deduplication                           |
| Platform control    | `platform_admins`, `platform_settings`, `platform_features`, `company_features` | Explicit global authorization, global configuration, and two-level feature state |

## Key relationships

```text
companies
  ├─ roles
  ├─ employees ── manager_id → employees
  │    ├─ auth_user_id → auth.users
  │    ├─ attendance_records
  │    ├─ leave_requests
  │    └─ employee_location_access → company_locations
  ├─ company_settings
  ├─ resource_categories ── resources ── resource_permissions
  ├─ announcements ── announcement_roles / announcement_employees
  ├─ notifications
  ├─ holiday_calendars ── holiday_events
  └─ employee_import_jobs ── employee_import_rows
```

Composite company foreign keys prevent cross-company role, resource, announcement, and employee references. Unique constraints protect employee ID/email, role order/name, resource/category order, daily attendance, location codes/defaults, leave codes, and celebration event identity.

## Lifecycle and policy enums

- `record_status`: active, inactive, archived.
- Resource: `resource_type`, `resource_open_mode`, `permission_type`.
- Communication: `announcement_priority`, `notification_type`, `notification_priority`, `notification_delivery_status`.
- Attendance: `attendance_status`, `attendance_type`, `attendance_location_source`, `attendance_policy_mode`, `employee_work_mode`.
- Organization: `company_location_type`.
- Leave/calendar: `leave_request_status`, `holiday_type`.
- Import: `employee_import_file_type`, `employee_import_status`, `employee_import_row_status`.
- Celebration: `celebration_event_type`.

## Functions

- `get_company_celebrants(company, date)`: returns birthday/work-anniversary candidates.
- `is_active_employee(user_id)`: caller-constrained storage authorization helper.
- `is_company_admin(user_id)`: internal caller-constrained Company Admin predicate.
- `is_admin_user(user_id)`: compatibility wrapper retained for historical policies; new code uses Company Admin terminology.
- `can_access_company_admin()`: authenticated middleware predicate for `/admin/*`.
- `can_company_admin_manage_storage_object(bucket, path, user_id)`: validates company-prefixed shared media or same-company employee-owned paths.
- `is_self_storage_object(name, user_id)`: checks the first object-path segment.
- `can_receive_notification(employee_id, company_id)`: caller-derived notification RLS predicate.

Security-definer helpers set a controlled search path. Anonymous execution is revoked for privileged helpers.

## RLS

All 27 public tables have RLS enabled. Direct access is default-deny except:

- Authenticated employees may SELECT notification rows allowed by `can_receive_notification`.
- Company Admin and employee CRUD continues through authorized, tenant-scoped server services using service role.

Any new table must enable RLS in its creation migration and document whether browser access is required. Avoid broad `authenticated using (true)` policies.

Platform-control tables expose no direct `anon` or `authenticated` grants. Browser access is limited to caller-derived company/feature checks and telemetry RPCs; cross-company reads and mutations use server-only access after explicit System Admin authorization.

## Platform feature resolution

Availability is `active company AND enabled platform feature AND company override not disabled`. Missing company overrides inherit enabled for backward compatibility. A platform-disabled feature cannot be re-enabled by a company. Future states (`beta`, `hidden`, `deprecated`) are stored additively but treated as disabled by the current application.


## Realtime

`public.notifications` is the only application table in `supabase_realtime`. Its RLS SELECT policy controls which authenticated events can be delivered. Realtime was verified using a disposable Auth user, employee, filtered subscription, and notification row.

## Storage

| Bucket                | Visibility | Current usage                                         |
| --------------------- | ---------- | ----------------------------------------------------- |
| `profile-photos`      | Public     | Employee owner or same-company Company Admin mutation |
| `announcement-images` | Public     | Company-prefixed announcement media                   |
| `company-assets`      | Public     | Company-prefixed branding assets                      |
| `resource-icons`      | Public     | Company-prefixed Quick Link imagery                   |
| `category-icons`      | Public     | Company-prefixed category imagery                     |
| `system-assets`       | Public     | Global assets; no Company Admin mutation grant        |
| `employee-documents`  | Private    | Owner or same-company Company Admin policies          |
| `leave-attachments`   | Private    | Owner or same-company Company Admin policies          |
| `attendance-selfies`  | Private    | Server/service-role attendance uploads                |

Eleven policies on `storage.objects` cover active-employee reads, company-prefixed shared media, profile ownership, and private owner/same-company Company Admin access. Cross-company Company Admin object mutation and tenant mutation of `system-assets` are denied. Attendance selfies intentionally use server-only service role.

Quick Link custom images use the existing `resources.thumbnail` object-path field and `resource-icons` bucket, so existing `resources.icon` names remain compatible and no schema migration is required. New uploads are company-scoped under `<company-id>/resources/`; replaced, canceled, and failed-save uploads are removed only when no resource still references the object.

## Seed data

Migration `0003_seed_data.sql` creates the historical seed roles; migration `0036` deterministically advances `Admin` to `Company Admin`. The resulting tenant roles are Company Admin, Sales Head, RSM, TSO, and SR. `supabase/seed/` contains no additional seed script.

Seed data does not create a persistent Auth user or employee. The live target is no longer seed-only: it contains the verified migrated company dataset and 17 employee/Auth links. `/setup` remains the empty-project bootstrap path, not a migration step.

## Migration workflow

```powershell
./node_modules/.bin/supabase.cmd migration list --linked
./node_modules/.bin/supabase.cmd db push --linked --dry-run
./node_modules/.bin/supabase.cmd db push --linked --yes
./node_modules/.bin/supabase.cmd db lint --linked --level warning
./node_modules/.bin/supabase.cmd db advisors --linked --type security
```

After applying, compare local/remote history, generate types, run behavioral checks, and update this document. Docker Desktop is required for local stack and `db dump`; linked query/push/lint work without it.
