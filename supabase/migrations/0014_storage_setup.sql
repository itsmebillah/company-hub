-- Sprint 1.4: Supabase Storage foundation
-- This migration is intentionally idempotent and Supabase Cloud compatible.

-- ---------------------------------------------------------------------------
-- Helper functions for employee and admin-aware storage access checks.
-- ---------------------------------------------------------------------------

create or replace function public.is_active_employee(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
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
set search_path = public, pg_temp
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
set search_path = public, pg_temp
as $$
  select coalesce((storage.foldername(object_name))[1], '') = coalesce(user_id::text, '');
$$;

-- ---------------------------------------------------------------------------
-- Bucket setup.
-- Creates required buckets if they do not exist and keeps public/private
-- visibility aligned with the specification.
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Storage object policies.
-- Policies are created only when missing so the migration remains safely
-- re-runnable without requiring ownership of storage.objects.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Active employees can read public storage buckets'
  ) then
    execute $policy$
      create policy "Active employees can read public storage buckets"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id in (
          'profile-photos',
          'announcement-images',
          'company-assets',
          'resource-icons',
          'category-icons',
          'system-assets'
        )
        and public.is_active_employee(auth.uid())
      )
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can insert shared public storage objects'
  ) then
    execute $policy$
      create policy "Admins can insert shared public storage objects"
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
      )
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can update shared public storage objects'
  ) then
    execute $policy$
      create policy "Admins can update shared public storage objects"
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
      )
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can delete shared public storage objects'
  ) then
    execute $policy$
      create policy "Admins can delete shared public storage objects"
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
      )
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Profile photo owners and admins can insert objects'
  ) then
    execute $policy$
      create policy "Profile photo owners and admins can insert objects"
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
      )
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Profile photo owners and admins can update objects'
  ) then
    execute $policy$
      create policy "Profile photo owners and admins can update objects"
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
      )
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Profile photo owners and admins can delete objects'
  ) then
    execute $policy$
      create policy "Profile photo owners and admins can delete objects"
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
      )
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Private storage owners and admins can read objects'
  ) then
    execute $policy$
      create policy "Private storage owners and admins can read objects"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id in (
          'employee-documents',
          'leave-attachments'
        )
        and public.is_active_employee(auth.uid())
        and (
          public.is_admin_user(auth.uid())
          or public.is_self_storage_object(name, auth.uid())
        )
      )
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Private storage owners and admins can insert objects'
  ) then
    execute $policy$
      create policy "Private storage owners and admins can insert objects"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id in (
          'employee-documents',
          'leave-attachments'
        )
        and public.is_active_employee(auth.uid())
        and (
          public.is_admin_user(auth.uid())
          or public.is_self_storage_object(name, auth.uid())
        )
      )
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Private storage owners and admins can update objects'
  ) then
    execute $policy$
      create policy "Private storage owners and admins can update objects"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id in (
          'employee-documents',
          'leave-attachments'
        )
        and public.is_active_employee(auth.uid())
        and (
          public.is_admin_user(auth.uid())
          or public.is_self_storage_object(name, auth.uid())
        )
      )
      with check (
        bucket_id in (
          'employee-documents',
          'leave-attachments'
        )
        and public.is_active_employee(auth.uid())
        and (
          public.is_admin_user(auth.uid())
          or public.is_self_storage_object(name, auth.uid())
        )
      )
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Private storage owners and admins can delete objects'
  ) then
    execute $policy$
      create policy "Private storage owners and admins can delete objects"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id in (
          'employee-documents',
          'leave-attachments'
        )
        and public.is_active_employee(auth.uid())
        and (
          public.is_admin_user(auth.uid())
          or public.is_self_storage_object(name, auth.uid())
        )
      )
    $policy$;
  end if;
end
$$;
