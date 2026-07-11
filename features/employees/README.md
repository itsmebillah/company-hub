# Employees

## Purpose

Admin employee management, employee records, hierarchy references, status changes, and auth user creation.

## Structure

- `actions/`: employee mutation boundaries.
- `components/`: employee detail and form views.
- `services/`: employee CRUD, validation, auth user linkage.
- `types/`: employee list, detail, form, roles.
- `ui/`: management table/card/drawer UI.

## Flow

Admin creates employee. Service validates role/manager, creates Supabase Auth user, inserts employee, and rolls back on failure.

## Dependencies

Companies, roles, Supabase Auth, activity logs.

## Rules

Employee ID is normalized uppercase and immutable after creation. Deactivation is a soft update.
