# Employees

## Purpose

Company Admin employee management, employee records, hierarchy references, status changes, password reset, and Auth user creation within the authenticated company.

## Structure

- `actions/`: employee mutation boundaries.
- `components/`: employee detail and form views.
- `services/`: employee CRUD, validation, auth user linkage.
- `types/`: employee list, detail, form, roles.
- `ui/`: management table/card/drawer UI.

## Flow

Company Admin creates an employee. The service validates company role/manager, derives the provider credential through the shared Employee-ID password utility, creates the Supabase Auth user, inserts the employee, and rolls back on failure. Detail, status, and password-reset operations require the target employee to belong to the same company.

## Dependencies


## Rules

Employee ID is normalized uppercase and immutable after creation. Deactivation is a soft update.
