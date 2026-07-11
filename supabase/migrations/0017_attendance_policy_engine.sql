-- Sprint: Attendance Policy Engine
-- Adds configurable attendance validation settings without changing
-- existing attendance records or requiring manual dashboard setup.

-- ---------------------------------------------------------------------------
-- Attendance policy mode enum.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'attendance_policy_mode'
  ) then
    create type public.attendance_policy_mode as enum (
      'assigned_location_only',
      'company_location',
      'any_company_location',
      'remote',
      'hybrid'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Company attendance settings.
-- Stores policy configuration on company_settings so each company can switch
-- behavior without future code changes.
-- ---------------------------------------------------------------------------

alter table public.company_settings
  add column if not exists attendance_mode public.attendance_policy_mode,
  add column if not exists gps_accuracy_threshold_meters integer,
  add column if not exists allowed_radius_meters integer,
  add column if not exists allow_early_check_in_minutes integer,
  add column if not exists allow_late_check_out boolean,
  add column if not exists require_gps boolean,
  add column if not exists require_high_accuracy boolean,
  add column if not exists enable_geofence boolean,
  add column if not exists face_verification_enabled boolean,
  add column if not exists wifi_validation_enabled boolean,
  add column if not exists bluetooth_beacon_enabled boolean;

update public.company_settings
set attendance_mode = coalesce(attendance_mode, 'company_location'::public.attendance_policy_mode),
    gps_accuracy_threshold_meters = coalesce(gps_accuracy_threshold_meters, 50),
    allowed_radius_meters = coalesce(allowed_radius_meters, 100),
    allow_early_check_in_minutes = coalesce(allow_early_check_in_minutes, 0),
    allow_late_check_out = coalesce(allow_late_check_out, false),
    require_gps = coalesce(require_gps, true),
    require_high_accuracy = coalesce(require_high_accuracy, true),
    enable_geofence = coalesce(enable_geofence, true),
    face_verification_enabled = coalesce(face_verification_enabled, false),
    wifi_validation_enabled = coalesce(wifi_validation_enabled, false),
    bluetooth_beacon_enabled = coalesce(bluetooth_beacon_enabled, false);

alter table public.company_settings
  alter column attendance_mode set default 'company_location'::public.attendance_policy_mode,
  alter column attendance_mode set not null,
  alter column gps_accuracy_threshold_meters set default 50,
  alter column gps_accuracy_threshold_meters set not null,
  alter column allowed_radius_meters set default 100,
  alter column allowed_radius_meters set not null,
  alter column allow_early_check_in_minutes set default 0,
  alter column allow_early_check_in_minutes set not null,
  alter column allow_late_check_out set default false,
  alter column allow_late_check_out set not null,
  alter column require_gps set default true,
  alter column require_gps set not null,
  alter column require_high_accuracy set default true,
  alter column require_high_accuracy set not null,
  alter column enable_geofence set default true,
  alter column enable_geofence set not null,
  alter column face_verification_enabled set default false,
  alter column face_verification_enabled set not null,
  alter column wifi_validation_enabled set default false,
  alter column wifi_validation_enabled set not null,
  alter column bluetooth_beacon_enabled set default false,
  alter column bluetooth_beacon_enabled set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_settings_gps_accuracy_threshold_check'
      and conrelid = 'public.company_settings'::regclass
  ) then
    alter table public.company_settings
      add constraint company_settings_gps_accuracy_threshold_check
      check (gps_accuracy_threshold_meters > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_settings_allowed_radius_check'
      and conrelid = 'public.company_settings'::regclass
  ) then
    alter table public.company_settings
      add constraint company_settings_allowed_radius_check
      check (allowed_radius_meters > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_settings_allow_early_check_in_minutes_check'
      and conrelid = 'public.company_settings'::regclass
  ) then
    alter table public.company_settings
      add constraint company_settings_allow_early_check_in_minutes_check
      check (allow_early_check_in_minutes >= 0);
  end if;
end
$$;
