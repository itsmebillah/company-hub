-- Platform Architecture v2: additive lifecycle and global configuration.

alter type public.platform_company_status add value if not exists 'archived';

create table if not exists public.platform_settings (
  id boolean primary key default true,
  platform_name text not null default 'Company Hub',
  logo_url text,
  favicon_url text,
  primary_color text not null default '#2563EB',
  support_email text,
  default_timezone text not null default 'Asia/Dhaka',
  maintenance_message text,
  allow_company_creation boolean not null default true,
  audit_retention_days integer not null default 365,
  global_configuration jsonb not null default '{}'::jsonb,
  updated_by uuid references public.platform_admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_settings_singleton_check check (id),
  constraint platform_settings_name_check
    check (length(trim(platform_name)) between 2 and 120),
  constraint platform_settings_color_check
    check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint platform_settings_retention_check
    check (audit_retention_days between 30 and 3650),
  constraint platform_settings_configuration_object_check
    check (jsonb_typeof(global_configuration) = 'object')
);

insert into public.platform_settings (id)
values (true)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;
revoke all on table public.platform_settings from anon, authenticated;

comment on table public.platform_settings is
  'Singleton platform branding and global operational configuration. Service-role access requires explicit System Admin authorization.';

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select '0035'::text;
$$;

revoke execute on function public.get_app_schema_version()
  from public, anon;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;
