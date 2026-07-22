# Resources

## Purpose

Company Admin resource management for links, reports, tools, PDFs, and internal pages.

## Structure

- `actions/`: create, update, duplicate, archive, restore.
- `constants/`: resource types, open modes, sorting, and supported built-in icons.
- `services/`: resource CRUD, validation, and safe custom-image lifecycle.
- `types/`: resource forms, filters, list items.
- `ui/`: management page, table, form, filters, badges.

## Flow

Company Admin creates resources inside active categories, then permissions determine employee visibility.

## Dependencies

Resource categories, permissions, notifications, activity logs.

## Rules

Archived resources never appear to employees. URL is required unless resource type is `internal`.

Quick Link visuals use `thumbnail` for an uploaded or existing custom image and retain `icon` for the built-in icon name. Company Admin uploads accept PNG, JPG, SVG, and WebP up to 2 MB. Server-side signature/SVG checks run before the file is stored. Object paths—not public URLs—are saved, and unreferenced replaced, canceled, or failed-save uploads are cleaned up.
