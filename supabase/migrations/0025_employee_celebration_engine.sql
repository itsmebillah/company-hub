-- Sprint: Employee Celebration Engine
-- Adds reusable celebration tracking, company celebration defaults, and
-- notification delivery flags without duplicating employee or notification data.

alter type public.notification_type
  add value if not exists 'celebration';

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'celebration_event_type'
  ) then
    create type public.celebration_event_type as enum (
      'birthday',
      'work_anniversary'
    );
  end if;
end
$$;

alter table public.notifications
  add column if not exists browser_enabled boolean,
  add column if not exists realtime_enabled boolean,
  add column if not exists native_enabled boolean;

update public.notifications
set browser_enabled = coalesce(browser_enabled, true),
    realtime_enabled = coalesce(realtime_enabled, true),
    native_enabled = coalesce(native_enabled, true);

alter table public.notifications
  alter column browser_enabled set default true,
  alter column browser_enabled set not null,
  alter column realtime_enabled set default true,
  alter column realtime_enabled set not null,
  alter column native_enabled set default true,
  alter column native_enabled set not null;

create table if not exists public.employee_celebration_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  event_type public.celebration_event_type not null,
  event_year integer not null,
  celebration_date date not null,
  notification_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint employee_celebration_events_event_year_check check (event_year >= 2000),
  constraint employee_celebration_events_notification_count_check check (notification_count >= 0),
  constraint employee_celebration_events_unique_event unique (
    company_id,
    employee_id,
    event_type,
    event_year
  )
);

create index if not exists employee_celebration_events_company_date_idx
  on public.employee_celebration_events(company_id, celebration_date desc);

create index if not exists employee_celebration_events_employee_idx
  on public.employee_celebration_events(employee_id, event_year desc);

do $$
declare
  default_celebration_preferences jsonb := jsonb_build_object(
    'enableBirthdays', true,
    'enableWorkAnniversaries', true,
    'notifyCompany', false,
    'notifyEmployee', true,
    'enableBrowserNotification', true,
    'enableRealtimeNotification', true,
    'enableNativeNotification', true
  );
begin
  update public.company_settings
  set notification_preferences = jsonb_set(
    coalesce(notification_preferences, '{}'::jsonb),
    '{celebrations}',
    coalesce(notification_preferences -> 'celebrations', default_celebration_preferences),
    true
  );
end
$$;

alter table public.company_settings
  alter column notification_preferences set default jsonb_build_object(
    'announcements', true,
    'attendance', true,
    'leave', true,
    'approvals', true,
    'system', true,
    'celebrations', jsonb_build_object(
      'enableBirthdays', true,
      'enableWorkAnniversaries', true,
      'notifyCompany', false,
      'notifyEmployee', true,
      'enableBrowserNotification', true,
      'enableRealtimeNotification', true,
      'enableNativeNotification', true
    )
  );

create or replace function public.get_company_celebrants(
  target_company_id uuid,
  target_date date
)
returns table (
  employee_uuid uuid,
  employee_code text,
  employee_name text,
  company_uuid uuid,
  event_type public.celebration_event_type,
  source_date date,
  years_completed integer
)
language sql
stable
set search_path = public, pg_temp
as $$
  with celebration_context as (
    select
      target_company_id as company_id,
      target_date as celebration_date,
      extract(month from target_date)::integer as celebration_month,
      extract(day from target_date)::integer as celebration_day,
      extract(year from target_date)::integer as celebration_year
  )
  select
    employee.id as employee_uuid,
    employee.employee_id as employee_code,
    employee.name as employee_name,
    employee.company_id as company_uuid,
    'birthday'::public.celebration_event_type as event_type,
    employee.date_of_birth as source_date,
    null::integer as years_completed
  from public.employees employee
  cross join celebration_context ctx
  where employee.company_id = ctx.company_id
    and employee.status = 'active'
    and employee.date_of_birth is not null
    and extract(month from employee.date_of_birth)::integer = ctx.celebration_month
    and extract(day from employee.date_of_birth)::integer = ctx.celebration_day

  union all

  select
    employee.id as employee_uuid,
    employee.employee_id as employee_code,
    employee.name as employee_name,
    employee.company_id as company_uuid,
    'work_anniversary'::public.celebration_event_type as event_type,
    employee.joining_date as source_date,
    ctx.celebration_year - extract(year from employee.joining_date)::integer
      as years_completed
  from public.employees employee
  cross join celebration_context ctx
  where employee.company_id = ctx.company_id
    and employee.status = 'active'
    and employee.joining_date is not null
    and employee.joining_date <= ctx.celebration_date
    and extract(month from employee.joining_date)::integer = ctx.celebration_month
    and extract(day from employee.joining_date)::integer = ctx.celebration_day
    and ctx.celebration_year - extract(year from employee.joining_date)::integer >= 1;
$$;
