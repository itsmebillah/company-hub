-- Phase 5 tracking core. Collection clients and ingestion APIs remain inactive.

create type public.location_tracking_session_status as enum (
  'active',
  'completed',
  'stopped',
  'revoked'
);

alter table public.attendance_records
  add constraint attendance_records_tracking_scope_unique
  unique (id, company_id, employee_id);

create table public.location_tracking_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  employee_id uuid not null,
  attendance_record_id uuid not null,
  status public.location_tracking_session_status not null default 'active',
  started_at timestamptz not null,
  ended_at timestamptz,
  end_reason text,
  last_point_received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint location_tracking_sessions_employee_company_fk
    foreign key (employee_id, company_id)
    references public.employees(id, company_id) on delete restrict,
  constraint location_tracking_sessions_attendance_fk
    foreign key (attendance_record_id, company_id, employee_id)
    references public.attendance_records(id, company_id, employee_id)
    on delete restrict,
  constraint location_tracking_sessions_attendance_unique
    unique (attendance_record_id),
  constraint location_tracking_sessions_identity_unique
    unique (id, company_id, employee_id),
  constraint location_tracking_sessions_lifecycle_check check (
    (status = 'active' and ended_at is null and end_reason is null)
    or
    (status <> 'active' and ended_at is not null and end_reason is not null)
  ),
  constraint location_tracking_sessions_end_after_start_check
    check (ended_at is null or ended_at >= started_at),
  constraint location_tracking_sessions_end_reason_length_check
    check (end_reason is null or char_length(end_reason) between 1 and 64),
  constraint location_tracking_sessions_last_point_check
    check (last_point_received_at is null or last_point_received_at >= started_at)
);

create unique index location_tracking_sessions_one_active_employee_idx
  on public.location_tracking_sessions(employee_id)
  where status = 'active';
create index location_tracking_sessions_company_status_idx
  on public.location_tracking_sessions(company_id, status, started_at desc);
create index location_tracking_sessions_employee_started_idx
  on public.location_tracking_sessions(employee_id, started_at desc);
create index location_tracking_sessions_attendance_idx
  on public.location_tracking_sessions(attendance_record_id);

create table public.location_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  employee_id uuid not null,
  tracking_session_id uuid not null,
  idempotency_key text not null,
  observed_at timestamptz not null,
  received_at timestamptz not null default now(),
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  accuracy_meters numeric(8, 2) not null,
  speed_meters_per_second numeric(7, 2),
  heading_degrees numeric(6, 2),
  battery_percent numeric(5, 2),
  is_mock_location boolean,
  created_at timestamptz not null default now(),
  constraint location_history_session_fk
    foreign key (tracking_session_id, company_id, employee_id)
    references public.location_tracking_sessions(id, company_id, employee_id)
    on delete restrict,
  constraint location_history_idempotency_unique
    unique (tracking_session_id, idempotency_key),
  constraint location_history_identity_unique
    unique (id, company_id, employee_id, tracking_session_id),
  constraint location_history_idempotency_key_check
    check (char_length(idempotency_key) between 8 and 128 and idempotency_key !~ '[[:space:]]'),
  constraint location_history_latitude_check check (latitude between -90 and 90),
  constraint location_history_longitude_check check (longitude between -180 and 180),
  constraint location_history_accuracy_check check (accuracy_meters between 0 and 10000),
  constraint location_history_speed_check
    check (speed_meters_per_second is null or speed_meters_per_second between 0 and 200),
  constraint location_history_heading_check
    check (heading_degrees is null or heading_degrees between 0 and 360),
  constraint location_history_battery_check
    check (battery_percent is null or battery_percent between 0 and 100),
  constraint location_history_received_time_check
    check (received_at <= created_at + interval '1 minute')
);

create index location_history_company_employee_observed_idx
  on public.location_history(company_id, employee_id, observed_at desc);
create index location_history_session_observed_idx
  on public.location_history(tracking_session_id, observed_at);
create index location_history_received_idx
  on public.location_history(received_at desc);

