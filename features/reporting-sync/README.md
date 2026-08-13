# Reporting Sync

Supabase is authoritative. This feature projects the approved low-risk Holidays dataset into one explicitly configured Google workbook per company; it never participates in operational writes or authorization decisions.

## Contract

- Grain: one `holiday_events.id` per row in the machine-owned `Holidays` tab.
- Columns: `record_id`, calendar name/status, holiday date/title/type/working-day flag/description/status, and source update timestamp.
- Delivery: database triggers enqueue durable outbox work; post-response work attempts a small batch and a secured daily cron provides recovery.
- Idempotency: the immutable event UUID is the row key. Replays overwrite the same row and duplicate rows are cleared.
- Failure: bounded Google retries are followed by outbox backoff. Five failed claims enter a recoverable terminal state and create one Company Admin Update.
- Reconciliation: a controlled daily pass repairs missing, changed, duplicate, and deleted rows.

Migration `0044` owns the database and RPC contracts. Browser roles have no access to reporting destinations or integration outbox internals. The service account owns only the configured workbook and protects the machine header.

## Operations

```powershell
npm run configure:google-sheets
npm run process:google-sheets
npm run verify:google-sheets
```

Configuration requires `GOOGLE_SHEETS_REPORTING_COMPANY_ID` and `GOOGLE_SHEETS_REPORTING_SPREADSHEET_ID`; never choose a company implicitly. The verifier creates and removes only disposable holiday records.
