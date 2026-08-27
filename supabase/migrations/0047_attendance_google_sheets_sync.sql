-- Attendance reporting is a derived, retryable projection. Attendance remains authoritative.
alter table public.integration_outbox
  drop constraint integration_outbox_aggregate_type_check,
  drop constraint integration_outbox_event_type_check;
alter table public.integration_outbox
  add constraint integration_outbox_aggregate_type_check
    check (aggregate_type in ('attendance_attachment', 'holiday_event', 'attendance_record')),
  add constraint integration_outbox_event_type_check
    check (event_type in ('attendance.selfie.sync', 'reporting.holiday.sync', 'reporting.attendance.sync'));
alter table public.reporting_destinations
  drop constraint reporting_destinations_dataset_check;
alter table public.reporting_destinations
  add constraint reporting_destinations_dataset_check
    check (dataset in ('holidays', 'attendance'));

create or replace function public.enqueue_attendance_reporting_event()
returns trigger language plpgsql security definer
set search_path = public, pg_temp as $$
declare destination_id uuid;
begin
  select id into destination_id from public.reporting_destinations
   where company_id = new.company_id and dataset = 'attendance' and enabled is true;
  if destination_id is null then return new; end if;
  insert into public.integration_outbox(company_id,aggregate_type,aggregate_id,event_type,idempotency_key,payload)
  values (new.company_id,'attendance_record',new.id,'reporting.attendance.sync',
    'reporting.attendance.sync:' || new.id::text,
    jsonb_build_object('dataset','attendance','operation','upsert','destination_id',destination_id,'source_updated_at',new.updated_at))
  on conflict (idempotency_key) do update set
    status = case when integration_outbox.status = 'completed' then integration_outbox.status else 'pending' end,
    next_attempt_at = case when integration_outbox.status = 'completed' then integration_outbox.next_attempt_at else now() end,
    payload = excluded.payload, updated_at = now();
  update public.reporting_destinations set sync_status='pending',updated_at=now() where id=destination_id;
  return new;
end; $$;

drop trigger if exists enqueue_attendance_reporting_event_trigger on public.attendance_records;
create trigger enqueue_attendance_reporting_event_trigger after insert or update on public.attendance_records
for each row execute function public.enqueue_attendance_reporting_event();

create or replace function public.enqueue_attendance_reporting_backfill(target_company_id uuid)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare destination_id uuid; inserted_count integer;
begin
 select id into destination_id from public.reporting_destinations where company_id=target_company_id and dataset='attendance' and enabled is true;
 if destination_id is null then return 0; end if;
 insert into public.integration_outbox(company_id,aggregate_type,aggregate_id,event_type,idempotency_key,payload)
 select a.company_id,'attendance_record',a.id,'reporting.attendance.sync','reporting.attendance.backfill:'||destination_id::text||':'||a.id::text,
   jsonb_build_object('dataset','attendance','operation','upsert','destination_id',destination_id,'source_updated_at',a.updated_at)
 from public.attendance_records a where a.company_id=target_company_id on conflict(idempotency_key) do nothing;
 get diagnostics inserted_count=row_count;
 update public.reporting_destinations set sync_status=case when inserted_count>0 then 'pending' else sync_status end,updated_at=now() where id=destination_id;
 return inserted_count;
end; $$;

create or replace function public.claim_attendance_reporting_sync_jobs(worker_id uuid, job_limit integer default 20, lease_seconds integer default 180)
returns table(outbox_id uuid,event_id uuid,company_id uuid,destination_id uuid,spreadsheet_id text,sheet_name text,attempt_count integer)
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 return query with candidates as (
  select o.id from public.integration_outbox o join public.reporting_destinations d on d.id=(o.payload->>'destination_id')::uuid
  where o.aggregate_type='attendance_record' and o.event_type='reporting.attendance.sync' and d.dataset='attendance' and d.enabled is true
   and ((o.status='pending' and o.next_attempt_at<=now()) or (o.status='processing' and o.lease_expires_at<now()))
  order by o.next_attempt_at,o.created_at limit job_limit for update of o skip locked
 ), leased as (
  update public.integration_outbox o set status='processing',locked_by=worker_id,lease_expires_at=now()+make_interval(secs=>lease_seconds),attempt_count=o.attempt_count+1,updated_at=now()
  from candidates c where o.id=c.id returning o.*
 ) select l.id,l.aggregate_id,l.company_id,d.id,d.spreadsheet_id,d.sheet_name,l.attempt_count
 from leased l join public.reporting_destinations d on d.id=(l.payload->>'destination_id')::uuid;
end; $$;

create or replace function public.complete_attendance_reporting_sync_job(target_outbox_id uuid, worker_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin update public.integration_outbox set status='completed',locked_by=null,lease_expires_at=null,last_error=null,updated_at=now() where id=target_outbox_id and status='processing' and locked_by=worker_id; return found; end; $$;
create or replace function public.fail_attendance_reporting_sync_job(target_outbox_id uuid, worker_id uuid, safe_error text)
returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare next_status text; begin
 update public.integration_outbox set status=case when attempt_count>=8 then 'failed' else 'pending' end,next_attempt_at=now()+least(power(2,attempt_count)::integer*interval '1 minute',interval '6 hours'),locked_by=null,lease_expires_at=null,last_error=left(safe_error,200),updated_at=now() where id=target_outbox_id and status='processing' and locked_by=worker_id returning status into next_status; return coalesce(next_status,'failed'); end; $$;

grant execute on function public.enqueue_attendance_reporting_backfill(uuid) to service_role;
grant execute on function public.claim_attendance_reporting_sync_jobs(uuid,integer,integer) to service_role;
grant execute on function public.complete_attendance_reporting_sync_job(uuid,uuid) to service_role;
grant execute on function public.fail_attendance_reporting_sync_job(uuid,uuid,text) to service_role;
comment on table public.reporting_destinations is 'Derived reporting destinations for holidays and attendance; authoritative data remains in source tables.';