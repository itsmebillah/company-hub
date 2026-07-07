create or replace function public.is_active_employee(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.employees
    where auth_user_id = user_id
      and status = 'active'
  );
$$;

create or replace function public.is_admin_user(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.employees
    join public.roles
      on roles.id = employees.role_id
     and roles.company_id = employees.company_id
    where employees.auth_user_id = user_id
      and employees.status = 'active'
      and roles.status = 'active'
      and roles.name = 'Admin'
  );
$$;

create or replace function public.is_self_storage_object(object_name text, user_id uuid)
returns boolean
language sql
stable
as $$
  select coalesce((storage.foldername(object_name))[1], '') = coalesce(user_id::text, '');
$$;

insert into storage.buckets (id, name, public)
values
  ('profile-photos', 'profile-photos', true),
  ('announcement-images', 'announcement-images', true),
  ('company-assets', 'company-assets', true),
  ('resource-icons', 'resource-icons', true),
  ('category-icons', 'category-icons', true),
  ('employee-documents', 'employee-documents', false),
  ('leave-attachments', 'leave-attachments', false),
  ('system-assets', 'system-assets', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

alter table storage.objects enable row level security;

drop policy if exists "Authenticated users can read public asset buckets" on storage.objects;
create policy "Authenticated users can read public asset buckets"
on storage.objects
for select
to authenticated
using (
  bucket_id in (
    'announcement-images',
    'company-assets',
    'resource-icons',
    'category-icons',
    'system-assets'
  )
  and public.is_active_employee(auth.uid())
);

drop policy if exists "Admins can insert public asset buckets" on storage.objects;
create policy "Admins can insert public asset buckets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in (
    'announcement-images',
    'company-assets',
    'resource-icons',
    'category-icons',
    'system-assets'
  )
  and public.is_admin_user(auth.uid())
);

drop policy if exists "Admins can update public asset buckets" on storage.objects;
create policy "Admins can update public asset buckets"
on storage.objects
for update
to authenticated
using (
  bucket_id in (
    'announcement-images',
    'company-assets',
    'resource-icons',
    'category-icons',
    'system-assets'
  )
  and public.is_admin_user(auth.uid())
)
with check (
  bucket_id in (
    'announcement-images',
    'company-assets',
    'resource-icons',
    'category-icons',
    'system-assets'
  )
  and public.is_admin_user(auth.uid())
);

drop policy if exists "Admins can delete public asset buckets" on storage.objects;
create policy "Admins can delete public asset buckets"
on storage.objects
for delete
to authenticated
using (
  bucket_id in (
    'announcement-images',
    'company-assets',
    'resource-icons',
    'category-icons',
    'system-assets'
  )
  and public.is_admin_user(auth.uid())
);

drop policy if exists "Authenticated users can read profile photos" on storage.objects;
create policy "Authenticated users can read profile photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-photos'
  and public.is_active_employee(auth.uid())
);

drop policy if exists "Authenticated users can insert own profile photos" on storage.objects;
create policy "Authenticated users can insert own profile photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and public.is_active_employee(auth.uid())
  and (
    public.is_admin_user(auth.uid())
    or public.is_self_storage_object(name, auth.uid())
  )
);

drop policy if exists "Authenticated users can update own profile photos" on storage.objects;
create policy "Authenticated users can update own profile photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and public.is_active_employee(auth.uid())
  and (
    public.is_admin_user(auth.uid())
    or public.is_self_storage_object(name, auth.uid())
  )
)
with check (
  bucket_id = 'profile-photos'
  and public.is_active_employee(auth.uid())
  and (
    public.is_admin_user(auth.uid())
    or public.is_self_storage_object(name, auth.uid())
  )
);

drop policy if exists "Authenticated users can delete own profile photos" on storage.objects;
create policy "Authenticated users can delete own profile photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-photos'
  and public.is_active_employee(auth.uid())
  and (
    public.is_admin_user(auth.uid())
    or public.is_self_storage_object(name, auth.uid())
  )
);

drop policy if exists "Authenticated users can read employee documents" on storage.objects;
create policy "Authenticated users can read employee documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'employee-documents'
  and public.is_active_employee(auth.uid())
  and (
    public.is_admin_user(auth.uid())
    or public.is_self_storage_object(name, auth.uid())
  )
);

drop policy if exists "Authenticated users can insert employee documents" on storage.objects;
create policy "Authenticated users can insert employee documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'employee-documents'
  and public.is_active_employee(auth.uid())
  and (
    public.is_admin_user(auth.uid())
    or public.is_self_storage_object(name, auth.uid())
  )
);

drop policy if exists "Authenticated users can update employee documents" on storage.objects;
create policy "Authenticated users can update employee documents"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'employee-documents'
  and public.is_active_employee(auth.uid())
  and (
    public.is_admin_user(auth.uid())
    or public.is_self_storage_object(name, auth.uid())
  )
)
with check (
  bucket_id = 'employee-documents'
  and public.is_active_employee(auth.uid())
  and (
    public.is_admin_user(auth.uid())
    or public.is_self_storage_object(name, auth.uid())
  )
);

drop policy if exists "Authenticated users can delete employee documents" on storage.objects;
create policy "Authenticated users can delete employee documents"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'employee-documents'
  and public.is_active_employee(auth.uid())
  and (
    public.is_admin_user(auth.uid())
    or public.is_self_storage_object(name, auth.uid())
  )
);

drop policy if exists "Authenticated users can read leave attachments" on storage.objects;
create policy "Authenticated users can read leave attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'leave-attachments'
  and public.is_active_employee(auth.uid())
  and (
    public.is_admin_user(auth.uid())
    or public.is_self_storage_object(name, auth.uid())
  )
);

drop policy if exists "Authenticated users can insert leave attachments" on storage.objects;
create policy "Authenticated users can insert leave attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'leave-attachments'
  and public.is_active_employee(auth.uid())
  and (
    public.is_admin_user(auth.uid())
    or public.is_self_storage_object(name, auth.uid())
  )
);

drop policy if exists "Authenticated users can update leave attachments" on storage.objects;
create policy "Authenticated users can update leave attachments"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'leave-attachments'
  and public.is_active_employee(auth.uid())
  and (
    public.is_admin_user(auth.uid())
    or public.is_self_storage_object(name, auth.uid())
  )
)
with check (
  bucket_id = 'leave-attachments'
  and public.is_active_employee(auth.uid())
  and (
    public.is_admin_user(auth.uid())
    or public.is_self_storage_object(name, auth.uid())
  )
);

drop policy if exists "Authenticated users can delete leave attachments" on storage.objects;
create policy "Authenticated users can delete leave attachments"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'leave-attachments'
  and public.is_active_employee(auth.uid())
  and (
    public.is_admin_user(auth.uid())
    or public.is_self_storage_object(name, auth.uid())
  )
);
