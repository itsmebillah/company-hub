alter table public.attendance_records
  add column if not exists work_mode public.employee_work_mode;

update public.attendance_records attendance
set work_mode = coalesce(attendance.work_mode, employees.work_mode)
from public.employees employees
where attendance.employee_id = employees.id;

update public.attendance_records
set work_mode = coalesce(work_mode, 'office'::public.employee_work_mode);

alter table public.attendance_records
  alter column work_mode set default 'office'::public.employee_work_mode,
  alter column work_mode set not null;

create index if not exists attendance_records_work_mode_idx
  on public.attendance_records(work_mode);
