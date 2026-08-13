alter table public.integration_outbox
  drop constraint integration_outbox_aggregate_type_check,
  drop constraint integration_outbox_event_type_check,
  drop constraint integration_outbox_status_check;

alter table public.integration_outbox
  add constraint integration_outbox_aggregate_type_check
    check (aggregate_type in ('attendance_attachment', 'holiday_event')),
  add constraint integration_outbox_event_type_check
    check (event_type in ('attendance.selfie.sync', 'reporting.holiday.sync')),
  add constraint integration_outbox_status_check
    check (status in ('pending', 'processing', 'completed', 'failed'));

create table public.reporting_destinations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  dataset text not null,
  provider text not null default 'google_sheets',
  spreadsheet_id text not null,
  sheet_name text not null default 'Holidays',
  enabled boolean not null default true,
  sync_status text not null default 'pending',
  last_attempt_at timestamptz,
  last_successful_sync_at timestamptz,
  last_reconciled_at timestamptz,
  last_error text,
  source_row_count integer,
  destination_row_count integer,
  drift_count integer not null default 0,
  alerted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reporting_destinations_dataset_check
    check (dataset = 'holidays'),
  constraint reporting_destinations_provider_check
    check (provider = 'google_sheets'),
  constraint reporting_destinations_status_check
    check (sync_status in ('healthy', 'pending', 'failed')),
  constraint reporting_destinations_sheet_name_check
    check (sheet_name ~ '^[A-Za-z0-9 _-]{1,50}$'),
  constraint reporting_destinations_counts_check
    check (
      (source_row_count is null or source_row_count >= 0)
      and (destination_row_count is null or destination_row_count >= 0)
      and drift_count >= 0
    ),
  constraint reporting_destinations_company_dataset_unique
    unique (company_id, dataset),
  constraint reporting_destinations_workbook_dataset_unique
    unique (spreadsheet_id, dataset)
);

create index reporting_destinations_health_idx
  on public.reporting_destinations(sync_status, updated_at)
  where enabled is true;

create index reporting_destinations_reconciliation_idx
  on public.reporting_destinations(last_reconciled_at, updated_at)
  where enabled is true;

alter table public.reporting_destinations enable row level security;
revoke all on table public.reporting_destinations from anon, authenticated;
grant all on table public.reporting_destinations to service_role;

alter table public.holiday_events
  add column company_id uuid;

update public.holiday_events e
set company_id = c.company_id
from public.holiday_calendars c
where c.id = e.calendar_id;

alter table public.holiday_events
  alter column company_id set not null,
  add constraint holiday_events_company_id_fkey
    foreign key (company_id) references public.companies(id) on delete cascade;

create index holiday_events_company_date_idx
  on public.holiday_events(company_id, date);

create or replace function public.set_holiday_event_company_id()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  calendar_company_id uuid;
begin
  select company_id into calendar_company_id
  from public.holiday_calendars
  where id = new.calendar_id;

  if calendar_company_id is null then
    raise exception 'Holiday calendar was not found.';
  end if;

  new.company_id := calendar_company_id;
  return new;
end;
$$;

drop trigger if exists set_holiday_event_company_id_trigger
  on public.holiday_events;
create trigger set_holiday_event_company_id_trigger
before insert or update of calendar_id, company_id
on public.holiday_events
for each row execute function public.set_holiday_event_company_id();

create or replace function public.enqueue_holiday_reporting_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_event_id uuid;
  target_company_id uuid;
  target_source_updated_at timestamptz;
  target_destination_id uuid;
  target_operation text := lower(tg_op);
begin
  if tg_op = 'DELETE' then
    target_event_id := old.id;
    target_company_id := old.company_id;
    target_source_updated_at := old.updated_at;
  else
    target_event_id := new.id;
    target_company_id := new.company_id;
    target_source_updated_at := new.updated_at;
  end if;

  select id into target_destination_id
  from public.reporting_destinations
  where company_id = target_company_id
    and dataset = 'holidays'
    and enabled is true;

  if target_destination_id is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  insert into public.integration_outbox (
    company_id,
    aggregate_type,
    aggregate_id,
    event_type,
    idempotency_key,
    payload
  ) values (
    target_company_id,
    'holiday_event',
    target_event_id,
    'reporting.holiday.sync',
    'reporting.holiday.sync:' || target_event_id::text || ':'
      || txid_current()::text || ':' || target_operation,
    jsonb_build_object(
      'dataset', 'holidays',
      'operation', target_operation,
      'destination_id', target_destination_id,
      'source_updated_at', target_source_updated_at
    )
  ) on conflict (idempotency_key) do nothing;

  update public.reporting_destinations
  set sync_status = 'pending',
      updated_at = now()
  where id = target_destination_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists enqueue_holiday_reporting_event_trigger
  on public.holiday_events;
create trigger enqueue_holiday_reporting_event_trigger
after insert or update or delete
on public.holiday_events
for each row execute function public.enqueue_holiday_reporting_event();

