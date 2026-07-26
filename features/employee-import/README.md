# Employee Import

## Purpose

Bulk employee import workflow with file parsing, validation, preview, auth creation, and import history.

## Structure

- `actions/`: prepare and execute import actions.
- `components/`: import workflow UI.
- `repositories/`: import job/row persistence and reference data.
- `services/`: parsing, mapping, validation, and execution.
- `types/`: import rows, jobs, summaries, and issues.

## Flow

Admin uploads CSV/XLSX. Parser normalizes rows. Validator checks duplicates and references. Executor creates auth users and employees with rollback.

## Dependencies


## Rules

Keep imports company-isolated. Never leave orphan auth users or employee rows.
