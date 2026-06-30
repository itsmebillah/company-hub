insert into public.companies (
  id,
  name,
  status
) values (
  '00000000-0000-4000-8000-000000000001',
  'Company Hub',
  'active'
);

insert into public.roles (
  id,
  company_id,
  name,
  display_order,
  status
) values
  (
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000001',
    'Admin',
    1,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000001',
    'Sales Head',
    2,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    '00000000-0000-4000-8000-000000000001',
    'RSM',
    3,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000104',
    '00000000-0000-4000-8000-000000000001',
    'TSO',
    4,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000105',
    '00000000-0000-4000-8000-000000000001',
    'SR',
    5,
    'active'
  );

insert into public.company_settings (
  company_id,
  company_name,
  company_logo,
  primary_color,
  secondary_color,
  support_phone,
  support_email,
  website,
  default_theme,
  status
) values (
  '00000000-0000-4000-8000-000000000001',
  'Company Hub',
  null,
  '#2563EB',
  '#16A34A',
  null,
  null,
  null,
  'auto',
  'active'
);
