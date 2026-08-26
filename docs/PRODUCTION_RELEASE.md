# Production release

Production Android releases use the `production` flavor and application ID
`io.github.itsmebillah.companyhub.employee`.

## Versioning

The Flutter version in `pubspec.yaml` supplies the Android version name and
version code (`name+code`). Release tags use the existing `v<version>` form;
never overwrite an existing tag.

## Signing

Use the approved long-lived production keystore stored outside the repository,
under `C:\Secure\CompanyHub\`. Keep a backup under `C:\Secure\CompanyHub\backup\`.
The alias is `companyhub-production`.

Provide these variables only in the local build environment:

```text
COMPANY_HUB_KEYSTORE_PATH
COMPANY_HUB_KEYSTORE_PASSWORD
COMPANY_HUB_KEY_ALIAS
COMPANY_HUB_KEY_PASSWORD
```

Never commit passwords, private keys, keystores, or signing records.

Verify the certificate locally with `keytool -list -v`; record fingerprints
only in an approved secure inventory, not in Git unless explicitly authorized.

## Build and verify

From `clients/employee_android`:

```powershell
flutter pub get
flutter analyze
flutter test
flutter build apk --release --flavor production --dart-define-from-file=config/production.json
flutter build appbundle --release --flavor production --dart-define-from-file=config/production.json
```

Verify the artifacts are signed, use the production application ID, and match
the intended version/version code before release preparation.

## GitHub release

After validation, push the release commit and create a new `v<version>` tag
without overwriting existing tags. Upload clearly named production APK and AAB
assets. Do not include local configuration or credentials.

## Additional PCs

Clone the repository, install the documented Flutter/Android toolchain, and
provide the production configuration and signing variables through secure local
storage. `config/production.json` is intentionally ignored because it may hold
environment-specific public configuration. Never place secrets in source,
documentation, or Git history.
