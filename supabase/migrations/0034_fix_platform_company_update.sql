-- Remove PL/pgSQL ambiguity between the company name argument and column.

drop function public.update_platform_company_name(uuid, text);

create or replace function public.update_platform_company_name(
  target_company_id uuid,
  target_company_name text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if target_company_id is null or length(trim(target_company_name)) < 2 then
    raise exception 'A valid company and name are required.';
  end if;

  update public.companies
  set name = trim(target_company_name), updated_at = now()
  where id = target_company_id;

  if not found then
    raise exception 'Company was not found.';
  end if;

  update public.company_settings
  set company_name = trim(target_company_name), updated_at = now()
  where company_id = target_company_id;
end;
$$;

revoke execute on function public.update_platform_company_name(uuid, text)
  from public, anon, authenticated;
grant execute on function public.update_platform_company_name(uuid, text)
  to service_role;

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select '0034'::text;
$$;

revoke execute on function public.get_app_schema_version()
  from public, anon;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;
