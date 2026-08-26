# Test Index

## Unit and contract tests

`tests/unit/` contains Node-based service, migration-contract, integration
boundary, and configuration tests that do not require browser automation.

```powershell
npm run test:unit
```

Some integration-oriented cases still require explicitly configured isolated QA
credentials. Tests must never substitute Production identities or data.

## Playwright tests

`tests/e2e/` contains public-route smoke coverage and protected authenticated
flows. Environment validation and mutation opt-in are implemented in
`tests/e2e/helpers/qa-environment.ts`.

```powershell
npm run test:e2e:smoke
npm run test:e2e:public
npm run test:e2e:authenticated
```

Authenticated mutations require `.env.test.local`, the exact isolated QA
project, synthetic employee IDs, and explicit mutation opt-in. See
[`TESTING.md`](../TESTING.md) and [`.env.test.example`](../.env.test.example).

## Flutter tests

The employee Android client owns its Dart/widget/golden and Kotlin tests under
`clients/employee_android/test/` and `clients/employee_android/android/app/src/test/`.
Run Flutter commands from `clients/employee_android/` as documented in its
[README](../clients/employee_android/README.md).

Generated output belongs in ignored coverage, Playwright report, test-result,
Flutter build, and Android build directories and must not be committed.
