# Roles

## Purpose

Role management for system and custom roles used by employees, hierarchy, and permissions.

## Structure

- `actions/`: role mutations and status changes.
- `components/`: role management UI.
- `services/`: role loading, validation, system role repair.
- `types/`: role list and form contracts.

## Flow

Admin opens roles. Missing system roles are repaired. Active roles populate employee and permission forms.

## Dependencies

Companies, employees, permissions, activity logs.

## Rules

Protected system roles cannot be deleted. Active role order controls dropdown order.
