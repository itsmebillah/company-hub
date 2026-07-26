# Resource Categories

## Purpose

Admin management of resource category groups used by resources and employee portal grouping.

## Structure

- `actions/`: create, update, archive, restore.
- `components/`: category management UI and form.
- `services/`: category validation and persistence.
- `types/`: category form and list contracts.

## Flow

Admin creates active categories, then resources are assigned to categories.

## Dependencies


## Rules

Display order must be unique per company. Employee portal only shows active categories with allowed resources.
