# Android release setup

Use Flutter 3.47.1/Dart 3.13.1 with Microsoft OpenJDK 17 and Android API
36.1. Production uses flavor `production` and application ID
`io.github.itsmebillah.companyhub.employee`.

The long-lived keystore remains outside Git at the path in
`MASTER_INVENTORY.md`; configure signing through environment variables only.
Build APK and AAB with the commands in `PRODUCTION_RELEASE.md` and verify the
certificate before release publication.
