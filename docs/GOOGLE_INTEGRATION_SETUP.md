# Google Integration Setup

Attendance Drive delivery is active. Production requires all Drive OAuth,
Sheets service-account, resource-ID, Supabase server, and `CRON_SECRET`
variables documented in `.env.example`. Store values only in local ignored env
files and Vercel encrypted environment variables; never store credential JSON
inside this repository.

Operational checks:

```powershell
npm run verify:google
npm run process:attendance-media
npm run verify:attendance-media
```

The Vercel Hobby cron calls `/api/cron/attendance-media` once daily. New
attendance also schedules an immediate post-response delivery attempt, while
the daily sweep provides durable retry and cleanup recovery. Successful Drive
verification starts a 72-hour Supabase cache-retention window. Do not manually
delete cache objects or Drive files; use the worker and cleanup audit records.

Company Hub uses two server-only identities:

- Google Drive: OAuth 2.0 offline access delegated by the operational Google
  account, so that account owns uploaded attendance files.
- Google Sheets: the dedicated service account, limited to the reporting
  workbook shared with it.

Neither credential belongs in Git, application logs, client-side code, or
database rows.

## One-time Drive OAuth provisioning

1. In the Google Cloud project that owns the existing service account, enable
   the Google Drive API.
2. Open **Google Auth Platform** and configure Branding, Audience, and Data
   Access. Use the company identity and add the operational Google account as a
   test user while the app is in Testing.
3. Add the Drive scope `https://www.googleapis.com/auth/drive`. This restricted
   scope is required because Company Hub must upload into and manage the existing
   operational Selfies folder without an interactive file picker.
4. Create an OAuth client with application type **Desktop app**, name it
   `Company Hub Drive Uploader`, and download its JSON credential to a secure
   local directory outside this repository.
5. In the ignored `.env.development.local`, set only the path:

   `GOOGLE_DRIVE_OAUTH_CLIENT_FILE=C:\\secure-path\\oauth-client.json`

6. Run `npm run authorize:google-drive`. Open the displayed Google URL, select
   the operational account, review the Drive permission, and approve it. The
   helper validates a random OAuth state value, exchanges the callback code, and
   stores the refresh token in the ignored local env file without printing it.
7. Run `npm run verify:google`. The verifier checks restricted permissions,
   uploads and reads a synthetic selfie, writes its metadata to a temporary
   workbook tab, reads it back, and removes both temporary artifacts.

The initial Company Hub verification completed on 2026-07-31 using the
operational account for Drive and the service account for Sheets. No temporary
verification artifacts remain.

For durable unattended production access, move the OAuth app out of Testing
after completing Google's applicable publishing and restricted-scope review.
Refresh tokens issued to external test users can expire after seven days.

## Production environment

Configure these as sensitive Vercel server environment variables, without
uploading either JSON file:

- `GOOGLE_DRIVE_OAUTH_CLIENT_ID`
- `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`
- `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`
- `GOOGLE_DRIVE_SELFIES_FOLDER_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_SHEETS_REPORTING_SPREADSHEET_ID`

After any credential rotation, redeploy and repeat the self-cleaning verifier.
Revoking the operational account's OAuth grant invalidates the Drive refresh
token and requires repeating the one-time authorization flow.
