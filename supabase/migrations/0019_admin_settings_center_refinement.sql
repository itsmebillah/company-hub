-- Sprint: Admin Dashboard UX & Settings Redesign
-- Adds settings-center fields to company_settings for general, branding,
-- notification, resource, and security preferences.

alter table public.company_settings
  add column if not exists company_banner text,
  add column if not exists language text,
  add column if not exists working_days text[],
  add column if not exists office_start_time text,
  add column if not exists office_end_time text,
  add column if not exists notification_preferences jsonb,
  add column if not exists resource_preferences jsonb,
  add column if not exists security_preferences jsonb;

update public.company_settings
set company_banner = coalesce(company_banner, null),
    language = coalesce(language, 'English'),
    working_days = coalesce(
      working_days,
      array['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    ),
    office_start_time = coalesce(office_start_time, '09:30'),
    office_end_time = coalesce(office_end_time, '18:00'),
    notification_preferences = coalesce(
      notification_preferences,
      jsonb_build_object(
        'announcements', true,
        'attendance', true,
        'leave', true,
        'approvals', true,
        'system', true
      )
    ),
    resource_preferences = coalesce(
      resource_preferences,
      jsonb_build_object(
        'openMode', 'new_tab',
        'sorting', 'featured_first',
        'visibilityDefaults', 'permission_aware'
      )
    ),
    security_preferences = coalesce(
      security_preferences,
      jsonb_build_object(
        'passwordPolicy', 'standard',
        'sessionTimeoutMinutes', 480,
        'forceLogoutEnabled', false
      )
    );

alter table public.company_settings
  alter column language set default 'English',
  alter column language set not null,
  alter column working_days set default array['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  alter column working_days set not null,
  alter column office_start_time set default '09:30',
  alter column office_start_time set not null,
  alter column office_end_time set default '18:00',
  alter column office_end_time set not null,
  alter column notification_preferences set default jsonb_build_object(
    'announcements', true,
    'attendance', true,
    'leave', true,
    'approvals', true,
    'system', true
  ),
  alter column notification_preferences set not null,
  alter column resource_preferences set default jsonb_build_object(
    'openMode', 'new_tab',
    'sorting', 'featured_first',
    'visibilityDefaults', 'permission_aware'
  ),
  alter column resource_preferences set not null,
  alter column security_preferences set default jsonb_build_object(
    'passwordPolicy', 'standard',
    'sessionTimeoutMinutes', 480,
    'forceLogoutEnabled', false
  ),
  alter column security_preferences set not null;
