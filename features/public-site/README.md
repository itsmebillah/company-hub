# Public site

The public-site feature owns Company Hub's unauthenticated product and legal pages.

## Routes

- `/` — public Company Hub landing page with a login call to action.
- `/privacy` — public Privacy Policy, including Google Drive OAuth and Google Sheets service-account data practices.
- `/terms` — public Terms of Service.

These routes contain no employee, attendance, dashboard, or tenant data. The authenticated application remains under the existing login and protected route architecture; the public landing page links to `/login` but does not perform authentication itself.

When Google integration behavior or retention changes, update the Privacy Policy and the integration documentation together.
