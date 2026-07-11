# Hierarchy

## Purpose

Reporting hierarchy management and reassignment.

## Structure

- `actions/`: hierarchy mutations.
- `components/`: tree and management UI.
- `services/`: hierarchy loading, path validation, reassignment.
- `types/`: tree nodes and reassignment inputs.

## Flow

Admin loads active employees, views hierarchy, and changes managers through validated actions.

## Dependencies

Employees, roles, activity logs.

## Rules

Prevent self-manager, circular hierarchy, and invalid role reporting.
