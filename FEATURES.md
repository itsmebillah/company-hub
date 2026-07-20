# Feature Inventory

Status values: **Implemented** means a routed workflow and supporting service exist; **Foundation** means enabling infrastructure exists but the end-to-end product is limited; **Partial** means visible placeholder or deliberately incomplete behavior remains.

| Area                         | Status      | Primary routes/capabilities                                                                            |
| ---------------------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| Authentication               | Implemented | Employee ID login, logout, session refresh, role redirect, first-admin setup                           |
| Registration                 | Partial     | `/register` exists but is a placeholder; server registration service exists for pre-created employees  |
| Employees                    | Implemented | List/filter/export, create/edit/detail, activation/deactivation, Auth linkage                          |
| Employee import              | Implemented | CSV/XLSX preview, validation, batched processing, failure export, rollback                             |
| Roles                        | Implemented | System-role repair, custom role CRUD/status, ordering                                                  |
| Hierarchy                    | Implemented | Tree view, manager change, bulk reassignment, cycle/role validation                                    |
| Admin dashboard              | Partial     | KPI/summary/celebration views implemented; activity/system-status cards contain placeholders           |
| Company settings             | Implemented | Branding, contact, locale, notification/resource/security preferences                                  |
| Company locations            | Implemented | Location CRUD, default location, employee access foundation                                            |
| Resource categories          | Implemented | CRUD/status/order                                                                                      |
| Resources                    | Implemented | CRUD, duplicate, archive/restore, type/open-mode behavior                                              |
| Resource permissions         | Implemented | Public, role, and employee targeting with server filtering                                             |
| Employee resource portal     | Implemented | Grouped allowed resources, announcement ticker, quick access                                           |
| Announcements                | Implemented | Create/update/archive, publish windows, company/role/employee targeting                                |
| Notifications                | Implemented | Recipient generation, unread summaries, delivery/open tracking, realtime updates                       |
| Browser/native notifications | Foundation  | Permission onboarding, browser notification bridge; no external push provider                          |
| Attendance                   | Implemented | Check-in/out, GPS/geofence validation, work modes, policy snapshots, notes                             |
| Attendance selfies           | Implemented | Server-mediated private-bucket upload and attendance paths                                             |
| Offline attendance           | Foundation  | Local queue, online retry, Background Sync fallback; browser-local only                                |
| Attendance administration    | Implemented | Employee status/detail and attendance settings                                                         |
| Attendance reports           | Implemented | Filters, detail API, CSV/XLSX/PDF export                                                               |
| Leave                        | Implemented | Leave types, requests, approve/reject/cancel, approval-time request adjustment, notifications/activity |
| Holiday calendar             | Implemented | Calendar/event management and employee read-only calendar                                              |
| Profile                      | Implemented | Contact updates, profile photo upload, password update                                                 |
| Activity logs                | Implemented | Non-blocking audit writes and dashboard/list consumption                                               |
| Celebrations                 | Implemented | Birthday/anniversary calculation, notification generation, daily cron, dashboard UI                    |
| PWA                          | Foundation  | Manifest, service worker, install prompt/settings, standalone detection                                |
| Device onboarding            | Implemented | Versioned location/notification/camera permission flow                                                 |
| Theme and responsive UI      | Implemented | System/light/dark theme, admin and employee desktop/mobile navigation                                  |
| Schema diagnostics           | Foundation  | Read-only schema-version service; production migration control remains CLI-based                       |

## Important boundaries

- All business CRUD uses server-only service-role access after application-level authorization.
- Browser Supabase access is limited to Auth, approved storage operations, and notification realtime.
- Payroll, leave accrual/carry-forward, external push delivery, chat, and AI are not implemented.
- `employee-documents` and `leave-attachments` buckets exist, but full document-management UI/lifecycle is not implemented.
