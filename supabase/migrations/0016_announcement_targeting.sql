alter table public.announcements
  add column if not exists target_audience text not null default 'company',
  add constraint announcements_target_audience_check check (
    target_audience in ('company', 'roles', 'employees')
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'announcements_id_company_unique'
      and conrelid = 'public.announcements'::regclass
  ) then
    alter table public.announcements
      add constraint announcements_id_company_unique unique (id, company_id);
  end if;
end
$$;

create table if not exists public.announcement_roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint announcement_roles_announcement_company_fk foreign key (
    announcement_id,
    company_id
  ) references public.announcements(id, company_id),
  constraint announcement_roles_role_company_fk foreign key (
    role_id,
    company_id
  ) references public.roles(id, company_id),
  constraint announcement_roles_unique unique (announcement_id, role_id)
);

create table if not exists public.announcement_employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint announcement_employees_announcement_company_fk foreign key (
    announcement_id,
    company_id
  ) references public.announcements(id, company_id),
  constraint announcement_employees_employee_company_fk foreign key (
    employee_id,
    company_id
  ) references public.employees(id, company_id),
  constraint announcement_employees_unique unique (announcement_id, employee_id)
);

create index if not exists announcements_target_audience_idx
  on public.announcements(target_audience);

create index if not exists announcement_roles_company_id_idx
  on public.announcement_roles(company_id);

create index if not exists announcement_roles_announcement_id_idx
  on public.announcement_roles(announcement_id);

create index if not exists announcement_roles_role_id_idx
  on public.announcement_roles(role_id);

create index if not exists announcement_employees_company_id_idx
  on public.announcement_employees(company_id);

create index if not exists announcement_employees_announcement_id_idx
  on public.announcement_employees(announcement_id);

create index if not exists announcement_employees_employee_id_idx
  on public.announcement_employees(employee_id);
