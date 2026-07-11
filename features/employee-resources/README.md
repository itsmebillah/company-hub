# Employee Resources

## Purpose

Employee-facing portal for allowed resources and live announcements.

## Structure

- `components/`: employee portal, ticker, quick resource grid, cards.
- `services/`: server-side portal data and permission filtering.
- `types/`: portal profile, category, and resource shapes.

## Flow

Service resolves current employee, loads active categories/resources, filters by active permissions, and returns grouped portal data.

## Dependencies

Employees, roles, resources, resource permissions, announcements, company settings.

## Rules

Permission filtering must stay server-side. UI must never reveal unauthorized resources.
