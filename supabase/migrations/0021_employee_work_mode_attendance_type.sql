do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'employee_work_mode'
  ) then
    create type public.employee_work_mode as enum (
      'office',
      'field',
      'hybrid'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'attendance_type'
  ) then
    create type public.attendance_type as enum (
      'office',
      'field',
      'hybrid'
    );
  end if;
end
$$;

alter table public.employees
  add column if not exists work_mode public.employee_work_mode;

update public.employees
set work_mode = coalesce(work_mode, 'office'::public.employee_work_mode);

alter table public.employees
  alter column work_mode set default 'office'::public.employee_work_mode,
  alter column work_mode set not null;

alter table public.attendance_records
  add column if not exists attendance_type public.attendance_type;

update public.attendance_records
set attendance_type = coalesce(attendance_type, 'office'::public.attendance_type);

alter table public.attendance_records
  alter column attendance_type set default 'office'::public.attendance_type,
  alter column attendance_type set not null;

create index if not exists employees_work_mode_idx
  on public.employees(work_mode);

create index if not exists attendance_records_attendance_type_idx
  on public.attendance_records(attendance_type);
