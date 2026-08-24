# Portable Development Setup

Company Hub supports moving the trusted development environment between
workstations without committing raw secrets. The repository contains source,
safe public configuration, validation rules, and bootstrap automation. One
externally stored SOPS/age bundle carries the allowlisted local development and
isolated-QA values plus the two Google credential documents.

## Configuration inventory

| Configuration                                                       | Classification                                                                     | Portable handling                                                               |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                                               | Safe local configuration                                                           | Encrypted development/test profiles                                             |
| `NEXT_PUBLIC_SUPABASE_URL`                                          | Public environment configuration; environment-specific                             | Encrypted profiles to prevent cross-wiring                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                     | Public client credential; environment-specific                                     | Encrypted profiles; never substituted across environments                       |
| `SUPABASE_SERVICE_ROLE_KEY`                                         | Local secret; server-only; Production-sensitive when local runtime uses Production | Encrypted development/test profiles from the trusted Home-PC configuration      |
| `SUPABASE_PROJECT_REF`                                              | Safe environment identifier                                                        | Encrypted development profile and match validation                              |
| `SUPABASE_DB_URL` and database password                             | Local database secret; Production-sensitive for the authoritative project          | Encrypted development profile; never printed                                    |
| `CRON_SECRET`                                                       | Local/production secret                                                            | Local value in encrypted profile; Production remains service-managed            |
| `GOOGLE_DRIVE_OAUTH_CLIENT_ID`                                      | Server configuration                                                               | Encrypted profile or external OAuth JSON                                        |
| `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`                                  | Local secret; server-only                                                          | Encrypted profile or external OAuth JSON                                        |
| `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`                                  | Local secret; server-only                                                          | Encrypted development profile                                                   |
| `GOOGLE_DRIVE_OAUTH_CLIENT_FILE`                                    | Machine-specific path to local secret                                              | File content encrypted in bundle; path regenerated per workstation              |
| `GOOGLE_DRIVE_PICKER_API_KEY`                                       | Restricted browser key                                                             | Encrypted development profile; never printed or changed                         |
| `GOOGLE_DRIVE_PICKER_APP_ID`                                        | Safe Google project number                                                         | Encrypted development profile for consistency                                   |
| `GOOGLE_DRIVE_SELFIES_FOLDER_ID`                                    | Safe resource identifier; operational configuration                                | Encrypted development profile; folder is never recreated                        |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`                                      | Server configuration                                                               | Encrypted profile or external service-account JSON                              |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`                                | Local secret; server-only                                                          | Encrypted profile or external service-account JSON                              |
| `GOOGLE_SERVICE_ACCOUNT_KEY_FILE`                                   | Machine-specific path to local secret                                              | File content encrypted in bundle; path regenerated per workstation              |
| `GOOGLE_SHEETS_REPORTING_SPREADSHEET_ID`                            | Operational resource identifier                                                    | Encrypted development profile                                                   |
| `GOOGLE_SHEETS_REPORTING_COMPANY_ID`                                | Tenant identifier                                                                  | Encrypted development profile                                                   |
| `PLAYWRIGHT_QA_PROJECT_REF`                                         | QA-only safe identifier                                                            | Encrypted test profile and strict QA match validation                           |
| `PLAYWRIGHT_QA_ADMIN_EMPLOYEE_ID`                                   | QA-only synthetic identifier                                                       | Encrypted test profile                                                          |
| `PLAYWRIGHT_QA_EMPLOYEE_ID`                                         | QA-only synthetic identifier                                                       | Encrypted test profile                                                          |
| `PLAYWRIGHT_ALLOW_QA_MUTATIONS`                                     | QA-only safety control                                                             | Encrypted test profile; never enables Production mutation                       |
| `PLAYWRIGHT_INCLUDE_EDGE`, `EDGE_EXECUTABLE_PATH`                   | Machine-specific optional test configuration                                       | Imported only when configured; path may need workstation adjustment             |
| `MOBILE_API_QA_BASE_URL`                                            | QA-only public configuration                                                       | Encrypted test profile; approved Render QA origin only                          |
| Flutter `APP_FLAVOR`, `API_BASE_URL`, public Supabase configuration | Safe-to-commit public flavor contract                                              | Checked-in JSON with Gradle cross-environment guards; no privileged keys        |
| Vercel Production variables                                         | Production-only, service-managed secrets                                           | Never exported into the portable bundle                                         |
| Render `company-hub-qa` variables                                   | QA-only, service-managed secrets                                                   | Remain in Render; local QA credentials are separately bundled                   |
| GitHub environment secrets                                          | Service-managed CI/release secrets                                                 | Never exported into the portable bundle                                         |
| Supabase CLI login token                                            | Machine-specific authenticated CLI state                                           | Recover with `supabase login`; never copied by this workflow                    |
| Vercel/Render/GitHub OAuth sessions                                 | Machine-specific service sessions                                                  | Recover through each official authenticated CLI/connector                       |
| `JAVA_HOME`, Android SDK, Flutter/Dart, `adb`, `sdkmanager` paths   | Machine-specific tools                                                             | Detected and validated; never copied as secrets                                 |
| Android release keystore, aliases, and passwords                    | Production-only signing secrets                                                    | Not currently configured; import externally after signing ownership is approved |

