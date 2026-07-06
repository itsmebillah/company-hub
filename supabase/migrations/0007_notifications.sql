create type public.notification_type as enum (
  'announcement',
  'resource',
  'attendance',
  'leave',
  'approval',
  'document',
  'system'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null,
  action_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references public.employees(id) on delete set null
);

create index notifications_company_id_idx on public.notifications(company_id);
create index notifications_employee_id_idx on public.notifications(employee_id);
create index notifications_type_idx on public.notifications(type);
create index notifications_is_read_idx on public.notifications(is_read);
create index notifications_created_at_idx on public.notifications(created_at);
create index notifications_company_created_at_idx
  on public.notifications(company_id, created_at desc);
