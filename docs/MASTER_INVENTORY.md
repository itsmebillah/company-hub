# Company Hub master inventory

## Safe project files

- Git-tracked source, migrations, tests, scripts, and documentation.
- Toolchain requirements documented in `PRODUCTION_RELEASE.md` and
  `NEW_PC_SETUP.md`.

## External signing material

- Keystore: `C:\Secure\CompanyHub\company-hub-production-release-v2.jks`
- Backup: `C:\Secure\CompanyHub\backup\company-hub-production-release-v2.jks`
- Alias: `companyhub-production`
- Certificate SHA-256: `22:20:0C:E2:D2:93:06:71:EB:EC:1B:59:65:D9:4B:51:27:64:94:FF:9A:C4:15:35:11:DE:7A:75:E9:AD:BB:58`

## Secret names and sources

Signing variables come from secure local environment storage. Supabase,
Firebase, Vercel, and Render secrets come from their respective remote or
encrypted local stores. Values are intentionally not recorded here.

Required names include `COMPANY_HUB_KEYSTORE_PATH`,
`COMPANY_HUB_KEYSTORE_PASSWORD`, `COMPANY_HUB_KEY_ALIAS`,
`COMPANY_HUB_KEY_PASSWORD`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, and `CRON_SECRET`.
