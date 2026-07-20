-- Restrict storage authorization helpers to the signed-in user's own UID.
-- These functions remain SECURITY DEFINER because storage policies must look
-- up employee and role rows while public application tables are protected by
-- RLS.

create or replace function public.is_active_employee(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select user_id = auth.uid()
    and exists (
      select 1
      from public.employees
      where auth_user_id = user_id
        and status = 'active'
    );
$$;

create or replace function public.is_admin_user(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select user_id = auth.uid()
    and exists (
      select 1
      from public.employees
      join public.roles
        on roles.id = employees.role_id
       and roles.company_id = employees.company_id
      where employees.auth_user_id = user_id
        and employees.status = 'active'
        and roles.status = 'active'
        and roles.name = 'Admin'
    );
$$;

revoke execute on function public.is_active_employee(uuid) from public;
revoke execute on function public.is_admin_user(uuid) from public;

grant execute on function public.is_active_employee(uuid)
  to authenticated, service_role;
grant execute on function public.is_admin_user(uuid)
  to authenticated, service_role;
