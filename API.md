# API and Server Actions

Company Hub is not a public REST API product. Its primary mutation interface is typed Next.js server actions called by first-party UI. HTTP route handlers exist for downloads, cron, and notification tracking.

## Conventions

- Server actions return discriminated states such as `{ ok, message, ... }` and do not expose raw Supabase errors.
- Actions call domain services and revalidate affected routes.
- Services establish current employee/company/role context before using the admin client.
- Route handlers return JSON errors with appropriate 4xx/5xx status or files with explicit content headers.
- Protected page middleware is not sufficient authorization for a route handler; services must enforce access.

## HTTP routes

| Method/path                                  | Purpose                            | Input                                        | Success          | Authorization                                                                     |
| -------------------------------------------- | ---------------------------------- | -------------------------------------------- | ---------------- | --------------------------------------------------------------------------------- |
| `GET /admin/attendance/reports/details`      | Employee attendance detail         | Report filters plus required `employeeId`    | JSON detail      | Report service checks Company Admin access, report feature, and company           |
| `GET /admin/attendance/reports/export`       | Attendance export                  | Filters plus `format` (`csv`, `xlsx`, `pdf`) | Download         | Report service checks Company Admin access, report feature, and company           |
| `GET /admin/users/export`                    | Employee CSV export                | Search, status, role, manager, mode, sort    | UTF-8 CSV        | Explicit Company Admin and employee-directory checks plus current-company scoping |
| `GET /admin/users/import/template`           | Import template                    | None                                         | CSV download     | Explicit Company Admin and employee-directory checks                              |
| `GET /api/cron/celebrations`                 | Generate scheduled celebrations    | `Authorization: Bearer <CRON_SECRET>`        | JSON run summary | Bearer secret in production                                                       |
| `GET /api/cron/attendance-media`             | Retry Drive delivery/cache cleanup | `Authorization: Bearer <CRON_SECRET>`        | JSON run summary | Bearer secret in production                                                       |
| `GET /api/cron/google-sheets`                | Deliver/reconcile Holidays report  | `Authorization: Bearer <CRON_SECRET>`        | JSON run summary | Bearer secret in production                                                       |
| `GET /api/attendance/selfies/[attachmentId]` | Stream authorized attendance media | Attachment ID                                | Image stream     | Company Admin check plus current-company attachment scope                         |
| `POST /api/notifications/track`              | Mark notification delivered/opened | Notification ID plus delivered/opened event  | `204`            | Authenticated ownership scope; signed-out callers receive `401`                   |

Vercel calls `/api/cron/celebrations` at `0 18 * * *` UTC, `/api/cron/attendance-media` at `0 19 * * *` UTC, and `/api/cron/google-sheets` at `0 20 * * *` UTC. All fail closed on the bearer secret in production.

## Server action inventory

### Platform control

- `createCompanyAction`: System Admin; atomically creates company, default roles, and settings.
- `updateCompanyStatusAction`: System Admin; active/inactive/suspended/archived/deleted lifecycle state, with exact-name confirmation for soft deletion.
- `resetPlatformEmployeePasswordAction`: System Admin; exact Employee-ID confirmation and reset to the canonical initial password.
- `updatePlatformSettingsAction`: System Admin; global branding and operational defaults.
- `updatePlatformFeatureAction`: System Admin; authoritative global enable/disable plus company-override lock.
- `updateCompanyFeatureAction`: System Admin; selected-company `inherit`/`enabled`/`disabled` state.
- `updateOwnCompanyFeatureAction`: Company Admin; current-company state only when platform override is allowed and never bypasses platform disable.
- Release actions: System Admin update of publication, popup, mandatory-update, maintenance, and release metadata; ordinary users may acknowledge only their own published release.

Middleware calls caller-derived `can_access_company_platform`, `can_access_any_feature`, and `record_feature_usage`. These RPCs do not expose platform records. Any-of checks are required for the shared Resources/Quick Links/Knowledge Hub route family.

### Auth

- `loginAction`, `logoutAction`, `bootstrapAction`.

### Employees and hierarchy

- `createEmployeeAction`, `updateEmployeeAction`, `activateEmployeeAction`, `deactivateEmployeeAction`.
- `previewEmployeeImportAction`, `processEmployeeImportBatchAction`, `getEmployeeImportFailedRowsAction`.
- `changeManagerAction`, `bulkReassignAction`.
- Role create/update/activate/deactivate actions.

### Resources and announcements

- Resource category create/update/archive/restore.
- Resource create/update/duplicate/archive/restore.
- Quick Link image upload and cancellation cleanup; authenticated Company Admin with effective Quick Links access, validated PNG/JPG/SVG/WebP up to 2 MB.
- `replaceResourcePermissionsAction`.
- Announcement create/update/archive/restore.

### Attendance, calendar, and leave

- `prepareCheckInAction`, `prepareCheckOutAction`, `checkInAction`, `checkOutAction`.
- `uploadAttendanceSelfieAction`, `updateAttendanceSettingsAction`.
- Company location create/update/archive/set-default.
- Holiday calendar and event create/update/archive/set-default.
- Leave type create/update/archive and request submit/approve/reject/cancel.

### Profile, settings, and notifications

- `updateProfileAction`, `updatePasswordAction`.
- `updateCompanySettingsAction`.
- `markNotificationReadAction`, `markAllNotificationsReadAction`, and summary actions.

## Error behavior

- Validation failures return friendly action messages or HTTP 400.
- Authorization failures return null/redirect in pages. Several privileged actions/handlers still need explicit role enforcement and consistent HTTP 401/403 behavior.
- Unexpected route failures log server details and return a generic HTTP 500 message.
- Cron returns 401 for a missing/incorrect production secret.
- File responses set `Content-Disposition`; attendance exports set `Cache-Control: no-store`.

## Change rules

- Document new HTTP routes and externally meaningful payloads here.
- Validate JSON types and bound string/file sizes server-side.
- Add rate limiting before exposing high-volume or unauthenticated endpoints.
- Never use route location alone as authorization evidence.
- Avoid creating ad hoc API routes when a server action is private to the Next.js UI.
