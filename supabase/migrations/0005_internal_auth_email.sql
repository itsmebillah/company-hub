alter table public.employees
  add column internal_auth_email text;

create unique index employees_internal_auth_email_unique_idx
  on public.employees(internal_auth_email);
