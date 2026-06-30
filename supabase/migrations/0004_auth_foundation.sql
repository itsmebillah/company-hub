alter table public.employees
  add column auth_user_id uuid unique references auth.users(id) on delete set null;

create index employees_auth_user_id_idx on public.employees(auth_user_id);
