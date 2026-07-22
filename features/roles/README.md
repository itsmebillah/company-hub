# Roles

## Purpose

Role management for system and custom roles used by employees, hierarchy, and permissions.

## Structure

- `actions/`: role mutations and status changes.
- `components/`: role management UI.
- `services/`: role loading, validation, system role repair.
- `types/`: role list and form contracts.

## Flow

Company Admin opens roles. Missing tenant system roles are repaired. Active roles populate employee and permission forms. The Company Admin role cannot be renamed or deactivated, and platform role names are reserved.

## Dependencies

Companies, employees, permissions, activity logs.

## Rules

Protected system roles cannot be deleted. Active role order controls dropdown order.
