# Google Integration Setup

Attendance Drive delivery and durable Holidays reporting use two independent,
server-only Google identities. Store credentials only in ignored local env files
and Vercel encrypted environment variables; never commit credential JSON.

- Google Drive uses OAuth 2.0 offline access delegated by the operational
  account with `https://www.googleapis.com/auth/drive.file`. Company Hub can
  access files it creates and the existing Selfies folder explicitly selected
  through Google Picker.
- Google Sheets uses a dedicated service account limited to the configured
  reporting workbook. Sheets failures never roll back authoritative Supabase
  calendar writes.

Operational checks:

```powershell
npm run audit:google-drive-authorization
npm run verify:google
npm run process:attendance-media
npm run verify:attendance-media
npm run configure:google-sheets
npm run process:google-sheets
npm run verify:google-sheets
```

The daily attendance-media cron and immediate post-response attempt provide
durable retry and cleanup recovery. Successful Drive verification starts a
72-hour Supabase cache-retention window. Do not manually delete cache objects or
Drive files; use the worker and cleanup audit records.

## One-time Drive OAuth provisioning

1. Enable the Google Drive API and Google Picker API in the Google Cloud
   project.
2. Configure Google Auth Platform Branding, Audience, and Data Access. While the
   app is in Testing, add the operational account as a test user.
3. Add only `https://www.googleapis.com/auth/drive.file`. Do not add the
   restricted full-Drive scope. The helper does not enable incremental scope
   inheritance and rejects a token that contains full Drive access.
4. Create a Desktop OAuth client named `Company Hub Drive Uploader` and store
   its downloaded JSON outside the repository.
5. Create a browser API key restricted to the Google Picker API and authorized
   local use. Record the Google Cloud project number (Picker app ID).
6. In `.env.development.local`, configure the existing Selfies folder ID plus:

   `GOOGLE_DRIVE_OAUTH_CLIENT_FILE=C:\\secure-path\\oauth-client.json`

   `GOOGLE_DRIVE_PICKER_API_KEY=...`

   `GOOGLE_DRIVE_PICKER_APP_ID=...`

7. Run `npm run authorize:google-drive`. Approve `drive.file`, then use Picker
   to select the existing configured Selfies folder. The helper rejects a
   different folder, verifies `isAppAuthorized` and write capabilities, and
   only then stores the refresh token locally. It never creates a replacement
   folder or prints a token.
8. Run `npm run audit:google-drive-authorization`. This read-only audit verifies
   `isAppAuthorized` for the folder and every stored attendance Drive file. A
   failed existing file requires a separately approved recovery plan; do not
   delete or recreate it automatically.
9. Run `npm run verify:google`. It checks the Drive folder, creates and reads a
   synthetic selfie, verifies Sheets through its service account, and removes
   both temporary artifacts.

The Drive verifier does not inspect reporting-spreadsheet Drive metadata.
Google Sheets authorization and verification remain separate.

`drive.file` is a non-sensitive scope. Refresh tokens issued to external test
users can still expire after seven days until the OAuth app is published.

## Production environment

Configure these sensitive server variables in Vercel:

- `GOOGLE_DRIVE_OAUTH_CLIENT_ID`
- `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`
- `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`
- `GOOGLE_DRIVE_SELFIES_FOLDER_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_SHEETS_REPORTING_SPREADSHEET_ID`
- `GOOGLE_SHEETS_REPORTING_COMPANY_ID`

Picker API key and app ID are local authorization-helper inputs and must not be
placed in the production browser bundle.

For the full-Drive-to-`drive.file` cutover, first verify the existing four files
and folder, then revoke the old grant only with explicit approval, repeat the
Picker flow, rerun both verification commands, and only then rotate the Vercel
refresh token and deploy. Revocation invalidates every refresh token for the
client and is intentionally excluded from automated helpers.
