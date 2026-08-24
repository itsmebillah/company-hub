# Company Hub Employee Android

Flutter Android employee client for Company Hub. The permanent Production
application ID is `io.github.itsmebillah.companyhub.employee`; the QA flavor is
installed separately as `io.github.itsmebillah.companyhub.employee.qa`.

## Toolchain and validation

- Flutter 3.47.1 stable
- Dart 3.13.1
- Java 17
- Android SDK resolved by Flutter

Run:

```powershell
flutter analyze
flutter test
flutter build apk --debug --flavor qa --dart-define-from-file=config/qa.json
flutter build apk --release --flavor production --dart-define-from-file=config/production.local.json
```

Production release builds require the approved self-managed signing variables:
`COMPANY_HUB_KEYSTORE_PATH`, `COMPANY_HUB_KEYSTORE_PASSWORD`,
`COMPANY_HUB_KEY_ALIAS`, and `COMPANY_HUB_KEY_PASSWORD`. Their values and the
local Production public-client configuration remain outside Git.

## Environment contracts

Gradle validates the public API and Supabase origins before every flavor build.
Production is fixed to:

- API: `https://company-hub-zeta.vercel.app`
- Supabase project: `jjfktbgfwvekhlvyjlww`

Never add service-role keys, database URLs/passwords, OAuth secrets, refresh
tokens, signing credentials, or private API keys. Local overrides use ignored
`config/*.local.json` files and may contain public client configuration only.

## Employee experience and mobile API boundary

The authenticated app opens on a real employee Home dashboard with today's
authoritative attendance summary, duty-tracking state, bottom navigation, a
preserved Attendance workspace, and a read-only Profile using the verified
mobile session identity. Logout continues to revoke remotely when available and
always clears local credentials.

The current Production mobile API does not expose selfie upload, extended
profile/photo/password, leave, Quick Links/resources, announcements,
notification-center, or holiday-calendar contracts. Those screens must remain
blocked until thin authenticated mobile adapters can reuse the existing backend
services and authorization rules. Flutter must not query privileged tables,
embed Google credentials, invent balances/content, or upload directly to Drive.
Attendance-to-Google-Sheets synchronization is not implemented or implied.

## Authentication and attendance GPS

The client uses the bearer-authenticated `/api/mobile/v1` endpoints documented
in the root `API.md`. Access and refresh credentials are protected by
`flutter_secure_storage`. Requests are HTTPS-only; one `401` may trigger one
refresh and retry.

Check-in and checkout each request a fresh precise Android location fix before
calling the API. The payload uses the existing attendance contract:

```json
{
  "gps": {
    "latitude": 0,
    "longitude": 0,
    "accuracy": 0,
    "timestamp": "ISO-8601",
    "source": "gps"
  }
}
```

The client rejects unusable fixes and enforces the authoritative policy accuracy
threshold (50 metres by default). GPS, geofence, selfie, calendar, work-mode,
authorization, duplicate, and tracking-session validation remain server-side.
The authoritative tracking session starts only after successful check-in and
closes only after successful checkout/reconciliation.

## Permissions and duty-bound tracking

The first-run gate requests only precise location and, on Android 13+, notification
permission, sequentially. Camera and photo-library permissions are not declared
because the current Flutter client does not implement capture or gallery access.
The app never requests background-location permission.

The native foreground service observes locations only while an authoritative
tracking session is active. Accepted points are validated, encrypted with
Android Keystore AES-GCM, batched, assigned session-scoped idempotency keys, and
sent to `POST /api/location/points`. Checkout, authoritative session rejection,
permission loss, and explicit stop end collection. No second background-location
system is used.

## Optional GitHub Release updates

Production checks the official
`itsmebillah/company-hub` latest GitHub Release at startup/resume, at most once
every six hours. QA does not check. A newer `versionCode` shows a non-blocking
reminder with **Update Now** and **Later**; login and attendance are never blocked.

Each Production release must publish exactly:

- `app-production-release.apk`
- `company-hub-android.json`

Metadata format:

```json
{
  "applicationId": "io.github.itsmebillah.companyhub.employee",
  "channel": "production",
  "versionName": "0.1.2",
  "versionCode": 3,
  "apkAssetName": "app-production-release.apk",
  "sha256": "64-lowercase-hex-characters"
}
```

The app accepts only official repository release URLs. Before opening Android's
standard package installer, native code verifies the SHA-256, application ID,
higher exact version code, and signing certificate against the installed app.
It cannot silently install or bypass Android's unknown-app-source confirmation.
Offline, invalid-release, failed-download, and cancelled-install paths leave the
current app fully usable.

## UI regression fixtures

- [QA login](test/goldens/flutter-login-qa.png)
- [QA home](test/goldens/flutter-home-qa.png)
- [QA attendance](test/goldens/flutter-attendance-qa.png)
- [QA first-run permission gate](test/goldens/flutter-tracking-permission-qa.png)
- [QA active tracking](test/goldens/flutter-location-observation-active-qa.png)
