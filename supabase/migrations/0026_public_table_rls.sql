-- Secure every PostgREST-exposed application table.
-- Server-side application services use the service-role client and continue
-- to bypass RLS. Browser database access is limited to scoped realtime
-- notification delivery for authenticated employees.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'companies',
    'roles',
    'employees',
    'resource_categories',
    'resources',
    'resource_permissions',
    'announcements',
    'company_settings',
    'notifications',
    'activity_logs',
    'attendance_records',
    'company_locations',
    'employee_location_access',
    'leave_types',
    'leave_requests',
    'holiday_calendars',
    'holiday_events',
    'employee_import_jobs',
    'employee_import_rows',
    'announcement_roles',
    'announcement_employees',
    'employee_celebration_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end
$$;

drop policy if exists "Authenticated employees can receive scoped notifications"
  on public.notifications;

create policy "Authenticated employees can receive scoped notifications"
on public.notifications
for select
to authenticated
using (
  exists (
    select 1
    from public.employees employee
    where employee.auth_user_id = auth.uid()
      and employee.status = 'active'
      and (
        notifications.employee_id = employee.id
        or (
          notifications.company_id = employee.company_id
          and public.is_admin_user(auth.uid())
        )
      )
  )
);

revoke execute on function public.is_active_employee(uuid) from anon;
revoke execute on function public.is_admin_user(uuid) from anon;
