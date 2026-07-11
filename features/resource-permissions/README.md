# Resource Permissions

## Purpose

Admin assignment of resources to public, role, or individual employee audiences.

## Structure

- `actions/`: replace permission state.
- `components/`: permission management UI.
- `services/`: permission loading, validation, replacement.
- `types/`: permission state and draft contracts.

## Flow

Admin selects a resource and replaces its permission state. Service deletes old rows and inserts the new validated rows.

## Dependencies

Resources, roles, employees, notifications, activity logs.

## Rules

Public permission excludes role/employee rows. Only active permissions are respected by employee portal.
