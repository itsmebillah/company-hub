-- Expose only the non-sensitive maintenance boolean without definer execution.

grant select (maintenance_mode)
  on table public.platform_settings
  to anon, authenticated;

drop policy if exists platform_settings_read_maintenance_status
  on public.platform_settings;
create policy platform_settings_read_maintenance_status
on public.platform_settings
for select
to anon, authenticated
using (id = true);

create or replace function public.is_platform_maintenance_mode()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select coalesce((
    select maintenance_mode
    from public.platform_settings
    where id = true
  ), false);
$$;

revoke execute on function public.is_platform_maintenance_mode()
  from public;
grant execute on function public.is_platform_maintenance_mode()
  to anon, authenticated, service_role;

comment on function public.is_platform_maintenance_mode() is
  'Security-invoker access to the single non-sensitive platform maintenance flag.';

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select '0040'::text;
$$;

revoke execute on function public.get_app_schema_version()
  from public, anon;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;
