-- Platform Control Center foundation.
-- Existing companies retain all features unless an explicit company override
-- is disabled. No existing company Admin is promoted to System Admin.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'platform_feature_state') then
    create type public.platform_feature_state as enum (
      'enabled',
      'disabled',
      'beta',
      'hidden',
      'deprecated'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'platform_company_status') then
    create type public.platform_company_status as enum (
      'active',
      'inactive',
      'suspended',
      'deleted'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'platform_audit_category') then
    create type public.platform_audit_category as enum (
      'audit',
      'activity',
      'login',
      'security',
      'feature_usage',
      'error'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'platform_audit_status') then
    create type public.platform_audit_status as enum (
      'success',
      'failure',
      'denied',
      'warning'
    );
  end if;
end
$$;

alter table public.companies
  add column if not exists platform_status public.platform_company_status;

update public.companies
set platform_status = case
  when status = 'active' then 'active'::public.platform_company_status
  else 'inactive'::public.platform_company_status
end
where platform_status is null;

alter table public.companies
  alter column platform_status set default 'active',
  alter column platform_status set not null;

create table if not exists public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  constraint platform_admins_auth_user_unique unique (auth_user_id),
  constraint platform_admins_display_name_check check (length(trim(display_name)) between 2 and 120)
);

create table if not exists public.platform_features (
  feature_key text primary key,
  display_name text not null,
  description text not null default '',
  state public.platform_feature_state not null default 'enabled',
  display_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.platform_admins(id) on delete set null,
  constraint platform_features_key_check check (feature_key ~ '^[a-z][a-z0-9_]*$'),
  constraint platform_features_order_check check (display_order > 0),
  constraint platform_features_order_unique unique (display_order)
);

create table if not exists public.company_features (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  feature_key text not null references public.platform_features(feature_key) on delete cascade,
  state public.platform_feature_state not null default 'enabled',
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_employee_id uuid references public.employees(id) on delete set null,
  updated_by_platform_admin_id uuid references public.platform_admins(id) on delete set null,
  constraint company_features_company_feature_unique unique (company_id, feature_key),
  constraint company_features_current_state_check check (state in ('enabled', 'disabled')),
  constraint company_features_configuration_object_check check (jsonb_typeof(configuration) = 'object')
);

create table if not exists public.platform_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  platform_admin_id uuid references public.platform_admins(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  category public.platform_audit_category not null,
  feature_key text references public.platform_features(feature_key) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  status public.platform_audit_status not null default 'success',
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint platform_audit_action_check check (action ~ '^[a-z][a-z0-9_]*$'),
  constraint platform_audit_entity_type_check check (entity_type ~ '^[a-z][a-z0-9_]*$'),
  constraint platform_audit_description_check check (length(description) between 1 and 500),
  constraint platform_audit_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.feature_usage_daily (
  company_id uuid not null references public.companies(id) on delete cascade,
  feature_key text not null references public.platform_features(feature_key) on delete cascade,
  usage_date date not null default current_date,
  request_count bigint not null default 0,
  last_used_at timestamptz not null default now(),
  primary key (company_id, feature_key, usage_date),
  constraint feature_usage_daily_request_count_check check (request_count >= 0)
);

create index if not exists companies_platform_status_idx
  on public.companies(platform_status);
create index if not exists platform_admins_auth_user_status_idx
  on public.platform_admins(auth_user_id, status);
create index if not exists platform_features_state_order_idx
  on public.platform_features(state, display_order);
create index if not exists company_features_company_state_idx
  on public.company_features(company_id, state);
create index if not exists company_features_feature_state_idx
  on public.company_features(feature_key, state);
create index if not exists platform_audit_logs_created_at_idx
  on public.platform_audit_logs(created_at desc);
create index if not exists platform_audit_logs_company_created_idx
  on public.platform_audit_logs(company_id, created_at desc);
create index if not exists platform_audit_logs_employee_created_idx
  on public.platform_audit_logs(employee_id, created_at desc);
create index if not exists platform_audit_logs_category_created_idx
  on public.platform_audit_logs(category, created_at desc);
create index if not exists platform_audit_logs_feature_created_idx
  on public.platform_audit_logs(feature_key, created_at desc);
create index if not exists platform_audit_logs_action_created_idx
  on public.platform_audit_logs(action, created_at desc);
create index if not exists platform_audit_logs_status_created_idx
  on public.platform_audit_logs(status, created_at desc);
create index if not exists feature_usage_daily_feature_date_idx
  on public.feature_usage_daily(feature_key, usage_date desc);

insert into public.platform_features (
  feature_key,
  display_name,
  description,
  state,
  display_order
)
values
  ('attendance', 'Attendance', 'Attendance capture, policy, locations, and administration.', 'enabled', 10),
  ('quick_links', 'Quick Links', 'Dashboard Quick Links and their visual shortcuts.', 'enabled', 20),
  ('knowledge_hub', 'Knowledge Hub', 'Knowledge-oriented resources and categories.', 'enabled', 30),
  ('resources', 'Resources', 'Employee resources, categories, and permissions.', 'enabled', 40),
  ('announcements', 'Announcements', 'Company announcements and targeted communication.', 'enabled', 50),
  ('leave', 'Leave', 'Leave types, balances, requests, and approvals.', 'enabled', 60),
  ('reports', 'Reports', 'Operational reports and export surfaces.', 'enabled', 70),
  ('notifications', 'Notifications', 'In-app, browser, and realtime notifications.', 'enabled', 80),
  ('calendar', 'Calendar', 'Holiday calendars and company events.', 'enabled', 90),
  ('employee_directory', 'Employee Directory', 'Employee management, hierarchy, and directory access.', 'enabled', 100),
  ('profile', 'Profile', 'Employee profile and credential management.', 'enabled', 110),
  ('company_settings', 'Company Settings', 'Company identity, policy, locations, and preferences.', 'enabled', 120),
  ('role_management', 'Role Management', 'Roles and permission administration.', 'enabled', 130),
  ('future_modules', 'Future Modules', 'Reserved extension point for future platform modules.', 'disabled', 140)
on conflict (feature_key) do update
set display_name = excluded.display_name,
    description = excluded.description,
    display_order = excluded.display_order;

create or replace function public.is_system_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.platform_admins
    where auth_user_id = user_id
      and status = 'active'
  );
