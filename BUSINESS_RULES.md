# Business Rules

This document records product rules that are authoritative even when their provider implementation is not visible in the user interface.

## Employee authentication credential

The canonical default credential is:

- Username: Employee ID.
- Password entered by the user: the same original Employee ID, without leading zeroes added by the application.
- Supabase Auth email: the existing `internal_auth_email`; business email is never substituted for it.

Supabase requires passwords of at least six characters. Immediately before an Employee-ID-derived password is sent to Supabase Auth, the server applies this internal transformation:

```text
length(Employee ID) < 6  → left-pad with "0" to length 6
length(Employee ID) ≥ 6  → unchanged
```

Padding is never shown or requested in the login UI. The original Employee ID remains the value employees understand and enter.

## Required implementation coverage

The shared `toSupabaseEmployeePassword` utility is the only implementation of this transformation. It must be used for:

- interactive Employee ID login;
- employee Auth-user creation;
- bulk-import Auth-user creation;
- existing-employee registration;
- reset-to-initial-password operations;
- migrated-user password synchronization.

Do not duplicate the padding expression in feature services. Do not lower the Supabase minimum password requirement, change existing Auth emails, reveal the transformed credential, or store it in application tables or logs.

## Verification baseline

On 2026-07-20, all 17 migrated employee/Auth mappings were synchronized and individually verified. Admin and employee session creation, dashboards, unauthenticated middleware redirect, and non-Admin authorization redirect passed.
