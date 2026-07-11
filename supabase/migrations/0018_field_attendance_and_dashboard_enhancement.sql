-- Sprint: Field Attendance Tracking & Admin Dashboard Enhancement
-- Adds field attendance metadata, selfie support settings, and the storage
-- bucket required for attendance selfies.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'attendance_location_source'
  ) then
    create type public.attendance_location_source as enum (
      'gps',
      'network',
      'hybrid'
    );
  end if;
end
$$;

alter table public.company_settings
  add column if not exists require_selfie boolean;

update public.company_settings
set require_selfie = coalesce(require_selfie, false);

alter table public.company_settings
  alter column require_selfie set default false,
  alter column require_selfie set not null;

alter table public.attendance_records
  add column if not exists check_in_address text,
  add column if not exists check_in_location_source public.attendance_location_source,
  add column if not exists check_in_selfie_path text,
  add column if not exists check_in_device_browser text,
  add column if not exists check_in_device_platform text,
  add column if not exists check_out_address text,
  add column if not exists check_out_location_source public.attendance_location_source,
  add column if not exists check_out_selfie_path text,
  add column if not exists check_out_device_browser text,
  add column if not exists check_out_device_platform text;

insert into storage.buckets (id, name, public)
values ('attendance-selfies', 'attendance-selfies', false)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;