create or replace function public.enqueue_holiday_calendar_reporting_events()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_destination_id uuid;
begin
  select id into target_destination_id
  from public.reporting_destinations
  where company_id = new.company_id
    and dataset = 'holidays'
    and enabled is true;

  if target_destination_id is null then
    return new;
  end if;

  insert into public.integration_outbox (
    company_id,
    aggregate_type,
    aggregate_id,
    event_type,
    idempotency_key,
    payload
  )
  select
    new.company_id,
    'holiday_event',
    e.id,
    'reporting.holiday.sync',
    'reporting.holiday.sync:' || e.id::text || ':'
      || txid_current()::text || ':calendar',
    jsonb_build_object(
      'dataset', 'holidays',
      'operation', 'update',
      'destination_id', target_destination_id,
      'source_updated_at', new.updated_at
    )
  from public.holiday_events e
  where e.calendar_id = new.id
  on conflict (idempotency_key) do nothing;

  update public.reporting_destinations
  set sync_status = 'pending',
      updated_at = now()
  where id = target_destination_id;

  return new;
end;
$$;

drop trigger if exists enqueue_holiday_calendar_reporting_events_trigger
  on public.holiday_calendars;
create trigger enqueue_holiday_calendar_reporting_events_trigger
after update of name, status
on public.holiday_calendars
for each row
when (old.name is distinct from new.name or old.status is distinct from new.status)
execute function public.enqueue_holiday_calendar_reporting_events();

