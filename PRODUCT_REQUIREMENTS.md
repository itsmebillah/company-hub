# Product Requirements

## Product statement

Company Hub provides employees and administrators one secure, responsive portal for company information and daily operational workflows. The product is optimized for a role hierarchy common to distributed sales organizations while retaining company-aware data boundaries.

## Personas

- **System Admin:** manages companies, global/company feature availability, cross-company audit data, usage, security events, and platform health through an explicit global allow-list.
- **Admin:** configures the company, users, roles, locations, policies, resources, announcements, calendars, leave, and reporting.
- **Sales Head / RSM / TSO / SR:** signs in with Employee ID and uses employee-facing resources, announcements, attendance, calendar, leave, profile, and notifications.
- **Operator/maintainer:** deploys the application, applies migrations, manages secrets, monitors cron and platform health, and responds to incidents.

## Core outcomes

1. An active employee can authenticate without seeing internal Auth implementation details.
2. An employee sees only company-appropriate and permission-approved information.
3. Attendance records are based on server time and validated against configured work/location policy.
4. Admin mutations are validated, auditable, and company-scoped.
5. Operational communications reach the intended audience and can update in realtime.
6. The application remains usable across supported mobile and desktop sizes.
7. A disabled platform or company feature disappears from discoverable UI and fails closed for direct routes, actions, and APIs.

## Functional requirements

### Identity and access

- Login uses Employee ID and password.
- Internal Auth email and `auth_user_id` never appear in client responses or UI.
- Inactive employees cannot access protected workflows.
- Admins are routed to `/admin/dashboard`; other active roles to `/dashboard`.
- Bootstrap may create the first active Admin only when none exists.
- System Admin is distinct from company Admin and must be explicitly provisioned.
- Company Admins can narrow features only for their own company; platform-level disable always wins.

### People and hierarchy

- Employee ID is required, unique, uppercase-normalized, and immutable.
- Employees belong to one company and one role.
- Managers follow Admin/Sales Head/RSM/TSO/SR hierarchy rules.
- Status changes are soft lifecycle transitions; ordinary flows do not hard-delete employees.
- Bulk imports validate duplicates and references and clean up partial Auth/database records.

### Content and resources

- Resources belong to categories and support `google_sheet`, `apps_script`, `power_bi`, `looker`, `website`, `pdf`, and `internal` types.
- Visibility supports public, role, and employee assignments and is enforced server-side.
- Announcements support scheduling, priorities, and company/role/employee targeting.

### Attendance and leave

- Check-in/out uses server timestamps and validates configured GPS/geofence rules.
- Work mode and applicable office policy are snapshotted on attendance records.
- Optional selfies are stored privately through server-controlled paths.
- Leave requests enforce dates, overlaps, positive duration, and controlled status transitions.
- During approval, an Admin may adjust the requested leave type, dates, and reason; the application revalidates the request and recalculates working days before approval.
- Holiday calendars inform attendance/leave presentation; weekends must not be hardcoded as universal policy.

### Notifications and celebrations

- Notifications are company/employee scoped, track queued/delivered/opened state, and support realtime browser updates.
- Birthday and work-anniversary generation is idempotent per employee/event/year.
- The scheduled celebration endpoint requires `CRON_SECRET` in production.

## Non-functional requirements

- Strict TypeScript; production build must pass.
- Responsive at 320, 375, 768, 1024, and 1440 px reference widths.
- Keyboard-accessible controls, visible focus, reduced-motion support, and readable status feedback.
- No secrets in source control, client bundles, logs, or user-facing errors.
- Database changes are ordered migrations with RLS/security decisions.
- Critical workflows require automated tests and CI before production release.
- Server actions and route handlers return friendly, bounded errors.
- Large lists and exports must avoid unbounded production memory/query usage.

## Out of scope today

- Payroll, leave payroll deductions, or carry-forward accounting.
- External mobile push provider integration.
- Chat, AI assistant, and generalized document management.
- Public self-registration until invitation/eligibility rules are approved.

## Success measures

- Successful login and protected-route session rate.
- Attendance success/failure reason distribution and offline queue recovery.
- Import success rate and rollback completeness.
- Notification delivery/open rate.
- Build/deployment success and migration drift rate.
- Zero cross-company or unauthorized resource disclosures.
