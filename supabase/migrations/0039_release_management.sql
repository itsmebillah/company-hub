-- Automatic release history, update receipts, and maintenance control.

alter table public.platform_settings
  add column if not exists maintenance_mode boolean not null default false;

create or replace function public.is_platform_maintenance_mode()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select maintenance_mode
    from public.platform_settings
    where id = true
  ), false);
$$;

revoke execute on function public.is_platform_maintenance_mode()
  from public;
grant execute on function public.is_platform_maintenance_mode()
  to anon, authenticated, service_role;

create table if not exists public.platform_releases (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  title text not null,
  description text not null default '',
  release_type text not null,
  whats_new jsonb not null default '[]'::jsonb,
  bug_fixes jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  breaking_changes jsonb not null default '[]'::jsonb,
  requires_update boolean not null default false,
  show_popup boolean not null default true,
  published_at timestamptz,
  commit_sha text not null,
  deployment_id text not null,
  created_by uuid references public.platform_admins(id) on delete set null,
  status text not null default 'draft',
  release_notes text not null default '',
  rollback_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_releases_version_check
    check (version ~ '^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$'),
  constraint platform_releases_type_check
    check (release_type in ('major', 'minor', 'patch', 'hotfix')),
  constraint platform_releases_status_check
    check (status in ('draft', 'published', 'archived', 'failed')),
  constraint platform_releases_json_arrays_check check (
    jsonb_typeof(whats_new) = 'array'
    and jsonb_typeof(bug_fixes) = 'array'
    and jsonb_typeof(improvements) = 'array'
    and jsonb_typeof(breaking_changes) = 'array'
  ),
  constraint platform_releases_rollback_object_check
    check (jsonb_typeof(rollback_metadata) = 'object')
);

create table if not exists public.release_receipts (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.platform_releases(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  dismissed_at timestamptz,
  installed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint release_receipts_release_user_unique unique (release_id, auth_user_id)
);

create index if not exists platform_releases_published_idx
  on public.platform_releases(status, published_at desc)
  where status = 'published';
create index if not exists release_receipts_user_idx
  on public.release_receipts(auth_user_id, updated_at desc);

alter table public.platform_releases enable row level security;
alter table public.release_receipts enable row level security;

revoke all on table public.platform_releases from anon, authenticated;
grant select on table public.platform_releases to anon, authenticated;
grant all on table public.platform_releases to service_role;

revoke all on table public.release_receipts from anon, authenticated;
grant select, insert, update on table public.release_receipts to authenticated;
grant all on table public.release_receipts to service_role;

drop policy if exists platform_releases_read_published
  on public.platform_releases;
create policy platform_releases_read_published
on public.platform_releases
for select
to anon, authenticated
using (status = 'published' and published_at is not null);

drop policy if exists release_receipts_read_own on public.release_receipts;
create policy release_receipts_read_own
on public.release_receipts
for select
to authenticated
using (auth_user_id = auth.uid());

drop policy if exists release_receipts_insert_own on public.release_receipts;
create policy release_receipts_insert_own
on public.release_receipts
for insert
to authenticated
with check (auth_user_id = auth.uid());

drop policy if exists release_receipts_update_own on public.release_receipts;
create policy release_receipts_update_own
on public.release_receipts
for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

comment on table public.platform_releases is
  'Canonical release history published only after deployment quality gates pass.';
comment on table public.release_receipts is
  'Per-user optional dismissal and successful update acknowledgements.';

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select '0039'::text;
$$;

revoke execute on function public.get_app_schema_version()
  from public, anon;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;