create table public.employee_current_locations (
  company_id uuid not null,
  employee_id uuid not null,
  tracking_session_id uuid not null,
  location_history_id uuid not null,
  observed_at timestamptz not null,
  received_at timestamptz not null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  accuracy_meters numeric(8, 2) not null,
  speed_meters_per_second numeric(7, 2),
  heading_degrees numeric(6, 2),
  battery_percent numeric(5, 2),
  updated_at timestamptz not null default now(),
  primary key (employee_id),
  constraint employee_current_locations_point_fk
    foreign key (location_history_id, company_id, employee_id, tracking_session_id)
    references public.location_history(id, company_id, employee_id, tracking_session_id)
    on delete restrict,
  constraint employee_current_locations_session_unique unique (tracking_session_id),
  constraint employee_current_locations_company_employee_unique
    unique (company_id, employee_id)
);

create index employee_current_locations_company_observed_idx
  on public.employee_current_locations(company_id, observed_at desc);

create or replace function public.enforce_tracking_session_lifecycle()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' then
    if new.company_id <> old.company_id
      or new.employee_id <> old.employee_id
      or new.attendance_record_id <> old.attendance_record_id
      or new.started_at <> old.started_at then
      raise exception using errcode = '55000', message = 'Tracking session identity is immutable.';
    end if;

    if old.status <> 'active' and new.status <> old.status then
      raise exception using errcode = '55000', message = 'A closed tracking session cannot transition.';
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_tracking_session_lifecycle_trigger
before update on public.location_tracking_sessions
for each row execute function public.enforce_tracking_session_lifecycle();

create or replace function public.can_access_employee_location(
  target_company_id uuid,
  target_employee_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.employees caller
    join public.employees target
      on target.id = target_employee_id
     and target.company_id = target_company_id
    where caller.auth_user_id = auth.uid()
      and caller.status = 'active'
      and caller.company_id = target.company_id
      and public.is_feature_enabled_for_company(caller.company_id, 'attendance')
      and (
        caller.id = target.id
        or target.manager_id = caller.id
        or public.is_company_admin(auth.uid())
      )
  );
$$;

create or replace function public.sync_attendance_tracking_session()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.check_in is not null then
    insert into public.location_tracking_sessions (
      company_id,
      employee_id,
      attendance_record_id,
      status,
      started_at,
      ended_at,
      end_reason
    ) values (
      new.company_id,
      new.employee_id,
      new.id,
      case
        when new.check_out is null then 'active'::public.location_tracking_session_status
        else 'completed'::public.location_tracking_session_status
      end,
      new.check_in,
      new.check_out,
      case when new.check_out is null then null else 'attendance_checkout' end
    )
    on conflict (attendance_record_id) do nothing;
  end if;

  if new.check_out is not null then
    update public.location_tracking_sessions
    set status = 'completed',
        ended_at = new.check_out,
        end_reason = 'attendance_checkout',
        updated_at = now()
    where attendance_record_id = new.id
      and status = 'active';

    delete from public.employee_current_locations
    where tracking_session_id in (
      select id
      from public.location_tracking_sessions
      where attendance_record_id = new.id
    );
  end if;

  return new;
end;
$$;

create trigger sync_attendance_tracking_session_trigger
after insert or update of check_in, check_out
on public.attendance_records
for each row execute function public.sync_attendance_tracking_session();

create or replace function public.validate_and_project_location_point()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_session public.location_tracking_sessions%rowtype;
begin
  select * into target_session
  from public.location_tracking_sessions
  where id = new.tracking_session_id
  for update;

  if target_session.id is null
    or target_session.status <> 'active'
    or target_session.ended_at is not null then
    raise exception using errcode = '23514', message = 'Location point requires an active duty session.';
  end if;

  if new.company_id <> target_session.company_id
    or new.employee_id <> target_session.employee_id then
    raise exception using errcode = '23514', message = 'Location point scope does not match its duty session.';
  end if;

  if new.observed_at < target_session.started_at
    or new.observed_at > now() + interval '5 minutes' then
    raise exception using errcode = '22007', message = 'Location timestamp is outside the active duty bounds.';
  end if;

  if new.received_at > now() + interval '1 minute' then
    raise exception using errcode = '22007', message = 'Location receipt timestamp is invalid.';
  end if;

  update public.location_tracking_sessions
  set last_point_received_at = greatest(last_point_received_at, new.received_at),
      updated_at = now()
  where id = new.tracking_session_id;

  return new;
