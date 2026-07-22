# Database

## Source of truth

`supabase/migrations/` is the canonical schema history. Migrations `0001`–`0034` are applied to project `jjfktbgfwvekhlvyjlww`. Never edit an applied migration; add the next ordered migration. Migration `0030` adds the Platform Control Center; `0031` removes anonymous helper execution; `0032` makes schema telemetry invoker-safe; `0033` adds atomic company-name synchronization plus historical activity import; and `0034` removes an argument/column ambiguity in the company-name RPC.

The live verified catalog contains 26 public tables and the security-invoker `platform_company_overview` view. The original 1,748 restored application rows remain intact; migration `0030` backfilled the existing company status and seeded only the 14-row feature catalog.

## Domain tables

| Domain              | Tables                                                                 | Purpose                                                     |
| ------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| Organization        | `companies`, `company_settings`, `roles`, `employees`                  | Tenant, branding/policy, roles, employee identity/hierarchy |
| Resources           | `resource_categories`, `resources`, `resource_permissions`             | Resource catalog and public/role/employee visibility        |
| Announcements       | `announcements`, `announcement_roles`, `announcement_employees`        | Scheduled content and targeting                             |
| Notifications/audit | `notifications`, `activity_logs`                                       | User/company notifications, delivery state, audit history   |
| Attendance          | `attendance_records`, `company_locations`, `employee_location_access`  | Daily records, GPS locations, assignments, policy snapshots |
| Leave/calendar      | `leave_types`, `leave_requests`, `holiday_calendars`, `holiday_events` | Leave workflow and working-day context                      |
| Import              | `employee_import_jobs`, `employee_import_rows`                         | Durable bulk-import staging and outcomes                    |
| Celebrations        | `employee_celebration_events`                                          | Per-year birthday/anniversary generation deduplication      |
| Platform control    | `platform_admins`, `platform_features`, `company_features`             | Explicit global authorization and two-level feature state   |
| Platform telemetry  | `platform_audit_logs`, `feature_usage_daily`                           | Central audit events and daily request aggregates           |

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
  ├─ activity_logs
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
- `is_admin_user(user_id)`: caller-constrained Admin storage authorization helper.
- `is_self_storage_object(name, user_id)`: checks the first object-path segment.
- `can_receive_notification(employee_id, company_id)`: caller-derived notification RLS predicate.

Security-definer helpers set a controlled search path. Anonymous execution is revoked for privileged helpers.

## RLS

All 26 public tables have RLS enabled. Direct access is default-deny except:

- Authenticated employees may SELECT notification rows allowed by `can_receive_notification`.
- Admin/company and employee CRUD continues through authorized server services using service role.

Any new table must enable RLS in its creation migration and document whether browser access is required. Avoid broad `authenticated using (true)` policies.

Platform-control tables expose no direct `anon` or `authenticated` grants. Browser access is limited to caller-derived company/feature checks and telemetry RPCs; cross-company reads and mutations use server-only access after explicit System Admin authorization.

## Platform feature resolution

Availability is `active company AND enabled platform feature AND company override not disabled`. Missing company overrides inherit enabled for backward compatibility. A platform-disabled feature cannot be re-enabled by a company. Future states (`beta`, `hidden`, `deprecated`) are stored additively but treated as disabled by the current application.

Migration `0033` imports existing immutable `activity_logs` rows into the centralized audit stream with original timestamps and source IDs.

## Realtime

`public.notifications` is the only application table in `supabase_realtime`. Its RLS SELECT policy controls which authenticated events can be delivered. Realtime was verified using a disposable Auth user, employee, filtered subscription, and notification row.

## Storage

| Bucket                | Visibility | Current usage                                        |
| --------------------- | ---------- | ---------------------------------------------------- |
| `profile-photos`      | Public     | Employee profile photos; owner/Admin mutation policy |
| `announcement-images` | Public     | Announcement media; Admin mutation policy            |
| `company-assets`      | Public     | Branding assets; Admin mutation policy               |
| `resource-icons`      | Public     | Resource Quick Link imagery; Admin mutation policy   |
| `category-icons`      | Public     | Category imagery; Admin mutation policy              |
| `system-assets`       | Public     | Shared system assets; Admin mutation policy          |
| `employee-documents`  | Private    | Foundation; owner/Admin policies                     |
| `leave-attachments`   | Private    | Foundation; owner/Admin policies                     |
| `attendance-selfies`  | Private    | Server/service-role attendance uploads               |

Eleven policies on `storage.objects` cover active-employee reads, Admin shared-object mutation, profile ownership, and private owner/Admin access. Attendance selfies intentionally use server-only service role. The restored Storage state contains nine matching bucket definitions and four objects whose downloaded bytes match the source SHA-256 checksums.

Quick Link custom images use the existing `resources.thumbnail` object-path field and `resource-icons` bucket, so existing `resources.icon` names remain compatible and no schema migration is required. New uploads are company-scoped under `<company-id>/resources/`; replaced, canceled, and failed-save uploads are removed only when no resource still references the object.

## Seed data

Migration `0003_seed_data.sql` creates the fixed Company Hub company UUID, five system roles (Admin, Sales Head, RSM, TSO, SR), and company settings. `supabase/seed/` contains no additional seed script.

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
