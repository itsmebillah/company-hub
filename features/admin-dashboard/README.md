# Admin Dashboard

## Purpose

Read-only executive overview for admins with compact mobile-first business status.

## Structure

- `components/`: dashboard cards, charts, compact grids, recent activity.
- `constants/`: mobile dashboard display configuration.
- `services/`: dashboard summary aggregation.
- `types/`: dashboard data shapes.

## Flow

`/admin/dashboard` calls `DashboardService`, then composes dashboard components. Components do not query data.

## Dependencies

Employees, resources, announcements, attendance, leave, notifications, activity logs, company settings.

## Rules

Keep dashboard business queries in the service. Keep route files small and presentation-only.
