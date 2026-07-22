-- Keep the low-level Company Admin predicate internal to trusted wrappers.

revoke execute on function public.is_company_admin(uuid)
  from authenticated;
grant execute on function public.is_company_admin(uuid)
  to service_role;

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select '0037'::text;
$$;

revoke execute on function public.get_app_schema_version()
  from public, anon;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;
