create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  module text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index activity_logs_company_id_idx on public.activity_logs(company_id);
create index activity_logs_employee_id_idx on public.activity_logs(employee_id);
create index activity_logs_module_idx on public.activity_logs(module);
create index activity_logs_action_idx on public.activity_logs(action);
create index activity_logs_entity_idx on public.activity_logs(entity_type, entity_id);
create index activity_logs_created_at_idx on public.activity_logs(created_at desc);
