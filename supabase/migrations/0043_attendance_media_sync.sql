create table public.attendance_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  attendance_record_id uuid not null references public.attendance_records(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  phase text not null,
  source_bucket text not null default 'attendance-selfies',
  source_object_path text not null,
  source_deleted_at timestamptz,
  provider text not null default 'google_drive',
  drive_file_id text,
  drive_folder_id text,
  drive_url text,
  sync_status text not null default 'pending',
  retry_count integer not null default 0,
  last_attempt_at timestamptz,
  synced_at timestamptz,
  purge_after timestamptz,
  last_error text,
  cache_status text not null default 'active',
  cleanup_retry_count integer not null default 0,
  cleanup_next_attempt_at timestamptz,
  cleanup_lease_owner uuid,
  cleanup_lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_attachments_phase_check
    check (phase in ('checkin', 'checkout')),
  constraint attendance_attachments_provider_check
    check (provider = 'google_drive'),
  constraint attendance_attachments_sync_status_check
    check (sync_status in ('pending', 'processing', 'synced')),
  constraint attendance_attachments_cache_status_check
    check (cache_status in ('active', 'purge_pending', 'purged')),
  constraint attendance_attachments_retry_count_check
    check (retry_count >= 0 and cleanup_retry_count >= 0),
  constraint attendance_attachments_record_phase_unique
    unique (attendance_record_id, phase),
  constraint attendance_attachments_source_unique
    unique (source_bucket, source_object_path)
);

create table public.integration_outbox (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_owner uuid,
  lease_expires_at timestamptz,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_outbox_aggregate_type_check
    check (aggregate_type = 'attendance_attachment'),
  constraint integration_outbox_event_type_check
    check (event_type = 'attendance.selfie.sync'),
  constraint integration_outbox_status_check
    check (status in ('pending', 'processing', 'completed')),
  constraint integration_outbox_attempt_count_check
    check (attempt_count >= 0),
  constraint integration_outbox_payload_object_check
    check (jsonb_typeof(payload) = 'object')
);

create table public.attendance_media_cleanup_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  attachment_id uuid not null references public.attendance_attachments(id) on delete cascade,
  outcome text not null,
  detail text,
  occurred_at timestamptz not null default now(),
  constraint attendance_media_cleanup_logs_outcome_check
    check (outcome in ('purged', 'failed', 'skipped'))
);

create index attendance_attachments_company_idx
  on public.attendance_attachments(company_id, created_at desc);
create index attendance_attachments_attendance_idx
  on public.attendance_attachments(attendance_record_id);
create index attendance_attachments_employee_idx
  on public.attendance_attachments(employee_id, created_at desc);
create index attendance_attachments_sync_idx
  on public.attendance_attachments(sync_status, created_at)
  where sync_status <> 'synced';
create index attendance_attachments_cleanup_idx
  on public.attendance_attachments(purge_after, cleanup_next_attempt_at)
  where sync_status = 'synced' and source_deleted_at is null;
create unique index attendance_attachments_drive_file_unique
  on public.attendance_attachments(drive_file_id)
  where drive_file_id is not null;
create index integration_outbox_claim_idx
  on public.integration_outbox(next_attempt_at, created_at)
  where status = 'pending';
create index integration_outbox_aggregate_idx
  on public.integration_outbox(aggregate_id, created_at desc);
create index attendance_media_cleanup_logs_attachment_idx
  on public.attendance_media_cleanup_logs(attachment_id, occurred_at desc);

alter table public.attendance_attachments enable row level security;
alter table public.integration_outbox enable row level security;
alter table public.attendance_media_cleanup_logs enable row level security;

revoke all on table public.attendance_attachments from anon, authenticated;
revoke all on table public.integration_outbox from anon, authenticated;
revoke all on table public.attendance_media_cleanup_logs from anon, authenticated;
grant all on table public.attendance_attachments to service_role;
grant all on table public.integration_outbox to service_role;
grant all on table public.attendance_media_cleanup_logs to service_role;

