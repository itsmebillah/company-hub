create type public.record_status as enum ('active', 'inactive', 'archived');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint companies_name_unique unique (name)
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  display_order integer not null,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint roles_id_company_unique unique (id, company_id),
  constraint roles_company_name_unique unique (company_id, name),
  constraint roles_company_display_order_unique unique (company_id, display_order),
  constraint roles_display_order_check check (display_order > 0)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null,
  name text not null,
  phone text,
  email text,
  date_of_birth date,
  joining_date date,
  photo_url text,
  manager_id uuid references public.employees(id) on delete set null,
  company_id uuid not null references public.companies(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint employees_id_company_unique unique (id, company_id),
  constraint employees_role_company_fk foreign key (role_id, company_id)
    references public.roles(id, company_id),
  constraint employees_employee_id_unique unique (employee_id),
  constraint employees_email_unique unique (email),
  constraint employees_manager_not_self_check check (manager_id is null or manager_id <> id)
);

create index roles_company_id_idx on public.roles(company_id);
create index roles_display_order_idx on public.roles(display_order);
create index roles_status_idx on public.roles(status);

create index employees_company_id_idx on public.employees(company_id);
create index employees_role_id_idx on public.employees(role_id);
create index employees_manager_id_idx on public.employees(manager_id);
create index employees_status_idx on public.employees(status);
