alter table public.company_settings
  add column short_name text,
  add column favicon text,
  add column address text,
  add column timezone text,
  add column date_format text,
  add column currency text;
