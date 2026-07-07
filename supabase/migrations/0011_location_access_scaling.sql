create type public.company_location_type as enum (
  'head_office',
  'branch',
  'warehouse',
  'factory',
  'depot',
  'client_site'
);

alter table public.company_locations
  add column code text,
  add column location_type public.company_location_type not null default 'branch',
  add column address text,
  add column is_default boolean not null default false;

update public.company_locations
set code = upper(
  regexp_replace(
    coalesce(nullif(name, ''), id::text),
    '[^a-zA-Z0-9]+',
    '_',
    'g'
  )
)
where code is null;

alter table public.company_locations
  alter column code set not null;

alter table public.company_locations
  add constraint company_locations_company_code_unique unique (company_id, code);

create unique index company_locations_default_unique_idx
  on public.company_locations(company_id)
  where is_default is true
    and status = 'active';

create table public.employee_location_access (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  location_id uuid not null references public.company_locations(id) on delete cascade,
  status public.record_status not null default 'active',
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_location_access_unique unique (employee_id, location_id),
  constraint employee_location_access_effective_window_check check (
    effective_to is null
    or effective_from is null
    or effective_to >= effective_from
  )
);

create index employee_location_access_employee_id_idx
  on public.employee_location_access(employee_id);

create index employee_location_access_location_id_idx
  on public.employee_location_access(location_id);

create index employee_location_access_status_idx
  on public.employee_location_access(status);

create index employee_location_access_effective_dates_idx
  on public.employee_location_access(effective_from, effective_to);