## Security model

- Encryption uses Mozilla SOPS with an age recipient. Company Hub does not
  implement custom encryption.
- The encrypted bundle, age private identity, decrypted credential files, and
  Android signing material must remain outside the repository.
- The age recipient is public. The age private identity must be transferred
  separately through a trusted channel or secure removable storage.
- Bundle creation uses a permission-restricted operating-system temporary
  directory and removes its plaintext staging file in a `finally` block.
- Import accepts only repository-allowlisted variables. Unknown values are
  discarded.
- Google JSON contents are encrypted in the bundle and materialized under the
  workstation user profile, never inside the checkout.
- Vercel, GitHub, Render, and Android signing stores are not queried or
  exported. Allowlisted values already present in Home-PC local env files are
  encrypted into the bundle; this can include authoritative Supabase
  credentials and makes the bundle and age identity Production-sensitive.

## Home PC: create the encrypted bundle

Install official SOPS and age binaries, create an age identity outside the
repository, and retain its public recipient. Do not place the identity in Git.

```powershell
age-keygen -o E:\CompanyHubSecure\office-pc.agekey
npm run portable:bundle:create -- `
  --output E:\CompanyHubSecure\company-hub.company-hub.sops.json `
  --age-recipient age1...
```

The command reads the existing ignored `.env.local`,
`.env.development.local`, and `.env.test.local`. It also reads the configured
Desktop OAuth and service-account JSON documents, encrypts their contents, and
does not retain the Home-PC paths. It never prints values.

Store the encrypted bundle and age identity separately. The encrypted bundle
is not a substitute for protecting the age private identity.

## Office PC: one bootstrap workflow

After installing the documented toolchain and transferring the encrypted
bundle plus age identity outside the checkout:

```powershell
git clone https://github.com/itsmebillah/company-hub.git
Set-Location company-hub
$env:SOPS_AGE_KEY_FILE = "E:\CompanyHubSecure\office-pc.agekey"
.\bootstrap-company-hub.cmd `
  --bundle E:\CompanyHubSecure\company-hub.company-hub.sops.json
```

The bootstrap installs Node dependencies, decrypts only in memory, writes the
ignored `.env.local` and `.env.test.local`, materializes Google JSON
credentials under `%LOCALAPPDATA%\CompanyHub\credentials`, runs the redacted
doctor and environment isolation validator, and installs Flutter dependencies.
Use `--credentials-dir` to choose another protected directory outside the
repository. Use `--replace` only when intentionally replacing already valid
local values.

The workflow does not log in to Supabase, GitHub, Vercel, Render, or Google and
does not deploy. Authenticate official CLIs separately when their service-level
operations are needed. Existing OAuth refresh credentials are reused; no Google
grant is revoked or repeated automatically.

## Validation and guardrails

```powershell
npm run doctor
npm run validate:environment
```

Validation reports names and PASS/FAIL states only. It verifies ignored local
files, required tools, external credential-file placement, development
Supabase URL/project consistency, the authoritative isolated QA project, the
approved Render QA API origin, and the absence of privileged values from
Flutter QA configuration.

The QA project must be `xbdyvhlhubvuzhdzkadj`. The Production project is
`jjfktbgfwvekhlvyjlww`; QA validation fails if these are cross-wired. These
project references are identifiers, not credentials.

## Android signing

No production signing identity is approved or configured. The bootstrap does
not invent or generate one. When signing ownership is approved, keep the
keystore and `key.properties` outside Git, transfer them through the same
trusted secret-storage process, and configure their local paths explicitly.
The repository ignores `*.jks`, `*.keystore`, and Android `key.properties` as a
defense-in-depth control.
