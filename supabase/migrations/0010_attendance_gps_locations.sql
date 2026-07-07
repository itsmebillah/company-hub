create table public.company_locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer not null,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_locations_latitude_check check (
    latitude >= -90
    and latitude <= 90
  ),
  constraint company_locations_longitude_check check (
    longitude >= -180
    and longitude <= 180
  ),
  constraint company_locations_radius_meters_check check (
    radius_meters > 0
  )
);

alter table public.attendance_records
  add column check_in_latitude double precision,
  add column check_in_longitude double precision,
  add column check_in_accuracy_meters double precision,
  add column check_in_location_id uuid references public.company_locations(id) on delete set null,
  add column check_in_distance_meters double precision,
  add column check_out_latitude double precision,
  add column check_out_longitude double precision,
  add column check_out_accuracy_meters double precision,
  add column check_out_location_id uuid references public.company_locations(id) on delete set null,
  add column check_out_distance_meters double precision;

create index company_locations_company_id_idx
  on public.company_locations(company_id);

create index company_locations_status_idx
  on public.company_locations(status);

create index attendance_records_check_in_location_id_idx
  on public.attendance_records(check_in_location_id);

create index attendance_records_check_out_location_id_idx
  on public.attendance_records(check_out_location_id);
