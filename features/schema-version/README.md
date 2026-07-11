# Schema Version

## Purpose

Schema and migration visibility utility for checking project/database alignment.

## Structure

- Feature files in this folder should stay small and read-only.

## Flow

Read schema metadata and expose safe diagnostics where used.

## Dependencies

Supabase metadata or project migration state.

## Rules

Do not mutate schema from application runtime.
