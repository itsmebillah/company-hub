create type public.holiday_type as enum (
  'public_holiday',
  'company_holiday',
  'optional_holiday'
);

create table public.holiday_calendars (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  is_default boolean not null default false,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint holiday_calendars_company_name_unique unique (company_id, name)
);

create unique index holiday_calendars_default_unique_idx
  on public.holiday_calendars(company_id)
  where is_default is true
    and status = 'active';

create table public.holiday_events (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references public.holiday_calendars(id) on delete cascade,
  title text not null,
  holiday_type public.holiday_type not null,
  date date not null,
  is_working_day boolean not null default false,
  description text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint holiday_events_calendar_date_title_unique unique (
    calendar_id,
    date,
    title
  )
);

create index holiday_calendars_company_id_idx
  on public.holiday_calendars(company_id);

create index holiday_calendars_status_idx
  on public.holiday_calendars(status);

create index holiday_events_calendar_id_idx
  on public.holiday_events(calendar_id);

create index holiday_events_date_idx
  on public.holiday_events(date);

create index holiday_events_status_idx
  on public.holiday_events(status);
