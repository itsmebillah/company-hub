create type public.leave_request_status as enum (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text not null,
  color text,
  is_paid boolean not null default true,
  annual_limit integer,
  requires_approval boolean not null default true,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_types_company_code_unique unique (company_id, code),
  constraint leave_types_annual_limit_check check (
    annual_limit is null
    or annual_limit >= 0
  )
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  total_days integer not null,
  reason text,
  status public.leave_request_status not null default 'pending',
  approved_by uuid references public.employees(id) on delete set null,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_requests_date_range_check check (end_date >= start_date),
  constraint leave_requests_total_days_check check (total_days > 0)
);

create index leave_types_company_id_idx
  on public.leave_types(company_id);

create index leave_types_status_idx
  on public.leave_types(status);

create index leave_requests_company_id_idx
  on public.leave_requests(company_id);

create index leave_requests_employee_id_idx
  on public.leave_requests(employee_id);

create index leave_requests_leave_type_id_idx
  on public.leave_requests(leave_type_id);

create index leave_requests_status_idx
  on public.leave_requests(status);

create index leave_requests_start_end_idx
  on public.leave_requests(start_date, end_date);
