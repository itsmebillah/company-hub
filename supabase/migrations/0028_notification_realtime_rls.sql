-- Evaluate notification visibility without exposing employee rows through
-- PostgREST. The caller identity is always derived from auth.uid().

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
          and role.name = 'Admin'
        )
      )
  );
$$;

revoke execute on function public.can_receive_notification(uuid, uuid)
  from public;
grant execute on function public.can_receive_notification(uuid, uuid)
  to authenticated, service_role;

drop policy if exists "Authenticated employees can receive scoped notifications"
  on public.notifications;

create policy "Authenticated employees can receive scoped notifications"
on public.notifications
for select
to authenticated
using (
  public.can_receive_notification(employee_id, company_id)
);
