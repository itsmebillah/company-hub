-- Sprint: Attendance working hours and late policy
-- Adds company-configurable office-hour settings and immutable attendance
-- snapshots so late calculations remain historically accurate.

-- ---------------------------------------------------------------------------
-- Company attendance working-hours settings.
-- Stores the office grace period and weekend toggle alongside the existing
-- office start/end and early/late policy fields on company_settings.
-- ---------------------------------------------------------------------------

alter table public.company_settings
  add column if not exists office_grace_period_minutes integer,
  add column if not exists weekend_working_enabled boolean;

update public.company_settings
set office_grace_period_minutes = coalesce(office_grace_period_minutes, 10),
    weekend_working_enabled = coalesce(weekend_working_enabled, false),
    allow_early_check_in_minutes = greatest(
      least(coalesce(allow_early_check_in_minutes, 0), 180),
      0
    ),
    office_start_time = case
      when office_start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        then office_start_time
      else '09:30'
    end,
    office_end_time = case
      when office_end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        then office_end_time
      else '18:00'
    end;

update public.company_settings
set office_start_time = '09:30',
    office_end_time = '18:00'
where office_end_time::time <= office_start_time::time;

alter table public.company_settings
  alter column office_grace_period_minutes set default 10,
  alter column office_grace_period_minutes set not null,
  alter column weekend_working_enabled set default false,
  alter column weekend_working_enabled set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_settings_office_grace_period_minutes_check'
      and conrelid = 'public.company_settings'::regclass
  ) then
    alter table public.company_settings
      add constraint company_settings_office_grace_period_minutes_check
      check (
        office_grace_period_minutes >= 0
        and office_grace_period_minutes <= 120
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_settings_allow_early_check_in_minutes_max_check'
      and conrelid = 'public.company_settings'::regclass
  ) then
    alter table public.company_settings
      add constraint company_settings_allow_early_check_in_minutes_max_check
      check (allow_early_check_in_minutes <= 180);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_settings_office_hours_order_check'
      and conrelid = 'public.company_settings'::regclass
  ) then
    alter table public.company_settings
      add constraint company_settings_office_hours_order_check
      check (
        office_start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        and office_end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        and office_end_time::time > office_start_time::time
      );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Attendance snapshots.
-- Captures the office start time and grace period used during check-in so
-- future settings changes do not rewrite historical attendance meaning.
-- ---------------------------------------------------------------------------

alter table public.attendance_records
  add column if not exists office_start_time_snapshot text,
  add column if not exists office_grace_period_minutes_snapshot integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'attendance_records_office_start_time_snapshot_check'
      and conrelid = 'public.attendance_records'::regclass
  ) then
    alter table public.attendance_records
      add constraint attendance_records_office_start_time_snapshot_check
      check (
        office_start_time_snapshot is null
        or office_start_time_snapshot ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'attendance_records_office_grace_snapshot_check'
      and conrelid = 'public.attendance_records'::regclass
  ) then
    alter table public.attendance_records
      add constraint attendance_records_office_grace_snapshot_check
      check (
        office_grace_period_minutes_snapshot is null
        or (
          office_grace_period_minutes_snapshot >= 0
          and office_grace_period_minutes_snapshot <= 120
        )
      );
  end if;
end
$$;