create or replace function public.enqueue_holiday_reporting_backfill(
  target_company_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_destination_id uuid;
  inserted_count integer;
begin
  select id into target_destination_id
  from public.reporting_destinations
  where company_id = target_company_id
    and dataset = 'holidays'
    and enabled is true;

  if target_destination_id is null then
    return 0;
  end if;

  insert into public.integration_outbox (
    company_id,
    aggregate_type,
    aggregate_id,
    event_type,
    idempotency_key,
    payload
  )
  select
    e.company_id,
    'holiday_event',
    e.id,
    'reporting.holiday.sync',
    'reporting.holiday.backfill:' || target_destination_id::text || ':' || e.id::text,
    jsonb_build_object(
      'dataset', 'holidays',
      'operation', 'upsert',
      'destination_id', target_destination_id,
      'source_updated_at', e.updated_at
    )
  from public.holiday_events e
  where e.company_id = target_company_id
  on conflict (idempotency_key) do nothing;

  get diagnostics inserted_count = row_count;

  update public.reporting_destinations
  set sync_status = case when inserted_count > 0 then 'pending' else sync_status end,
      updated_at = now()
  where id = target_destination_id;

  return inserted_count;
end;
$$;

create or replace function public.claim_holiday_reporting_sync_jobs(
  worker_id uuid,
  job_limit integer default 20,
  lease_seconds integer default 120
)
returns table (
  outbox_id uuid,
  event_id uuid,
  company_id uuid,
  destination_id uuid,
  spreadsheet_id text,
  sheet_name text,
  attempt_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with candidates as (
    select o.id
    from public.integration_outbox o
    join public.reporting_destinations d
      on d.company_id = o.company_id
      and d.dataset = 'holidays'
      and d.enabled is true
    where o.aggregate_type = 'holiday_event'
      and o.event_type = 'reporting.holiday.sync'
      and (
        o.status = 'pending'
        or (o.status = 'processing' and o.lease_expires_at < now())
      )
      and o.next_attempt_at <= now()
    order by o.next_attempt_at, o.created_at
    for update of o skip locked
    limit greatest(1, least(job_limit, 50))
  ), claimed as (
    update public.integration_outbox o
    set status = 'processing',
        lease_owner = worker_id,
        lease_expires_at = now() + make_interval(
          secs => greatest(30, least(lease_seconds, 600))
        ),
        updated_at = now()
    from candidates c
    where o.id = c.id
    returning o.*
  )
  select
    c.id,
    c.aggregate_id,
    c.company_id,
    d.id,
    d.spreadsheet_id,
    d.sheet_name,
    c.attempt_count
  from claimed c
  join public.reporting_destinations d
    on d.company_id = c.company_id
    and d.dataset = 'holidays'
    and d.enabled is true;

  update public.reporting_destinations d
  set sync_status = 'pending',
      last_attempt_at = now(),
      updated_at = now()
  where d.id in (
    select (o.payload ->> 'destination_id')::uuid
    from public.integration_outbox o
    where o.lease_owner = worker_id
      and o.status = 'processing'
      and o.event_type = 'reporting.holiday.sync'
  );
end;
$$;

create or replace function public.complete_holiday_reporting_sync_job(
  target_outbox_id uuid,
  worker_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_company_id uuid;
begin
  select company_id into target_company_id
  from public.integration_outbox
  where id = target_outbox_id
    and event_type = 'reporting.holiday.sync'
    and status = 'processing'
    and lease_owner = worker_id
    and lease_expires_at >= now()
  for update;

  if target_company_id is null then
    return false;
  end if;

  update public.integration_outbox
  set status = 'completed',
      attempt_count = attempt_count + 1,
      lease_owner = null,
      lease_expires_at = null,
      last_error = null,
      processed_at = now(),
      updated_at = now()
  where id = target_outbox_id;

  update public.reporting_destinations
  set sync_status = case
        when exists (
          select 1
          from public.integration_outbox pending
          where pending.company_id = target_company_id
            and pending.event_type = 'reporting.holiday.sync'
            and pending.status = 'failed'
        ) then 'failed'
        when exists (
          select 1
          from public.integration_outbox pending
          where pending.company_id = target_company_id
            and pending.event_type = 'reporting.holiday.sync'
            and pending.status in ('pending', 'processing')
        ) then 'pending'
        else 'healthy'
      end,
      last_successful_sync_at = now(),
      last_error = null,
      alerted_at = case
        when exists (
          select 1
          from public.integration_outbox pending
          where pending.company_id = target_company_id
            and pending.event_type = 'reporting.holiday.sync'
            and pending.status = 'failed'
        ) then alerted_at
        else null
      end,
      updated_at = now()
  where company_id = target_company_id
    and dataset = 'holidays';

  return true;
end;
$$;

create or replace function public.fail_holiday_reporting_sync_job(
  target_outbox_id uuid,
  worker_id uuid,
  safe_error text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_company_id uuid;
  current_attempts integer;
  next_status text;
begin
  select company_id, attempt_count
  into target_company_id, current_attempts
  from public.integration_outbox
  where id = target_outbox_id
    and event_type = 'reporting.holiday.sync'
    and status = 'processing'
    and lease_owner = worker_id
  for update;

  if target_company_id is null then
    return 'stale_lease';
  end if;

  next_status := case when current_attempts + 1 >= 5 then 'failed' else 'pending' end;

  update public.integration_outbox
  set status = next_status,
      attempt_count = attempt_count + 1,
      next_attempt_at = now() + make_interval(
        secs => least(21600, (60 * power(2, least(current_attempts, 8)))::integer)
      ),
      lease_owner = null,
      lease_expires_at = null,
      last_error = left(coalesce(safe_error, 'sheets_unavailable'), 500),
      updated_at = now()
  where id = target_outbox_id;

  update public.reporting_destinations
  set sync_status = case when next_status = 'failed' then 'failed' else 'pending' end,
      last_attempt_at = now(),
      last_error = left(coalesce(safe_error, 'sheets_unavailable'), 500),
      updated_at = now()
  where company_id = target_company_id
    and dataset = 'holidays';

  return next_status;
end;
$$;

create or replace function public.retry_holiday_reporting_sync_job(
  target_outbox_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.integration_outbox
  set status = 'pending',
      next_attempt_at = now(),
      lease_owner = null,
      lease_expires_at = null,
      updated_at = now()
  where id = target_outbox_id
    and event_type = 'reporting.holiday.sync'
    and status in ('pending', 'failed');

  return found;
end;
$$;

create index integration_outbox_reporting_claim_idx
  on public.integration_outbox(next_attempt_at, created_at)
  where event_type = 'reporting.holiday.sync'
    and status in ('pending', 'processing');

create index integration_outbox_reporting_failed_idx
  on public.integration_outbox(company_id, updated_at desc)
  where event_type = 'reporting.holiday.sync'
    and status = 'failed';

revoke execute on function public.set_holiday_event_company_id()
  from public, anon, authenticated;
revoke execute on function public.enqueue_holiday_reporting_event()
  from public, anon, authenticated;
revoke execute on function public.enqueue_holiday_calendar_reporting_events()
  from public, anon, authenticated;
revoke execute on function public.enqueue_holiday_reporting_backfill(uuid)
  from public, anon, authenticated;
revoke execute on function public.claim_holiday_reporting_sync_jobs(uuid, integer, integer)
  from public, anon, authenticated;
revoke execute on function public.complete_holiday_reporting_sync_job(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function public.fail_holiday_reporting_sync_job(uuid, uuid, text)
  from public, anon, authenticated;
revoke execute on function public.retry_holiday_reporting_sync_job(uuid)
  from public, anon, authenticated;

grant execute on function public.enqueue_holiday_reporting_backfill(uuid)
  to service_role;
grant execute on function public.claim_holiday_reporting_sync_jobs(uuid, integer, integer)
  to service_role;
grant execute on function public.complete_holiday_reporting_sync_job(uuid, uuid)
  to service_role;
grant execute on function public.fail_holiday_reporting_sync_job(uuid, uuid, text)
  to service_role;
grant execute on function public.retry_holiday_reporting_sync_job(uuid)
  to service_role;

comment on table public.reporting_destinations is
  'One tenant-isolated external reporting destination per approved dataset.';
comment on column public.holiday_events.company_id is
  'Denormalized tenant key maintained from the owning holiday calendar for durable reporting triggers.';

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select '0044'::text;
$$;

revoke execute on function public.get_app_schema_version()
  from public, anon;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;
