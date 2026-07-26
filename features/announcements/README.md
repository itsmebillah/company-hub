# Announcements

## Purpose

Internal communication system for creating, targeting, scheduling, and displaying announcements.

## Structure

- `actions/`: create, update, archive, restore.
- `components/`: admin form/list, preview, employee page, image rendering.
- `constants/`: priority options and ordering.
- `services/`: announcement lifecycle and audience filtering.
- `types/`: announcement forms and list items.

## Flow

Admins save announcements through actions. Services persist target audience. Employee views call the filtered employee service.

## Dependencies


## Rules

Employee visibility must filter by company, active status, publish window, and target audience server-side.
