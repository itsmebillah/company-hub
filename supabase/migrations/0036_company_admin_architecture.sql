-- Company Admin architecture: rename the tenant authority and harden
-- tenant-scoped route, notification, and Storage authorization.

do $$
begin
  if exists (
    select 1
    from public.roles legacy_role
    join public.roles company_admin_role
      on company_admin_role.company_id = legacy_role.company_id
     and company_admin_role.name = 'Company Admin'
    where legacy_role.name = 'Admin'
  ) then
    raise exception
      'Company Admin migration requires manual role conflict resolution.';
  end if;
end
$$;

update public.roles
set name = 'Company Admin',
    description = coalesce(description, 'Highest company-scoped authority'),
    updated_at = now()
where name = 'Admin';

create or replace function public.is_company_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select user_id = auth.uid()
    and exists (
      select 1
      from public.employees employee
      join public.roles role
        on role.id = employee.role_id
       and role.company_id = employee.company_id
      join public.companies company
        on company.id = employee.company_id
      where employee.auth_user_id = user_id
        and employee.status = 'active'
        and role.status = 'active'
        and role.name = 'Company Admin'
        and company.platform_status = 'active'
    );
$$;

create or replace function public.is_admin_user(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_company_admin(user_id);
$$;

create or replace function public.can_access_company_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_company_admin(auth.uid());
$$;

create or replace function public.can_receive_notification(
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
    select 1
    from public.employees employee
    left join public.roles role
      on role.id = employee.role_id
     and role.company_id = employee.company_id
    where employee.auth_user_id = auth.uid()
      and employee.status = 'active'
      and (
        employee.id = target_employee_id
        or (
          employee.company_id = target_company_id
          and role.status = 'active'
          and role.name = 'Company Admin'
        )
      )
  );
$$;

create or replace function public.can_company_admin_manage_storage_object(
  target_bucket_id text,
  target_object_name text,
  user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, storage, pg_temp
as $$
  select user_id = auth.uid()
    and exists (
      select 1
      from public.employees actor
      join public.roles actor_role
        on actor_role.id = actor.role_id
       and actor_role.company_id = actor.company_id
      join public.companies company
        on company.id = actor.company_id
      where actor.auth_user_id = user_id
        and actor.status = 'active'
        and actor_role.status = 'active'
        and actor_role.name = 'Company Admin'
        and company.platform_status = 'active'
        and (
          (
            target_bucket_id in (
              'announcement-images',
              'company-assets',
              'resource-icons',
              'category-icons'
            )
            and coalesce((storage.foldername(target_object_name))[1], '') =
              actor.company_id::text
          )
          or (
            target_bucket_id in (
              'profile-photos',
              'employee-documents',
              'leave-attachments'
            )
            and exists (
              select 1
              from public.employees target_employee
              where target_employee.company_id = actor.company_id
                and target_employee.auth_user_id::text =
                  coalesce((storage.foldername(target_object_name))[1], '')
            )
          )
        )
    );
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
    (next_company_id, 'Company Admin', 'Highest company-scoped authority', 1, 'active'),
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
    where employee.status = 'active' and role.name = 'Company Admin'
  )::integer as admin_count
from public.companies company
left join public.employees employee on employee.company_id = company.id
left join public.roles role
  on role.id = employee.role_id
 and role.company_id = company.id
group by company.id;

drop policy if exists "Admins can insert shared public storage objects"
  on storage.objects;
drop policy if exists "Admins can update shared public storage objects"
  on storage.objects;
drop policy if exists "Admins can delete shared public storage objects"
  on storage.objects;
drop policy if exists "Profile photo owners and admins can insert objects"
  on storage.objects;
drop policy if exists "Profile photo owners and admins can update objects"
  on storage.objects;
drop policy if exists "Profile photo owners and admins can delete objects"
  on storage.objects;
drop policy if exists "Private storage owners and admins can read objects"
  on storage.objects;
drop policy if exists "Private storage owners and admins can insert objects"
  on storage.objects;
drop policy if exists "Private storage owners and admins can update objects"
  on storage.objects;
drop policy if exists "Private storage owners and admins can delete objects"
  on storage.objects;

create policy "Company Admins can insert company public storage objects"
on storage.objects for insert to authenticated
with check (
  public.can_company_admin_manage_storage_object(bucket_id, name, auth.uid())
);

create policy "Company Admins can update company public storage objects"
on storage.objects for update to authenticated
using (
  public.can_company_admin_manage_storage_object(bucket_id, name, auth.uid())
)
with check (
  public.can_company_admin_manage_storage_object(bucket_id, name, auth.uid())
);

create policy "Company Admins can delete company public storage objects"
on storage.objects for delete to authenticated
using (
  public.can_company_admin_manage_storage_object(bucket_id, name, auth.uid())
);

create policy "Profile photo owners and Company Admins can insert objects"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-photos'
  and public.is_active_employee(auth.uid())
  and (
    public.is_self_storage_object(name, auth.uid())
    or public.can_company_admin_manage_storage_object(bucket_id, name, auth.uid())
  )
);

