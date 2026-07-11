# Notifications

## Purpose

Central notification foundation, dropdown UI, unread state, and notification creation helpers.

## Structure

- `actions/`: mark read and mark all read actions.
- `components/`: notification dropdown.
- `repositories/`: notification persistence.
- `services/`: recipient resolution and summary loading.
- `types/`: notification items and summaries.

## Flow

Features create notifications through `NotificationService`. Header dropdown loads current-user/admin summaries.

## Dependencies

Employees, companies, Supabase, auth context.

## Rules

Employees see their own notifications. Admin summaries are company-scoped.