create or replace function public.enqueue_attendance_attachment(
  target_attendance public.attendance_records,
  target_phase text,
  target_path text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  attachment_id uuid;
begin
  if target_path is null or btrim(target_path) = '' then
    return;
  end if;

  insert into public.attendance_attachments (
    company_id,
    attendance_record_id,
    employee_id,
    phase,
    source_object_path
  ) values (
    target_attendance.company_id,
    target_attendance.id,
    target_attendance.employee_id,
    target_phase,
    target_path
  )
  on conflict (attendance_record_id, phase) do update
  set source_object_path = excluded.source_object_path,
      source_deleted_at = null,
      drive_file_id = case
        when attendance_attachments.source_object_path = excluded.source_object_path
          then attendance_attachments.drive_file_id
        else null
      end,
      drive_folder_id = case
        when attendance_attachments.source_object_path = excluded.source_object_path
          then attendance_attachments.drive_folder_id
        else null
      end,
      drive_url = case
        when attendance_attachments.source_object_path = excluded.source_object_path
          then attendance_attachments.drive_url
        else null
      end,
      sync_status = case
        when attendance_attachments.source_object_path = excluded.source_object_path
          then attendance_attachments.sync_status
        else 'pending'
      end,
      synced_at = case
        when attendance_attachments.source_object_path = excluded.source_object_path
          then attendance_attachments.synced_at
        else null
      end,
      purge_after = case
        when attendance_attachments.source_object_path = excluded.source_object_path
          then attendance_attachments.purge_after
        else null
      end,
      cache_status = 'active',
      updated_at = now()
  returning id into attachment_id;

  insert into public.integration_outbox (
    company_id,
    aggregate_type,
    aggregate_id,
    event_type,
    idempotency_key,
    payload
  ) values (
    target_attendance.company_id,
    'attendance_attachment',
    attachment_id,
    'attendance.selfie.sync',
    'attendance.selfie.sync:' || attachment_id::text,
    jsonb_build_object('attendance_record_id', target_attendance.id, 'phase', target_phase)
  )
  on conflict (idempotency_key) do update
  set status = case
        when integration_outbox.status = 'completed' then integration_outbox.status
        else 'pending'
      end,
      next_attempt_at = case
        when integration_outbox.status = 'completed' then integration_outbox.next_attempt_at
        else now()
      end,
      updated_at = now();
end;
$$;

create or replace function public.capture_attendance_attachments()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.check_in_selfie_path is not null
    and (tg_op = 'INSERT' or old.check_in_selfie_path is distinct from new.check_in_selfie_path)
  then
    perform public.enqueue_attendance_attachment(new, 'checkin', new.check_in_selfie_path);
  end if;

  if new.check_out_selfie_path is not null
    and (tg_op = 'INSERT' or old.check_out_selfie_path is distinct from new.check_out_selfie_path)
  then
    perform public.enqueue_attendance_attachment(new, 'checkout', new.check_out_selfie_path);
  end if;

  return new;
end;
$$;

drop trigger if exists capture_attendance_attachments_trigger
  on public.attendance_records;
create trigger capture_attendance_attachments_trigger
after insert or update of check_in_selfie_path, check_out_selfie_path
on public.attendance_records
for each row execute function public.capture_attendance_attachments();

insert into public.attendance_attachments (
  company_id,
  attendance_record_id,
  employee_id,
  phase,
  source_object_path
)
select company_id, id, employee_id, 'checkin', check_in_selfie_path
from public.attendance_records
where check_in_selfie_path is not null
on conflict (attendance_record_id, phase) do nothing;

insert into public.attendance_attachments (
  company_id,
  attendance_record_id,
  employee_id,
  phase,
  source_object_path
)
select company_id, id, employee_id, 'checkout', check_out_selfie_path
from public.attendance_records
where check_out_selfie_path is not null
on conflict (attendance_record_id, phase) do nothing;

insert into public.integration_outbox (
  company_id,
  aggregate_type,
  aggregate_id,
  event_type,
  idempotency_key,
  payload
)
select
  company_id,
  'attendance_attachment',
  id,
  'attendance.selfie.sync',
  'attendance.selfie.sync:' || id::text,
  jsonb_build_object('attendance_record_id', attendance_record_id, 'phase', phase)
from public.attendance_attachments
where sync_status = 'pending'
on conflict (idempotency_key) do nothing;

create or replace function public.claim_attendance_media_sync_jobs(
  worker_id uuid,
  job_limit integer default 10,
  lease_seconds integer default 120
)
returns table (
  outbox_id uuid,
  attachment_id uuid,
  company_id uuid,
  source_bucket text,
  source_object_path text,
  phase text,
  drive_file_id text,
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
    join public.attendance_attachments a on a.id = o.aggregate_id
    where o.event_type = 'attendance.selfie.sync'
      and a.sync_status <> 'synced'
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
        lease_expires_at = now() + make_interval(secs => greatest(30, least(lease_seconds, 600))),
        updated_at = now()
    from candidates c
    where o.id = c.id
    returning o.*
  )
  select
    c.id,
    a.id,
    a.company_id,
    a.source_bucket,
    a.source_object_path,
    a.phase,
    a.drive_file_id,
    c.attempt_count
  from claimed c
  join public.attendance_attachments a on a.id = c.aggregate_id;

  update public.attendance_attachments a
  set sync_status = 'processing',
      last_attempt_at = now(),
      updated_at = now()
  where a.id in (
    select o.aggregate_id
    from public.integration_outbox o
    where o.lease_owner = worker_id and o.status = 'processing'
  );
end;
$$;

create or replace function public.complete_attendance_media_sync_job(
  target_outbox_id uuid,
  worker_id uuid,
  target_drive_file_id text,
  target_drive_folder_id text,
  target_drive_url text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_attachment_id uuid;
begin
  select aggregate_id into target_attachment_id
  from public.integration_outbox
  where id = target_outbox_id
    and status = 'processing'
    and lease_owner = worker_id
    and lease_expires_at >= now()
  for update;

  if target_attachment_id is null then
    return false;
  end if;

  update public.attendance_attachments
  set drive_file_id = target_drive_file_id,
      drive_folder_id = target_drive_folder_id,
      drive_url = target_drive_url,
      sync_status = 'synced',
      synced_at = now(),
      purge_after = now() + interval '3 days',
      last_error = null,
      cache_status = 'active',
      updated_at = now()
  where id = target_attachment_id;

  update public.integration_outbox
  set status = 'completed',
      attempt_count = attempt_count + 1,
      lease_owner = null,
      lease_expires_at = null,
      last_error = null,
      processed_at = now(),
      updated_at = now()
  where id = target_outbox_id;

  return true;
end;
$$;

create or replace function public.fail_attendance_media_sync_job(
  target_outbox_id uuid,
  worker_id uuid,
  safe_error text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_attachment_id uuid;
  current_attempts integer;
begin
  select aggregate_id, attempt_count into target_attachment_id, current_attempts
  from public.integration_outbox
  where id = target_outbox_id
    and status = 'processing'
    and lease_owner = worker_id
  for update;

  if target_attachment_id is null then
    return false;
  end if;

  update public.attendance_attachments
  set sync_status = 'pending',
      retry_count = retry_count + 1,
      last_error = left(coalesce(safe_error, 'provider_unavailable'), 500),
      updated_at = now()
  where id = target_attachment_id;

  update public.integration_outbox
  set status = 'pending',
      attempt_count = attempt_count + 1,
      next_attempt_at = now() + make_interval(
        secs => least(86400, (60 * power(2, least(current_attempts, 10)))::integer)
      ),
      lease_owner = null,
      lease_expires_at = null,
      last_error = left(coalesce(safe_error, 'provider_unavailable'), 500),
      updated_at = now()
  where id = target_outbox_id;

  return true;
end;
$$;

create or replace function public.claim_attendance_media_cleanup_jobs(
  worker_id uuid,
  job_limit integer default 20,
  lease_seconds integer default 120
)
returns table (
  attachment_id uuid,
  company_id uuid,
  source_bucket text,
  source_object_path text,
  drive_file_id text,
  cleanup_retry_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with candidates as (
    select a.id
    from public.attendance_attachments a
    where a.sync_status = 'synced'
      and a.drive_file_id is not null
      and a.source_deleted_at is null
      and a.purge_after <= now()
      and coalesce(a.cleanup_next_attempt_at, a.purge_after) <= now()
      and (
        a.cleanup_lease_expires_at is null
        or a.cleanup_lease_expires_at < now()
      )
    order by a.purge_after, a.created_at
    for update skip locked
    limit greatest(1, least(job_limit, 100))
  ), claimed as (
    update public.attendance_attachments a
    set cache_status = 'purge_pending',
        cleanup_lease_owner = worker_id,
        cleanup_lease_expires_at = now() + make_interval(secs => greatest(30, least(lease_seconds, 600))),
        updated_at = now()
    from candidates c
    where a.id = c.id
    returning a.*
  )
  select
    c.id,
    c.company_id,
    c.source_bucket,
    c.source_object_path,
    c.drive_file_id,
    c.cleanup_retry_count
  from claimed c;
end;
$$;

create or replace function public.complete_attendance_media_cleanup_job(
  target_attachment_id uuid,
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
  update public.attendance_attachments
  set source_deleted_at = now(),
      cache_status = 'purged',
      cleanup_lease_owner = null,
      cleanup_lease_expires_at = null,
      last_error = null,
      updated_at = now()
  where id = target_attachment_id
    and cleanup_lease_owner = worker_id
    and cleanup_lease_expires_at >= now()
    and sync_status = 'synced'
    and drive_file_id is not null
    and purge_after <= now()
  returning company_id into target_company_id;

  if target_company_id is null then
    return false;
  end if;

  insert into public.attendance_media_cleanup_logs (
    company_id, attachment_id, outcome, detail
  ) values (
    target_company_id, target_attachment_id, 'purged', 'supabase_cache_removed'
  );

  return true;
end;
$$;

create or replace function public.fail_attendance_media_cleanup_job(
  target_attachment_id uuid,
  worker_id uuid,
  safe_error text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_company_id uuid;
  current_attempts integer;
begin
  select company_id, cleanup_retry_count
    into target_company_id, current_attempts
  from public.attendance_attachments
  where id = target_attachment_id
    and cleanup_lease_owner = worker_id
  for update;

  if target_company_id is null then
    return false;
  end if;

  update public.attendance_attachments
  set cache_status = 'active',
      cleanup_retry_count = cleanup_retry_count + 1,
      cleanup_next_attempt_at = now() + make_interval(
        secs => least(86400, (300 * power(2, least(current_attempts, 8)))::integer)
      ),
      cleanup_lease_owner = null,
      cleanup_lease_expires_at = null,
      last_error = left(coalesce(safe_error, 'cleanup_failed'), 500),
      updated_at = now()
  where id = target_attachment_id;

  insert into public.attendance_media_cleanup_logs (
    company_id, attachment_id, outcome, detail
  ) values (
    target_company_id,
    target_attachment_id,
    'failed',
    left(coalesce(safe_error, 'cleanup_failed'), 500)
  );

  return true;
end;
$$;

revoke execute on function public.enqueue_attendance_attachment(public.attendance_records, text, text)
  from public, anon, authenticated;
revoke execute on function public.capture_attendance_attachments()
  from public, anon, authenticated;
revoke execute on function public.claim_attendance_media_sync_jobs(uuid, integer, integer)
  from public, anon, authenticated;
revoke execute on function public.complete_attendance_media_sync_job(uuid, uuid, text, text, text)
  from public, anon, authenticated;
revoke execute on function public.fail_attendance_media_sync_job(uuid, uuid, text)
  from public, anon, authenticated;
revoke execute on function public.claim_attendance_media_cleanup_jobs(uuid, integer, integer)
  from public, anon, authenticated;
revoke execute on function public.complete_attendance_media_cleanup_job(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function public.fail_attendance_media_cleanup_job(uuid, uuid, text)
  from public, anon, authenticated;

grant execute on function public.claim_attendance_media_sync_jobs(uuid, integer, integer)
  to service_role;
grant execute on function public.complete_attendance_media_sync_job(uuid, uuid, text, text, text)
  to service_role;
grant execute on function public.fail_attendance_media_sync_job(uuid, uuid, text)
  to service_role;
grant execute on function public.claim_attendance_media_cleanup_jobs(uuid, integer, integer)
  to service_role;
grant execute on function public.complete_attendance_media_cleanup_job(uuid, uuid)
  to service_role;
grant execute on function public.fail_attendance_media_cleanup_job(uuid, uuid, text)
  to service_role;

comment on table public.attendance_attachments is
  'Permanent attendance selfie metadata; Supabase bytes are a three-day cache after verified Drive sync.';
comment on table public.integration_outbox is
  'Durable idempotent external-integration work claimed with expiring leases.';
comment on table public.attendance_media_cleanup_logs is
  'Credential-redacted audit results for Supabase attendance cache cleanup.';

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select '0043'::text;
$$;

revoke execute on function public.get_app_schema_version()
  from public, anon;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;