create policy "Profile photo owners and Company Admins can update objects"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-photos'
  and public.is_active_employee(auth.uid())
  and (
    public.is_self_storage_object(name, auth.uid())
    or public.can_company_admin_manage_storage_object(bucket_id, name, auth.uid())
  )
)
with check (
  bucket_id = 'profile-photos'
  and public.is_active_employee(auth.uid())
  and (
    public.is_self_storage_object(name, auth.uid())
    or public.can_company_admin_manage_storage_object(bucket_id, name, auth.uid())
  )
);

create policy "Profile photo owners and Company Admins can delete objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-photos'
  and public.is_active_employee(auth.uid())
  and (
    public.is_self_storage_object(name, auth.uid())
    or public.can_company_admin_manage_storage_object(bucket_id, name, auth.uid())
  )
);

create policy "Private storage owners and Company Admins can read objects"
on storage.objects for select to authenticated
using (
  bucket_id in ('employee-documents', 'leave-attachments')
  and public.is_active_employee(auth.uid())
  and (
    public.is_self_storage_object(name, auth.uid())
    or public.can_company_admin_manage_storage_object(bucket_id, name, auth.uid())
  )
);

create policy "Private storage owners and Company Admins can insert objects"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('employee-documents', 'leave-attachments')
  and public.is_active_employee(auth.uid())
  and (
    public.is_self_storage_object(name, auth.uid())
    or public.can_company_admin_manage_storage_object(bucket_id, name, auth.uid())
  )
);

create policy "Private storage owners and Company Admins can update objects"
on storage.objects for update to authenticated
using (
  bucket_id in ('employee-documents', 'leave-attachments')
  and public.is_active_employee(auth.uid())
  and (
    public.is_self_storage_object(name, auth.uid())
    or public.can_company_admin_manage_storage_object(bucket_id, name, auth.uid())
  )
)
with check (
  bucket_id in ('employee-documents', 'leave-attachments')
  and public.is_active_employee(auth.uid())
  and (
    public.is_self_storage_object(name, auth.uid())
    or public.can_company_admin_manage_storage_object(bucket_id, name, auth.uid())
  )
);

create policy "Private storage owners and Company Admins can delete objects"
on storage.objects for delete to authenticated
using (
  bucket_id in ('employee-documents', 'leave-attachments')
  and public.is_active_employee(auth.uid())
  and (
    public.is_self_storage_object(name, auth.uid())
    or public.can_company_admin_manage_storage_object(bucket_id, name, auth.uid())
  )
);

revoke execute on function public.is_company_admin(uuid)
  from public, anon;
grant execute on function public.is_company_admin(uuid)
  to authenticated, service_role;
revoke execute on function public.can_access_company_admin()
  from public, anon;
grant execute on function public.can_access_company_admin()
  to authenticated;
revoke execute on function public.can_company_admin_manage_storage_object(text, text, uuid)
  from public, anon;
grant execute on function public.can_company_admin_manage_storage_object(text, text, uuid)
  to authenticated, service_role;

comment on function public.is_admin_user(uuid) is
  'Compatibility wrapper for is_company_admin; do not use for new authorization code.';
comment on function public.can_company_admin_manage_storage_object(text, text, uuid) is
  'Caller-derived tenant boundary for Company Admin Storage object operations.';

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select '0036'::text;
$$;

revoke execute on function public.get_app_schema_version()
  from public, anon;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;
