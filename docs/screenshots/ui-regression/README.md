# Mobile UI regression evidence

Captured on 2026-07-26 with the production build in real Chrome using an Android mobile user agent, touch input, and the repository's migrated QA identities. The temporary System Admin grant was removed in test cleanup.

## 320px portrait

| Role          | Before                                          | After                                         |
| ------------- | ----------------------------------------------- | --------------------------------------------- |
| Company Admin | [Before](before/company-admin-320-portrait.png) | [After](after/company-admin-320-portrait.png) |
| Employee      | [Before](before/employee-320-portrait.png)      | [After](after/employee-320-portrait.png)      |
| System Admin  | [Before](before/system-admin-320-portrait.png)  | [After](after/system-admin-320-portrait.png)  |

## 375px landscape

| Role          | Before                                           | After                                          |
| ------------- | ------------------------------------------------ | ---------------------------------------------- |
| Company Admin | [Before](before/company-admin-375-landscape.png) | [After](after/company-admin-375-landscape.png) |

The complete automated matrix also covered portrait widths 360, 375, 390, and 414px plus the existing 768 and 1024px responsive checks. Redundant captures were removed after inspection; the representative evidence above covers each fixed regression in both navigation and header layouts.
