-- Distributed abuse protection for the Phase 5 location ingestion boundary.
-- Limits are technical ceilings, not sampling, attendance, or retention policy.

create table public.location_ingestion_rate_limits (
  scope_key text not null,
  scope_type text not null,
  company_id uuid not null references public.companies(id) on delete cascade,
  tracking_session_id uuid references public.location_tracking_sessions(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  point_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (scope_key, window_started_at),
  constraint location_ingestion_rate_limits_scope_check
    check (scope_type in ('company', 'session')),
  constraint location_ingestion_rate_limits_key_check check (
    (scope_type = 'company' and tracking_session_id is null and scope_key = 'company:' || company_id::text)
    or
    (scope_type = 'session' and tracking_session_id is not null and scope_key = 'session:' || tracking_session_id::text)
  ),
  constraint location_ingestion_rate_limits_counts_check
    check (request_count >= 0 and point_count >= 0)
);

create index location_ingestion_rate_limits_company_window_idx
  on public.location_ingestion_rate_limits(company_id, window_started_at desc);
create index location_ingestion_rate_limits_session_idx
  on public.location_ingestion_rate_limits(tracking_session_id, window_started_at desc)
  where tracking_session_id is not null;

alter table public.location_ingestion_rate_limits enable row level security;
revoke all on table public.location_ingestion_rate_limits
  from public, anon, authenticated;
grant select, insert, update, delete on table public.location_ingestion_rate_limits
  to service_role;

create or replace function public.consume_location_ingestion_rate_limit(
  target_company_id uuid,
  target_employee_id uuid,
  target_session_id uuid,
  requested_points integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  denial_reason text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_window timestamptz := date_trunc('minute', clock_timestamp());
  retry_seconds integer := greatest(
    1,
    60 - floor(extract(second from clock_timestamp()))::integer
  );
  session_requests integer := 0;
  session_points integer := 0;
  company_requests integer := 0;
  company_points integer := 0;
begin
  if requested_points < 0 or requested_points > 100 then
    raise exception using errcode = '22023', message = 'Invalid rate-limit point count.';
  end if;

  if not exists (
    select 1
    from public.location_tracking_sessions tracking_session
    join public.attendance_records attendance
      on attendance.id = tracking_session.attendance_record_id
     and attendance.company_id = tracking_session.company_id
     and attendance.employee_id = tracking_session.employee_id
    where tracking_session.id = target_session_id
      and tracking_session.company_id = target_company_id
      and tracking_session.employee_id = target_employee_id
      and tracking_session.status = 'active'
      and tracking_session.ended_at is null
      and attendance.check_in is not null
      and attendance.check_out is null
  ) then
    return query select false, 0, 'inactive_session'::text;
    return;
  end if;

  -- Consistent lock order serializes concurrent Vercel/serverless requests.
  perform pg_advisory_xact_lock(
    hashtextextended('location-company:' || target_company_id::text, 0)
  );
  perform pg_advisory_xact_lock(
    hashtextextended('location-session:' || target_session_id::text, 0)
  );

  delete from public.location_ingestion_rate_limits
  where company_id = target_company_id
    and window_started_at < current_window - interval '2 hours';

  select request_count, point_count
  into session_requests, session_points
  from public.location_ingestion_rate_limits
  where scope_key = 'session:' || target_session_id::text
    and window_started_at = current_window;

  select request_count, point_count
  into company_requests, company_points
  from public.location_ingestion_rate_limits
  where scope_key = 'company:' || target_company_id::text
    and window_started_at = current_window;

  session_requests := coalesce(session_requests, 0);
  session_points := coalesce(session_points, 0);
  company_requests := coalesce(company_requests, 0);
  company_points := coalesce(company_points, 0);

  if session_requests + 1 > 60 or session_points + requested_points > 1000 then
    return query select false, retry_seconds, 'session_limit'::text;
    return;
  end if;

  if company_requests + 1 > 1000 or company_points + requested_points > 50000 then
    return query select false, retry_seconds, 'company_limit'::text;
    return;
  end if;

  insert into public.location_ingestion_rate_limits (
    scope_key, scope_type, company_id, tracking_session_id,
    window_started_at, request_count, point_count
  ) values (
    'company:' || target_company_id::text,
    'company', target_company_id, null, current_window, 1, requested_points
  )
  on conflict (scope_key, window_started_at) do update
  set request_count = location_ingestion_rate_limits.request_count + 1,
      point_count = location_ingestion_rate_limits.point_count + excluded.point_count,
      updated_at = now();

  insert into public.location_ingestion_rate_limits (
    scope_key, scope_type, company_id, tracking_session_id,
    window_started_at, request_count, point_count
  ) values (
    'session:' || target_session_id::text,
    'session', target_company_id, target_session_id,
    current_window, 1, requested_points
  )
  on conflict (scope_key, window_started_at) do update
  set request_count = location_ingestion_rate_limits.request_count + 1,
      point_count = location_ingestion_rate_limits.point_count + excluded.point_count,
      updated_at = now();

  return query select true, 0, null::text;
end;
$$;

create or replace function public.cleanup_closed_location_session_rate_limits()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.status = 'active' and new.status <> 'active' then
    delete from public.location_ingestion_rate_limits
    where tracking_session_id = new.id;
  end if;
  return new;
end;
$$;

create trigger cleanup_closed_location_session_rate_limits_trigger
after update of status on public.location_tracking_sessions
for each row execute function public.cleanup_closed_location_session_rate_limits();

revoke execute on function public.consume_location_ingestion_rate_limit(uuid, uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.consume_location_ingestion_rate_limit(uuid, uuid, uuid, integer)
  to service_role;
revoke execute on function public.cleanup_closed_location_session_rate_limits()
  from public, anon, authenticated;

comment on table public.location_ingestion_rate_limits is
  'Short-lived distributed technical abuse counters; contains no coordinates or route payloads.';
comment on function public.consume_location_ingestion_rate_limit(uuid, uuid, uuid, integer) is
  'Atomically consumes tenant/session request and new-point budgets for active duty ingestion.';

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select '0046'::text;
$$;

revoke execute on function public.get_app_schema_version()
  from public, anon;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;
