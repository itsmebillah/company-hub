create type public.attendance_status as enum (
  'present',
  'absent',
  'late',
  'half_day',
  'holiday',
  'leave',
  'weekend'
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  attendance_date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status public.attendance_status not null default 'absent',
  working_minutes integer not null default 0,
  late_minutes integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_records_employee_date_unique unique (
    employee_id,
    attendance_date
  ),
  constraint attendance_records_working_minutes_check check (
    working_minutes >= 0
  ),
  constraint attendance_records_late_minutes_check check (
    late_minutes >= 0
  ),
  constraint attendance_records_checkout_after_checkin_check check (
    check_out is null
    or check_in is null
    or check_out >= check_in
  )
);

create index attendance_records_company_id_idx
  on public.attendance_records(company_id);

create index attendance_records_employee_id_idx
  on public.attendance_records(employee_id);

create index attendance_records_attendance_date_idx
  on public.attendance_records(attendance_date);

create index attendance_records_company_date_idx
  on public.attendance_records(company_id, attendance_date desc);