end;
$$;

create trigger validate_location_history_insert_trigger
before insert on public.location_history
for each row execute function public.validate_and_project_location_point();

create or replace function public.project_employee_current_location()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.employee_current_locations (
    company_id, employee_id, tracking_session_id, location_history_id,
    observed_at, received_at, latitude, longitude, accuracy_meters,
    speed_meters_per_second, heading_degrees, battery_percent, updated_at
  ) values (
    new.company_id, new.employee_id, new.tracking_session_id, new.id,
    new.observed_at, new.received_at, new.latitude, new.longitude,
    new.accuracy_meters, new.speed_meters_per_second, new.heading_degrees,
    new.battery_percent, now()
  )
  on conflict (employee_id) do update
  set company_id = excluded.company_id,
      tracking_session_id = excluded.tracking_session_id,
      location_history_id = excluded.location_history_id,
      observed_at = excluded.observed_at,
      received_at = excluded.received_at,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      accuracy_meters = excluded.accuracy_meters,
      speed_meters_per_second = excluded.speed_meters_per_second,
      heading_degrees = excluded.heading_degrees,
      battery_percent = excluded.battery_percent,
      updated_at = now()
  where excluded.observed_at > employee_current_locations.observed_at
     or (
       excluded.observed_at = employee_current_locations.observed_at
       and excluded.received_at > employee_current_locations.received_at
     );

  return new;
end;
$$;

create trigger project_employee_current_location_trigger
after insert on public.location_history
for each row execute function public.project_employee_current_location();

create or replace function public.prevent_location_history_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception using errcode = '55000', message = 'Location history is immutable.';
end;
$$;

create trigger prevent_location_history_update_trigger
before update on public.location_history
for each row execute function public.prevent_location_history_mutation();

alter table public.location_tracking_sessions enable row level security;
alter table public.location_history enable row level security;
alter table public.employee_current_locations enable row level security;

create policy "Authorized employees can read tracking sessions"
on public.location_tracking_sessions for select to authenticated
using (public.can_access_employee_location(company_id, employee_id));

create policy "Authorized employees can read location history"
on public.location_history for select to authenticated
using (public.can_access_employee_location(company_id, employee_id));

create policy "Authorized employees can read current locations"
on public.employee_current_locations for select to authenticated
using (public.can_access_employee_location(company_id, employee_id));

revoke all on table public.location_tracking_sessions from public, anon, authenticated;
revoke all on table public.location_history from public, anon, authenticated;
revoke all on table public.employee_current_locations from public, anon, authenticated;
grant select on table public.location_tracking_sessions to authenticated;
grant select on table public.location_history to authenticated;
grant select on table public.employee_current_locations to authenticated;
grant all on table public.location_tracking_sessions to service_role;
grant insert, select on table public.location_history to service_role;
grant select, insert, update, delete on table public.employee_current_locations to service_role;

revoke execute on function public.can_access_employee_location(uuid, uuid)
  from public, anon;
grant execute on function public.can_access_employee_location(uuid, uuid)
  to authenticated, service_role;
revoke execute on function public.sync_attendance_tracking_session()
  from public, anon, authenticated;
revoke execute on function public.enforce_tracking_session_lifecycle()
  from public, anon, authenticated;
revoke execute on function public.validate_and_project_location_point()
  from public, anon, authenticated;
revoke execute on function public.project_employee_current_location()
  from public, anon, authenticated;
revoke execute on function public.prevent_location_history_mutation()
  from public, anon, authenticated;

comment on table public.location_tracking_sessions is
  'Authoritative duty-bound tracking sessions created and closed from attendance lifecycle changes.';
comment on table public.location_history is
  'Immutable tenant-scoped route points. Coordinates must not be copied to logs or reporting datasets.';
comment on table public.employee_current_locations is
  'Derived latest-point projection; location_history remains the historical source of truth.';
comment on function public.can_access_employee_location(uuid, uuid) is
  'Caller-derived access: self, direct reports only, or Company Admin within the same enabled tenant.';

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select '0045'::text;
$$;

revoke execute on function public.get_app_schema_version()
  from public, anon;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;
