# Company Hub Employee Android

Isolated Flutter Android employee client for Company Hub. It implements the
ADR-016 bearer authentication and server-authoritative attendance adapters with
a minimal login/attendance UI. Its QA-only native foundation implements
permission/disclosure and foreground-service lifecycle handling. It does not
implement location collection, an offline location queue, or ingestion.

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
- [QA tracking permission disclosure](test/goldens/flutter-tracking-permission-qa.png)

The checked-in QA API origin is the isolated Render deployment at
`https://company-hub-qa.onrender.com`. Device-level QA must continue to use the
isolated QA Supabase project and must never reuse Production configuration.

## Native tracking foundation

`lib/src/tracking/tracking_platform.dart` implements the Flutter method-channel
boundary for:

- `startTracking()`
- `stopTracking()`
- `getTrackingState()`
- `retryPending()`

The QA Android implementation requests coarse and precise location together,
requires precise access, gates startup on notification permission, shows a
persistent foreground-service notification, detects permission revocation,
and stops when the authoritative attendance tracking session closes. A
native-only `LocationObservationSource` uses Android `LocationManager`, prefers
the framework fused provider, and falls back to GPS. Provider callbacks are
generation-guarded, pre-start cached fixes are rejected, and provider loss
suspends observation until a fresh server reconciliation permits restart.

Raw coordinates remain within the native observation, encrypted queue, and
HTTPS request boundary. Accepted observations are validated, bound to the
authoritative tracking session, ordered, and assigned session-scoped
idempotency keys. Android Keystore AES-GCM protects a technically bounded queue
of at most 500 points (five maximum-size API batches); reaching capacity
suspends collection and preserves queued data for explicit reconciliation
rather than silently dropping observations.

Delivery uses the existing `POST /api/location/points` contract (100 points and
128 KiB maximum). `429` and `503` honor bounded `Retry-After` retries; `401`
preserves the session queue while Flutter refreshes/reconciles; authoritative
session rejection, checkout, permission loss, and explicit stop invalidate the
affected queue. Flutter receives only pending-count and sync-state health. The
client does not request background location. Production device support remains
undecided.

QA disclosure fixtures also include [active native observation](test/goldens/flutter-location-observation-active-qa.png).
