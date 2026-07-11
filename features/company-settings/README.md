# Company Settings

## Purpose

Single source of truth for company branding, support details, theme defaults, and settings centers.

## Structure

- `actions/`: settings mutations.
- `components/`: settings forms and admin settings center.
- `services/`: settings load/update operations.
- `types/`: settings form contracts.

## Flow

Admin pages load settings service data and submit updates through actions.

## Dependencies

Companies, media helpers, activity logs.

## Rules

Store media object paths, not public URLs. Keep branding reusable across admin and employee portals.
