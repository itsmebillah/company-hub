# Activity

## Purpose

Centralized audit logging for important admin and employee operations.

## Structure

- `repositories/`: writes and reads `activity_logs`.
- `services/`: activity log orchestration and listing.
- `types/`: activity modules, actions, and log shapes.
- `utils/`: non-blocking logging helper.

## Flow

Feature service calls `logActivity` after a successful mutation. The helper catches logging failures so audit writes do not break the primary action.

## Dependencies

Supabase admin client, companies, employees, and `activity_logs`.

## Rules

Use existing `ActivityModule` and `ActivityAction` values. Add new values deliberately when a module becomes durable.
