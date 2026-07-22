-- Keep company identity updates atomic across organization and settings rows.

create or replace function public.update_platform_company_name(
  target_company_id uuid,
  company_name text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if target_company_id is null or length(trim(company_name)) < 2 then
    raise exception 'A valid company and name are required.';
  end if;

  update public.companies
  set name = trim(company_name), updated_at = now()
  where id = target_company_id;

  if not found then
    raise exception 'Company was not found.';
  end if;

  update public.company_settings
  set company_name = trim(company_name), updated_at = now()
  where company_id = target_company_id;
end;
$$;

revoke execute on function public.update_platform_company_name(uuid, text)
  from public, anon, authenticated;
grant execute on function public.update_platform_company_name(uuid, text)
  to service_role;

-- Bring the immutable tenant activity history into the central audit stream.
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
  ip_address,
  user_agent,
  created_at
)
select
  activity.company_id,
  activity.employee_id,
  employee.auth_user_id,
  'activity'::public.platform_audit_category,
  case activity.module
    when 'employee' then 'employee_directory'
    when 'announcement' then 'announcements'
    when 'resources' then 'resources'
    when 'company_settings' then 'company_settings'
    when 'roles' then 'role_management'
    when 'permissions' then 'resources'
    when 'attendance' then 'attendance'
    when 'calendar' then 'calendar'
    when 'leave' then 'leave'
    else null
  end,
  activity.action,
  activity.entity_type,
  activity.entity_id,
  'success'::public.platform_audit_status,
  left(coalesce(nullif(activity.description, ''), 'Imported activity event.'), 500),
  (case when jsonb_typeof(activity.metadata) = 'object'
    then activity.metadata else '{}'::jsonb end)
    || jsonb_build_object('sourceActivityLogId', activity.id),
  case
    when pg_input_is_valid(nullif(trim(activity.ip_address), ''), 'inet')
      then activity.ip_address::inet
    else null
  end,
  activity.user_agent,
  activity.created_at
from public.activity_logs activity
left join public.employees employee on employee.id = activity.employee_id;

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select '0033'::text;
$$;

revoke execute on function public.get_app_schema_version()
  from public, anon;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;
