# Auth

## Purpose

Employee ID login, session context, bootstrap setup, logout, and current employee context.

## Structure

- `actions/`: login/logout/bootstrap actions.
- `components/`: auth and bootstrap forms.
- `services/`: auth resolution, session, bootstrap, current employee context.
- `types/`: auth identity and action contracts.

## Flow

Employee ID resolves to internal auth email server-side. The user enters the original Employee ID as the default password; IDs shorter than six characters are internally left-padded through the shared Auth utility before Supabase receives them. Supabase Auth creates the session and role controls redirect.

## Dependencies

Supabase Auth, employees, roles, companies, company settings.

## Rules

Never expose internal auth email, service-role keys, `auth_user_id`, or the internally transformed password to users.
