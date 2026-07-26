-- Activity Log and Platform Audit were removed from the product. Keep this
-- migration additive so already-applied history remains immutable.

drop function if exists public.log_feature_access_denied(text, text, text);
drop function if exists public.log_company_access_denied(text, text);

drop table if exists public.platform_audit_logs;
drop table if exists public.activity_logs;

alter table public.platform_settings
  drop column if exists audit_retention_days;

drop type if exists public.platform_audit_category;
drop type if exists public.platform_audit_status;
