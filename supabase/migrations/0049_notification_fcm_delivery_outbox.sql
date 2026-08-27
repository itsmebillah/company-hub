create table if not exists public.notification_fcm_delivery_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  employee_id uuid not null,
  company_id uuid not null,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint notification_fcm_outbox_employee_company_fk foreign key (employee_id, company_id) references public.employees(id, company_id) on delete cascade,
  constraint notification_fcm_outbox_status_check check (status in ('pending','processing','completed','failed')),
  constraint notification_fcm_outbox_attempts_check check (attempt_count >= 0),
  constraint notification_fcm_outbox_unique unique (notification_id, employee_id)
);
create index if not exists notification_fcm_outbox_pending_idx on public.notification_fcm_delivery_outbox(status, next_attempt_at);
alter table public.notification_fcm_delivery_outbox enable row level security;
revoke all on public.notification_fcm_delivery_outbox from anon, authenticated;
grant all on public.notification_fcm_delivery_outbox to service_role;