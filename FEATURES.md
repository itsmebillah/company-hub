# Feature Inventory

Status values: **Implemented** means a routed workflow and supporting service exist; **Foundation** means enabling infrastructure exists but the end-to-end product is limited; **Partial** means visible placeholder or deliberately incomplete behavior remains.

| Area                         | Status      | Primary routes/capabilities                                                                                                                                           |
| ---------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication               | Implemented | Employee ID login, logout, session refresh, role redirect, first-admin setup                                                                                          |
| Registration                 | Partial     | `/register` exists but is a placeholder; server registration service exists for pre-created employees                                                                 |
| Employees                    | Implemented | List/filter/export, create/edit/detail, activation/deactivation, Auth linkage                                                                                         |
| Employee import              | Implemented | CSV/XLSX preview, validation, batched processing, failure export, rollback                                                                                            |
| Roles                        | Implemented | System-role repair, custom role CRUD/status, ordering                                                                                                                 |
| Hierarchy                    | Implemented | Tree view, manager change, bulk reassignment, cycle/role validation                                                                                                   |
| Company Admin dashboard      | Implemented | Company-only KPIs, pending work, celebrations, Quick Links, and feature-filtered actions                                                                              |
| Company administration       | Implemented | Tenant-scoped employees, roles, hierarchy, import/export, password reset, activity, settings, and media                                                               |
| Company settings             | Implemented | Branding, contact, locale, notification/resource/security preferences                                                                                                 |
| Company locations            | Implemented | Location CRUD, default location, employee access foundation                                                                                                           |
| Resource categories          | Implemented | CRUD/status/order                                                                                                                                                     |
| Resources                    | Implemented | CRUD, duplicate, archive/restore, type/open-mode behavior, validated icon-image upload and cleanup                                                                    |
| Resource permissions         | Implemented | Public, role, and employee targeting with server filtering                                                                                                            |
| Employee resource portal     | Implemented | Grouped resources, announcements, and visual Quick Links with custom image/favicon/icon fallback                                                                      |
| Announcements                | Implemented | Create/update/archive, publish windows, company/role/employee targeting                                                                                               |
| Notifications                | Implemented | Recipient generation, unread summaries, delivery/open tracking, realtime updates                                                                                      |
| Browser/native notifications | Foundation  | Permission onboarding, browser notification bridge; no external push provider                                                                                         |
| Attendance                   | Implemented | Check-in/out, GPS/geofence validation, work modes, policy snapshots, notes                                                                                            |
| Attendance selfies           | Implemented | Server-mediated private-bucket upload and attendance paths                                                                                                            |
| Offline attendance           | Foundation  | Local queue, online retry, Background Sync fallback; browser-local only                                                                                               |
| Attendance administration    | Implemented | Employee status/detail and attendance settings                                                                                                                        |
| Attendance reports           | Implemented | Filters, detail API, CSV/XLSX/PDF export                                                                                                                              |
| Leave                        | Implemented | Leave types, requests, approve/reject/cancel, approval-time request adjustment, notifications/activity                                                                |
| Holiday calendar             | Implemented | Calendar/event management and employee read-only calendar                                                                                                             |
| Profile                      | Implemented | Contact updates, profile photo upload, password update                                                                                                                |
| Activity logs                | Implemented | Non-blocking audit writes and dashboard/list consumption                                                                                                              |
| Celebrations                 | Implemented | Birthday/anniversary calculation, notification generation, daily cron, dashboard UI                                                                                   |
| PWA                          | Foundation  | Manifest, service worker, install prompt/settings, standalone detection                                                                                               |
| Device onboarding            | Implemented | Versioned location/notification/camera permission flow                                                                                                                |
| Theme and responsive UI      | Implemented | Stored company branding plus one role-aware four-group floating mobile shell and Dashboard FAB                                                                        |
| Schema diagnostics           | Foundation  | Read-only schema-version service; production migration control remains CLI-based                                                                                      |
| Platform Control Center      | Implemented | `/platform/*` companies, people/Admins, password recovery, global settings/branding, features, usage, audit, security, and health controls for explicit System Admins |
| Company feature controls     | Implemented | Platform-first enabled/disabled state, override locks, tenant inherit/enabled/disabled state, centralized UI/route/API/action enforcement                             |
| Central audit center         | Implemented | Login/logout, security denial, historical activity, full filters, pagination, CSV, and Excel exports                                                                  |
| Release management           | Implemented | Published release history, optional/mandatory update dialog, PWA refresh, System Admin controls, maintenance state, and gated post-deploy automation                  |

## Important boundaries

- All business CRUD uses server-only service-role access after application-level authorization.
- Browser Supabase access is limited to Auth, approved storage operations, and notification realtime.
- Payroll, leave accrual/carry-forward, external push delivery, chat, and AI are not implemented.
- Subscription plans, billing, automated tenant onboarding, and AI management are intentionally outside this control-center scope.
- `employee-documents` and `leave-attachments` buckets exist, but full document-management UI/lifecycle is not implemented.
