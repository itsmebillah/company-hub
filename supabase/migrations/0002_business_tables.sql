create type public.resource_type as enum (
  'google_sheet',
  'apps_script',
  'power_bi',
  'looker',
  'website',
  'pdf',
  'internal'
);

create type public.resource_open_mode as enum (
  'same_tab',
  'new_tab',
  'external'
);

create type public.announcement_priority as enum (
  'low',
  'normal',
  'high',
  'urgent'
);

create type public.permission_type as enum (
  'public',
  'role',
  'employee'
);

create table public.resource_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  display_order integer not null,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint resource_categories_id_company_unique unique (id, company_id),
  constraint resource_categories_company_name_unique unique (company_id, name),
  constraint resource_categories_company_display_order_unique unique (company_id, display_order),
  constraint resource_categories_display_order_check check (display_order > 0)
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid not null references public.resource_categories(id) on delete cascade,
  title text not null,
  description text,
  resource_type public.resource_type not null,
  url text,
  icon text,
  thumbnail text,
  open_mode public.resource_open_mode not null default 'new_tab',
  display_order integer not null,
  is_featured boolean not null default false,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint resources_id_company_unique unique (id, company_id),
  constraint resources_category_company_fk foreign key (category_id, company_id)
    references public.resource_categories(id, company_id),
  constraint resources_category_display_order_unique unique (category_id, display_order),
  constraint resources_display_order_check check (display_order > 0)
);

create table public.resource_permissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  permission_type public.permission_type not null,
  role_id uuid references public.roles(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_permissions_resource_company_fk foreign key (resource_id, company_id)
    references public.resources(id, company_id),
  constraint resource_permissions_role_company_fk foreign key (role_id, company_id)
    references public.roles(id, company_id),
  constraint resource_permissions_employee_company_fk foreign key (employee_id, company_id)
    references public.employees(id, company_id),
  constraint resource_permissions_permission_type_check check (
    (
      permission_type = 'public'
      and role_id is null
      and employee_id is null
    )
    or (
      permission_type = 'role'
      and role_id is not null
      and employee_id is null
    )
    or (
      permission_type = 'employee'
      and role_id is null
      and employee_id is not null
    )
  )
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  banner_url text,
  priority public.announcement_priority not null default 'normal',
  publish_from timestamptz,
  publish_until timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status public.record_status not null default 'active',
  constraint announcements_publish_window_check check (
    publish_until is null
    or publish_from is null
    or publish_until >= publish_from
  )
);

create table public.company_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  company_name text not null,
  company_logo text,
  primary_color text,
  secondary_color text,
  support_phone text,
  support_email text,
  website text,
  default_theme text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resource_categories_company_id_idx on public.resource_categories(company_id);
create index resource_categories_display_order_idx on public.resource_categories(display_order);
create index resource_categories_status_idx on public.resource_categories(status);

create index resources_company_id_idx on public.resources(company_id);
create index resources_category_id_idx on public.resources(category_id);
create index resources_display_order_idx on public.resources(display_order);
create index resources_status_idx on public.resources(status);

create index resource_permissions_company_id_idx on public.resource_permissions(company_id);
create index resource_permissions_resource_id_idx on public.resource_permissions(resource_id);
create index resource_permissions_role_id_idx on public.resource_permissions(role_id);
create index resource_permissions_employee_id_idx on public.resource_permissions(employee_id);
create index resource_permissions_permission_type_idx on public.resource_permissions(permission_type);
create index resource_permissions_status_idx on public.resource_permissions(status);

create unique index resource_permissions_public_unique_idx
  on public.resource_permissions(resource_id)
  where permission_type = 'public';

create unique index resource_permissions_role_unique_idx
  on public.resource_permissions(resource_id, role_id)
  where permission_type = 'role';

create unique index resource_permissions_employee_unique_idx
  on public.resource_permissions(resource_id, employee_id)
  where permission_type = 'employee';

create index announcements_company_id_idx on public.announcements(company_id);
create index announcements_status_idx on public.announcements(status);
create index announcements_priority_idx on public.announcements(priority);
create index announcements_publish_from_idx on public.announcements(publish_from);
create index announcements_publish_until_idx on public.announcements(publish_until);

create index company_settings_status_idx on public.company_settings(status);
