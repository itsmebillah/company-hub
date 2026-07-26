-- Add the permanent platform -> company -> role feature-control hierarchy.

alter table public.platform_features
  add column if not exists allow_company_override boolean not null default true;

alter table public.company_features
  add column if not exists company_state text not null default 'inherit';

update public.company_features
set company_state = state::text
where company_state = 'inherit';

alter table public.company_features
  drop constraint if exists company_features_company_state_check;
alter table public.company_features
  add constraint company_features_company_state_check
  check (company_state in ('inherit', 'enabled', 'disabled'));

create index if not exists platform_features_state_override_idx
  on public.platform_features(state, allow_company_override, display_order);
create index if not exists company_features_effective_state_idx
  on public.company_features(company_id, feature_key, company_state);

create or replace view public.platform_feature_company_summary
with (security_invoker = true)
as
select
  feature.feature_key,
  count(company_feature.company_id) filter (
    where company_feature.company_state = 'disabled'
  )::bigint as disabled_company_count,
  count(company_feature.company_id) filter (
    where company_feature.company_state = 'enabled'
  )::bigint as enabled_company_count
from public.platform_features feature
left join public.company_features company_feature
  on company_feature.feature_key = feature.feature_key
group by feature.feature_key;

revoke all on table public.platform_feature_company_summary from anon, authenticated;
grant select on table public.platform_feature_company_summary to service_role;

create or replace function public.sync_legacy_company_feature_state()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' and new.company_state = 'inherit' and new.state <> 'enabled' then
    new.company_state := new.state::text;
  elsif tg_op = 'UPDATE'
    and new.state is distinct from old.state
    and new.company_state is not distinct from old.company_state then
    new.company_state := new.state::text;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_legacy_company_feature_state_trigger
  on public.company_features;
create trigger sync_legacy_company_feature_state_trigger
before insert or update of state on public.company_features
for each row execute function public.sync_legacy_company_feature_state();

create or replace function public.is_feature_enabled_for_company(
  target_company_id uuid,
  target_feature_key text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select
      feature.state = 'enabled'
      and company.platform_status = 'active'
      and (
        feature.allow_company_override = false
        or coalesce(company_feature.company_state, 'inherit') <> 'disabled'
      )
    from public.platform_features feature
    join public.companies company on company.id = target_company_id
    left join public.company_features company_feature
      on company_feature.company_id = company.id
     and company_feature.feature_key = feature.feature_key
    where feature.feature_key = target_feature_key
  ), false);
$$;

revoke execute on function public.is_feature_enabled_for_company(uuid, text)
  from public, anon, authenticated;
grant execute on function public.is_feature_enabled_for_company(uuid, text)
  to service_role;

create or replace function public.can_access_any_feature(
  target_feature_keys text[]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.employees employee
    cross join unnest(target_feature_keys) feature_key
    where employee.auth_user_id = auth.uid()
      and employee.status = 'active'
      and public.is_feature_enabled_for_company(employee.company_id, feature_key)
  );
$$;

revoke execute on function public.can_access_any_feature(text[])
  from public, anon;
grant execute on function public.can_access_any_feature(text[])
  to authenticated;

comment on column public.platform_features.allow_company_override is
  'When false, enabled platform state is inherited and cannot be changed by a company.';
comment on column public.company_features.company_state is
  'Company choice: inherit, enabled, or disabled. Platform-disabled state always wins.';
comment on function public.is_feature_enabled_for_company(uuid, text) is
  'Authoritative platform-first hierarchical feature resolver for trusted server code.';
comment on function public.can_access_any_feature(text[]) is
  'Caller-derived route guard for surfaces shared by multiple enabled features.';

create or replace function public.get_app_schema_version()
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select '0038'::text;
$$;

revoke execute on function public.get_app_schema_version()
  from public, anon;
grant execute on function public.get_app_schema_version()
  to authenticated, service_role;
