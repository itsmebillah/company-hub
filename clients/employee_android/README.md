# Company Hub Employee Android

Isolated Flutter Android employee client for Company Hub. It implements the
ADR-016 bearer authentication and server-authoritative attendance adapters with
a minimal login/attendance UI. It does not implement location collection,
foreground services, permissions, an offline location queue, or ingestion.

## Toolchain

- Flutter `3.47.1` stable
- Dart `3.13.1`
- Java 17
- Android SDK resolved by Flutter

The repository does not yet approve minimum or target Android API support.
Generated Flutter defaults are build inputs, not the product support matrix.

## Provisional application identities

The IDs below are local-safe placeholders and are not production-approved:

- QA: `dev.companyhub.provisional.employee.qa`
- Production flavor: `dev.companyhub.provisional.employee.production`

Replace both through a reviewed ADR update after the organization-owned
reverse-domain namespace is approved. Release signing is intentionally absent.

## Environment contracts

Checked-in `config/qa.json` and `config/production.json` contain public,
non-routable placeholders only. Gradle validates them before every flavor build.
The QA and production API/Supabase origins must match their respective flavor,
use HTTPS, and include all required fields.

Never add a service-role key, database URL/password, OAuth secret, refresh token,
signing credential, or private API key. Local overrides must use ignored
`config/*.local.json` files and must contain public client configuration only.

Validation commands:

```powershell
flutter analyze
flutter test
flutter build apk --debug --flavor qa --dart-define-from-file=config/qa.json
flutter build apk --debug --flavor production --dart-define-from-file=config/production.json
```

These are debug validation artifacts only. They are ignored and must not be
published. A production release requires approved identity, signing ownership,
real public environment contracts, and the full release gate.

## Authentication and attendance

The client calls the six `/api/mobile/v1` endpoints documented in the root
`API.md`. Access and refresh credentials are stored through
`flutter_secure_storage` 10.x, whose Android implementation protects encryption
keys with Android Keystore. Requests are HTTPS-only; one `401` may trigger one
refresh and retry, never an unbounded loop.

`GET /attendance/state` is the only attendance reconciliation authority. The
client calls it after startup session recovery, login, refresh, app resume,
check-in, checkout, and ambiguous mutation failures. GPS, geofence, selfie,
calendar, work-mode, authorization, duplicate, and tracking-session rules remain
entirely server-side.

UI regression fixtures:

- [QA login](test/goldens/flutter-login-qa.png)
- [QA attendance](test/goldens/flutter-attendance-qa.png)

The checked-in QA API origin remains deliberately non-routable. Device-level QA
requires an approved reachable HTTPS QA deployment and a local ignored public
configuration matching that approved contract.

## Future native boundary

`lib/src/tracking/tracking_platform.dart` reserves contracts for:

- `startTracking()`
- `stopTracking()`
- `getTrackingState()`
- `retryPending()`

No method channel implementation, Android service, permission, GPS, queue, or
tracking behavior is connected in this milestone.