$$;

create or replace function public.is_feature_enabled_for_company(
  target_company_id uuid,
  target_feature_key text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select
      feature.state = 'enabled'
      and company.platform_status = 'active'
      and coalesce(company_feature.state, 'enabled'::public.platform_feature_state) = 'enabled'
    from public.platform_features feature
    join public.companies company on company.id = target_company_id
    left join public.company_features company_feature
      on company_feature.company_id = company.id
     and company_feature.feature_key = feature.feature_key
    where feature.feature_key = target_feature_key
  ), false);
$$;

create or replace function public.can_access_feature(target_feature_key text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
      select 1
      from public.employees
      where auth_user_id = auth.uid()
        and status = 'active'
        and public.is_feature_enabled_for_company(company_id, target_feature_key)
    );
$$;

create or replace function public.can_access_company_platform()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.employees employee
    join public.companies company on company.id = employee.company_id
    where employee.auth_user_id = auth.uid()
      and employee.status = 'active'
      and company.platform_status = 'active'
  );
$$;

create or replace function public.record_feature_usage(target_feature_key text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_company_id uuid;
begin
  select company_id into actor_company_id
  from public.employees
  where auth_user_id = auth.uid()
    and status = 'active'
  limit 1;

  if actor_company_id is null
     or not public.is_feature_enabled_for_company(actor_company_id, target_feature_key) then
    return;
  end if;

  insert into public.feature_usage_daily (
    company_id, feature_key, usage_date, request_count, last_used_at
  )
  values (actor_company_id, target_feature_key, current_date, 1, now())
  on conflict (company_id, feature_key, usage_date) do update
  set request_count = public.feature_usage_daily.request_count + 1,
      last_used_at = now();
end;
$$;

create or replace function public.log_feature_access_denied(
  target_feature_key text,
  target_path text,
  target_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_employee public.employees%rowtype;
begin
  if auth.uid() is null then
    return;
  end if;

  select * into actor_employee
  from public.employees
  where auth_user_id = auth.uid()
  limit 1;

  insert into public.platform_audit_logs (
    company_id,
    employee_id,
    auth_user_id,
    category,
    feature_key,
    action,
    entity_type,
    entity_id,
    status,
    description,
    metadata,
    user_agent
  )
  values (
    actor_employee.company_id,
    actor_employee.id,
    auth.uid(),
    'security',
    target_feature_key,
    'feature_access_blocked',
    'route',
    left(target_path, 500),
    'denied',
    'Blocked direct access to a disabled feature route.',
    jsonb_build_object('path', left(target_path, 500)),
    left(target_user_agent, 1000)
  );
end;
$$;

create or replace function public.log_company_access_denied(
  target_path text,
  target_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_employee public.employees%rowtype;
begin
  select * into actor_employee from public.employees
  where auth_user_id = auth.uid() limit 1;
  if actor_employee.id is null then return; end if;

  insert into public.platform_audit_logs (
    company_id, employee_id, auth_user_id, category, action, entity_type,
    entity_id, status, description, metadata, user_agent
  ) values (
    actor_employee.company_id, actor_employee.id, auth.uid(), 'security',
    'company_access_blocked', 'route', left(target_path, 500), 'denied',
    'Blocked access because the company is not active on the platform.',
    jsonb_build_object('path', left(target_path, 500)), left(target_user_agent, 1000)
  );
end;
$$;

create or replace function public.create_platform_company(company_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  next_company_id uuid;
begin
  if length(trim(company_name)) < 2 then
    raise exception 'Company name must contain at least two characters.';
  end if;

  insert into public.companies (name, status, platform_status)
  values (trim(company_name), 'active', 'active')
  returning id into next_company_id;

  insert into public.roles (company_id, name, description, display_order, status)
  values
    (next_company_id, 'Admin', 'Company administrator', 1, 'active'),
    (next_company_id, 'Sales Head', 'Sales leadership', 2, 'active'),
    (next_company_id, 'RSM', 'Regional sales manager', 3, 'active'),
    (next_company_id, 'TSO', 'Territory sales officer', 4, 'active'),
    (next_company_id, 'SR', 'Sales representative', 5, 'active');

  insert into public.company_settings (company_id, company_name, status)
  values (next_company_id, trim(company_name), 'active');

  return next_company_id;
end;
$$;

create or replace view public.platform_company_overview
with (security_invoker = true)
as
select
  company.id,
  company.name,
  company.platform_status,
  company.created_at,
  count(employee.id) filter (where employee.status = 'active')::integer as employee_count,
  count(employee.id) filter (
    where employee.status = 'active' and role.name = 'Admin'
  )::integer as admin_count
from public.companies company
left join public.employees employee on employee.company_id = company.id
left join public.roles role
  on role.id = employee.role_id
 and role.company_id = company.id
group by company.id;

alter table public.platform_admins enable row level security;
alter table public.platform_features enable row level security;
alter table public.company_features enable row level security;
alter table public.platform_audit_logs enable row level security;
alter table public.feature_usage_daily enable row level security;

revoke all on table public.platform_admins from anon, authenticated;
revoke all on table public.platform_features from anon, authenticated;
revoke all on table public.company_features from anon, authenticated;
revoke all on table public.platform_audit_logs from anon, authenticated;
revoke all on table public.feature_usage_daily from anon, authenticated;
revoke execute on function public.is_system_admin(uuid) from public, anon, authenticated;
revoke execute on function public.is_feature_enabled_for_company(uuid, text) from public, anon, authenticated;
revoke execute on function public.can_access_feature(text) from public, anon;
grant execute on function public.can_access_feature(text) to authenticated;
revoke execute on function public.can_access_company_platform() from public, anon;
grant execute on function public.can_access_company_platform() to authenticated;
revoke execute on function public.record_feature_usage(text) from public, anon;
grant execute on function public.record_feature_usage(text) to authenticated;
revoke execute on function public.log_feature_access_denied(text, text, text) from public, anon;
grant execute on function public.log_feature_access_denied(text, text, text) to authenticated;
revoke execute on function public.log_company_access_denied(text, text) from public, anon;
grant execute on function public.log_company_access_denied(text, text) to authenticated;
revoke execute on function public.create_platform_company(text) from public, anon, authenticated;
grant execute on function public.is_system_admin(uuid) to service_role;
grant execute on function public.is_feature_enabled_for_company(uuid, text) to service_role;
grant execute on function public.create_platform_company(text) to service_role;
revoke all on table public.platform_company_overview from anon, authenticated;

comment on table public.platform_admins is
  'Explicit global System Admin authorization. Company Admin roles do not imply membership.';
comment on table public.company_features is
  'Company overrides. Missing rows intentionally inherit the enabled platform state.';
comment on table public.platform_audit_logs is
  'Append-only platform, security, login, feature usage, and cross-company audit events.';
