-- Migration 0041 removed the retired audit systems but did not advance the
-- least-privilege runtime schema-version contract. Keep applied migration
-- history immutable and correct the reported version in this additive change.

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select '0042'::text;
$$;

revoke execute on function public.get_app_schema_version()
  from public, anon;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;
