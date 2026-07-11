# Resources

## Purpose

Admin resource management for links, reports, tools, PDFs, and internal pages.

## Structure

- `actions/`: create, update, duplicate, archive, restore.
- `constants/`: resource types, open modes, sorting.
- `services/`: resource CRUD and validation.
- `types/`: resource forms, filters, list items.
- `ui/`: management page, table, form, filters, badges.

## Flow

Admin creates resources inside active categories, then permissions determine employee visibility.

## Dependencies

Resource categories, permissions, notifications, activity logs.

## Rules

Archived resources never appear to employees. URL is required unless resource type is `internal`.
