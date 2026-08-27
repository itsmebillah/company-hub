# New PC setup

1. Clone the repository and check out `feat/live-location-0045`.
2. Install Flutter 3.47.1, Dart 3.13.1, Microsoft OpenJDK 17, Android SDK
   API 36.1, and the repository Gradle wrapper.
3. Run `flutter pub get` in `clients/employee_android`.
4. Obtain the Google Drive CompanyHub vault through the signed-in Drive
   desktop client; do not assume a fixed drive letter.
5. Restore only approved non-secret files from the vault.
6. Restore the production keystore outside Git and configure the four signing
   environment variables documented in `PRODUCTION_RELEASE.md`.
7. Restore environment secrets only from the encrypted bundle into local
   process/environment storage. Never create plaintext secret backups.
8. Add Firebase Android configuration locally if required; keep Admin
   credentials server-side in the deployment environment.
9. Run Flutter and repository validation before any release build.

Never commit environment files, credentials, keystores, signing records, or
generated artifacts.
