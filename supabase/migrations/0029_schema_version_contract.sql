-- Provide a stable, least-privilege runtime schema version contract.
-- Supabase does not expose supabase_migrations through PostgREST.

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select '0029'::text;
$$;

revoke all on function public.get_app_schema_version() from public;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;
