-- Keep runtime schema telemetry current and remove explicit anonymous access
-- from the existing notification/schema SECURITY DEFINER helpers.

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select '0031'::text;
$$;

revoke execute on function public.get_app_schema_version()
  from public, anon;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;

revoke execute on function public.can_receive_notification(uuid, uuid)
  from public, anon;
grant execute on function public.can_receive_notification(uuid, uuid)
  to authenticated, service_role;
