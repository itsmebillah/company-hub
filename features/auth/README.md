# Auth

## Purpose

Employee ID login, session context, bootstrap setup, logout, and current employee context.

## Structure

- `actions/`: login/logout/bootstrap actions.
- `components/`: auth and bootstrap forms.
- `services/`: auth resolution, session, bootstrap, current employee context.
- `types/`: auth identity and action contracts.

## Flow

Employee ID resolves to internal auth email server-side. Supabase Auth creates session. Role controls redirect.

## Dependencies

Supabase Auth, employees, roles, companies, company settings.

## Rules

Never expose internal auth email, service-role keys, or `auth_user_id` to users.
