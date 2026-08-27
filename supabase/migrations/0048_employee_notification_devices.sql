-- FCM device tokens are owned by the authenticated employee and used only
-- by a trusted server-side delivery worker.
create table if not exists public.employee_notification_devices (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  company_id uuid not null,
  token text not null,
  platform text not null default 'android',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz,
  constraint employee_notification_devices_employee_company_fk
    foreign key (employee_id, company_id)
    references public.employees(id, company_id)
    on delete cascade,
  constraint employee_notification_devices_token_unique unique (token),
  constraint employee_notification_devices_platform_check
    check (platform in ('android')),
  constraint employee_notification_devices_token_length_check
    check (char_length(token) between 20 and 4096)
);

create index if not exists employee_notification_devices_employee_idx
  on public.employee_notification_devices(employee_id, active);
create index if not exists employee_notification_devices_company_idx
  on public.employee_notification_devices(company_id, active);

create or replace function public.can_manage_own_notification_device(
  target_employee_id uuid,
  target_company_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.employees employee
    where employee.id = target_employee_id
      and employee.company_id = target_company_id
      and employee.auth_user_id = auth.uid()
      and employee.status = 'active'
  );
$$;

revoke execute on function public.can_manage_own_notification_device(uuid, uuid)
  from public;
grant execute on function public.can_manage_own_notification_device(uuid, uuid)
  to authenticated, service_role;

alter table public.employee_notification_devices enable row level security;

create policy "Employees manage their own notification devices"
on public.employee_notification_devices
for all
to authenticated
using (public.can_manage_own_notification_device(employee_id, company_id))
with check (public.can_manage_own_notification_device(employee_id, company_id));

revoke all on public.employee_notification_devices from anon;
revoke all on public.employee_notification_devices from authenticated;
grant select, insert, update, delete on public.employee_notification_devices to authenticated;
grant all on public.employee_notification_devices to service_role;