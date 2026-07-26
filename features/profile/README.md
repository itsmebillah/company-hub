# Profile

## Purpose

Employee profile display, editable contact fields, profile photo path, preferences shell, and password update.

## Structure

- `actions/`: profile and password updates.
- `components/`: profile form, photo uploader, password section.
- `services/`: current profile loading and validation.
- `types/`: profile and password forms.

## Flow

Profile page loads current employee data. Updates go through server actions and services.

## Dependencies


## Rules

Read-only fields include Employee ID, role, manager, joining date, and status.
