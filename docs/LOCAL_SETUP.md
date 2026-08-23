# Portable Local Setup

Git is the source of truth for Company Hub application code, migrations,
tests, configuration names, automation, and documentation. Secret values are
deliberately excluded. A new workstation therefore needs the repository plus
one separately protected local configuration source.

## Bootstrap a workstation

```powershell
git pull origin main
npm install
npm run setup:local -- --source E:\secure\company-hub.env
```

`setup:local` copies only variables allowlisted by the repository schema into
the ignored `.env.development.local`. Existing non-placeholder values are
preserved. Use `--replace` only when intentionally replacing local
configuration. The command never displays imported values and finishes by
running the same diagnostic as `npm run doctor`.

For an encrypted portable bundle, use an established SOPS/age workflow:

```powershell
npm run setup:local -- --sops E:\secure\company-hub.enc.env
```

The encrypted bundle and the age private key or KMS unlock credential must be
stored outside this repository. Company Hub invokes `sops` for in-memory
decryption and does not implement its own encryption. Do not add the bundle,
master key, or decrypted output to Git.

Running `npm run setup:local` with no source changes nothing and reports the
current configuration.

## Diagnostic results

`npm run doctor` reports only `CONFIGURED`, `MISSING`, or `INVALID` beside each
configuration item. It checks:

- Node.js 24, npm 11, and installed dependencies;
- application and Supabase configuration;
- Supabase project-reference and database-URL consistency inputs;
- Desktop OAuth and service-account credential structure;
- OAuth, Picker, and service-account Google project consistency;
- the existing Selfies folder, Picker settings, and Sheets destination;
- live reuse of the Drive refresh token with `drive.file`, while rejecting a
  token that includes the full Drive scope.

The diagnostic does not print credential values or start authorization. An
invalid live token may also indicate blocked network access; confirm network and
credential configuration before authorizing again.

## Secret ownership

| Location                                   | Content                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| Git                                        | Source, migrations, tests, scripts, safe placeholders, docs, and non-secret defaults |
| Ignored local env / protected local bundle | Development credentials, refresh token, API keys, resource IDs, and local paths      |
| Vercel environment                         | Production application secrets and production resource configuration                 |
| GitHub protected environments              | CI/release-only credentials required by approved workflows                           |

Never copy production credentials into a development bundle merely for
convenience. Credential JSON files must stay outside the repository.

## Google authorization reuse

Google refresh tokens are not normally device-bound. The validated
`drive.file` refresh token, Desktop OAuth client, Picker project information,
and existing Selfies folder ID can be transferred through the protected setup
source. This avoids repeated consent and prevents creation of another folder.

Run `npm run authorize:google-drive` only when `doctor` confirms that the token
is absent or Google rejects it after network/configuration checks. External OAuth
apps in Testing can issue refresh tokens with a seven-day lifetime. If a new
authorization is genuinely required, select the existing Selfies folder and
rerun the committed Drive authorization audit and verifier.

## Recovery

If the workstation configuration is lost, restore the separately protected
bundle, run `setup:local`, and follow only the `NEXT` lines from `doctor`. Do not
recover secrets from Git history, terminal logs, screenshots, or production.

## Flutter Android QA foundation

The isolated employee client requires Flutter 3.47.1, Dart 3.13.1, Java 17,
and the installed Android SDK. Build the QA flavor with:

```powershell
cd clients/employee_android
flutter analyze
flutter test
flutter build apk --debug --flavor qa --dart-define-from-file=config/qa.json
```

The native foundation may be exercised only with the isolated QA API, QA
Supabase project, and synthetic employee. It requests coarse and precise
location together and notification permission, but it does not collect GPS or
send points. Never substitute Production configuration for device QA.
