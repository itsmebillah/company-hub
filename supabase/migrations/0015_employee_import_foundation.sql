-- Sprint 1: Employee Import Foundation
-- Creates the durable import job and row staging tables required for
-- preview, validation, and execution in later sprints.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'employee_import_file_type'
  ) then
    create type public.employee_import_file_type as enum (
      'csv',
      'xlsx'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'employee_import_status'
  ) then
    create type public.employee_import_status as enum (
      'uploaded',
      'preview_ready',
      'validated',
      'processing',
      'completed',
      'failed',
      'cancelled'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'employee_import_row_status'
  ) then
    create type public.employee_import_row_status as enum (
      'pending',
      'valid',
      'invalid',
      'processed',
      'failed'
    );
  end if;
end
$$;

create table if not exists public.employee_import_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid references public.employees(id) on delete set null,
  source_file_name text not null,
  source_file_path text,
  file_type public.employee_import_file_type not null,
  status public.employee_import_status not null default 'uploaded',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  invalid_rows integer not null default 0,
  processed_rows integer not null default 0,
  successful_rows integer not null default 0,
  failed_rows integer not null default 0,
  error_summary jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint employee_import_jobs_total_rows_check check (total_rows >= 0),
  constraint employee_import_jobs_valid_rows_check check (valid_rows >= 0),
  constraint employee_import_jobs_invalid_rows_check check (invalid_rows >= 0),
  constraint employee_import_jobs_processed_rows_check check (processed_rows >= 0),
  constraint employee_import_jobs_successful_rows_check check (successful_rows >= 0),
  constraint employee_import_jobs_failed_rows_check check (failed_rows >= 0)
);

create table if not exists public.employee_import_rows (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.employee_import_jobs(id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null default '{}'::jsonb,
  normalized_data jsonb not null default '{}'::jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  duplicate_keys jsonb not null default '[]'::jsonb,
  status public.employee_import_row_status not null default 'pending',
  employee_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_import_rows_row_number_check check (row_number > 0),
  constraint employee_import_rows_job_row_unique unique (import_job_id, row_number)
);

create index if not exists employee_import_jobs_company_id_idx
  on public.employee_import_jobs(company_id);

create index if not exists employee_import_jobs_created_by_idx
  on public.employee_import_jobs(created_by);

create index if not exists employee_import_jobs_status_idx
  on public.employee_import_jobs(status);

create index if not exists employee_import_jobs_created_at_idx
  on public.employee_import_jobs(created_at desc);

create index if not exists employee_import_rows_import_job_id_idx
  on public.employee_import_rows(import_job_id);

create index if not exists employee_import_rows_status_idx
  on public.employee_import_rows(status);

create index if not exists employee_import_rows_employee_id_idx
  on public.employee_import_rows(employee_id);

create index if not exists employee_import_rows_row_number_idx
  on public.employee_import_rows(import_job_id, row_number);
