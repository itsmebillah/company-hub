# Development setup

Clone the repository and check out the intended feature branch. Install the
repository-compatible Flutter, Dart, Java, and Android SDK toolchain, then run
`flutter pub get` in `clients/employee_android`.

Environment files and production configuration are local-only. Restore them
from the approved encrypted workstation secret bundle or authenticated service;
do not copy secrets into Git or chat. QA configuration must reference only QA
services, and production configuration must reference only production services.

For production Android builds, configure the four signing environment variables
documented in [PRODUCTION_RELEASE.md](PRODUCTION_RELEASE.md) and keep the
keystore outside the repository. Preserve the same production key for future
releases and maintain a secure backup.

Run `flutter analyze`, `flutter test`, and the relevant web checks before
building. Never commit `.env` files, local configuration, credentials,
keystores, APKs, AABs, or generated build output.
