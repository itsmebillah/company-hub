# Company Hub Master Specification

## 1. Project Vision

Company Hub is a secure, role-aware internal company portal where employees can access approved resources, announcements, profile tools, and future operational modules from one consistent application.

The application must remain simple, maintainable, and business-focused. Every sprint must extend the platform without breaking the core architecture, authentication model, role hierarchy, or permission rules described in this document.

## 2. Business Goals

- Give employees one trusted place to find company resources.
- Let admins manage employees, resources, announcements, permissions, and company branding.
- Keep sensitive authentication details hidden from end users.
- Support a clean sales hierarchy: Admin, Sales Head, RSM, TSO, SR.
- Build a foundation that can later support attendance, GPS, leave, documents, chat, AI, push notifications, and analytics.
- Keep the MVP production-ready, responsive, secure, and easy to operate.

## 3. System Architecture

Company Hub uses a Next.js App Router architecture with Supabase as the backend platform.

Primary layers:

- `app`: Route groups, pages, layouts, loading states, and error boundaries.
- `components`: Shared UI, layout, admin shell, and common components.
- `features`: Feature-based modules with actions, components, services, types, constants, and utilities.
- `lib`: Cross-cutting infrastructure such as Supabase clients, environment parsing, config, navigation, auth helpers, and utilities.
- `supabase`: Database migrations and seed structure.
- `docs`: Project documentation and architectural references.

Data access must happen through server-side services or server actions. Client components may call server actions but must not directly own privileged database logic.

## 4. Folder Structure

Only these top-level folders are part of the intended project foundation:

```text
app/
components/
features/
hooks/
lib/
services/
types/
utils/
public/
docs/
supabase/
```

Feature modules should follow this shape where needed:

```text
features/<feature>/
  actions/
  components/
  constants/
  services/
  types/
  ui/
  utils/
```

Do not create folders without a clear project purpose.

## 5. Tech Stack

- Framework: Next.js 15 with App Router
- Language: TypeScript
- Styling: Tailwind CSS
- UI foundation: shadcn/ui-compatible primitives
- Icons: Lucide React
- Theme: next-themes
- Backend: Supabase
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- Package manager: npm
- Linting: ESLint
- Formatting: Prettier
- PWA: Ready foundation, no push notifications yet

## 6. Coding Standards

- Use strict TypeScript.
- Prefer feature-based organization.
- Keep server-only logic in services marked with `server-only` where appropriate.
- Use server actions for form submissions and mutations.
- Keep client components focused on interaction and presentation.
- Return friendly user-facing errors from actions.
- Do not expose internal IDs or authentication implementation details unless required by the UI.
- Avoid duplicate queries and duplicate validation logic.
- Keep edits scoped to the active sprint.
- Do not create speculative abstractions.

## 7. Naming Convention

- Folders: kebab-case.
- React components: PascalCase.
- Component files: kebab-case, unless matching an established local convention.
- Services: `<Domain>Service`.
- Validation services: `<Domain>ValidationService`.
- Server actions: `<verb><Domain>Action`.
- Database tables: snake_case plural nouns.
- Database columns: snake_case.
- Enum values: snake_case.
- TypeScript types: PascalCase.
- Constants: UPPER_SNAKE_CASE or descriptive camelCase arrays.

## 8. Database ERD

Core relationships:

```text
companies
  ├─ roles
  ├─ employees
  │   ├─ manager_id -> employees.id
  │   └─ role_id -> roles.id
  ├─ company_settings
  ├─ resource_categories
  │   └─ resources
  │       └─ resource_permissions
  │           ├─ role_id -> roles.id
  │           └─ employee_id -> employees.id
  └─ announcements
```

Hierarchy is represented only by `employees.manager_id`.

## 9. Database Tables

Current core tables:

- `companies`
- `roles`
- `employees`
- `resource_categories`
- `resources`
- `resource_permissions`
- `announcements`
- `company_settings`

Auth support columns:

- `employees.auth_user_id`
- `employees.internal_auth_email`

No business table should be added without a sprint explicitly authorizing it.

## 10. Authentication Flow

Users log in with:

- Employee ID
- Password

Internal flow:

```text
Employee ID
  -> lookup employee
  -> verify employee status
  -> read internal_auth_email server-side
  -> Supabase Auth sign in
  -> create Supabase session
  -> load employee role
  -> redirect by role
```

Rules:

- Never expose `internal_auth_email`.
- Never expose `auth_user_id`.
- Never expose raw Supabase auth errors.
- Inactive employees cannot sign in.
- Admin redirects to `/admin/dashboard`.
- Sales Head, RSM, TSO, and SR redirect to `/dashboard`.

## 11. Bootstrap Flow

Bootstrap exists only to create the first active Admin.

Flow:

```text
Application starts
  -> check for active employee with Admin role
  -> if Admin exists: redirect to Login
  -> if no Admin exists: show Bootstrap Wizard
  -> collect company information and admin information
  -> generate internal_auth_email
  -> create Supabase Auth user
  -> create employee with Admin role
  -> store auth_user_id and internal_auth_email
  -> sign in
  -> redirect to /admin/dashboard
```

Rules:

- Bootstrap must run only once.
- If an active Admin exists, bootstrap must never load.
- Bootstrap must not create unrelated features or seed business data.

## 12. Employee Lifecycle

Employee lifecycle states:

- `active`
- `inactive`
- `archived`

Employee creation:

- Admin creates employee.
- Employee ID is required and unique.
- Phone is required.
- Role is required.
- Manager must match role hierarchy rules.
- System generates `internal_auth_email`.
- System creates Supabase Auth user.
- System stores `auth_user_id`.
- Default password during creation is Employee ID.

Employee update:

- Employee ID must not be edited.
- Role and manager must remain valid.
- Deactivation and archiving are soft updates only.
- Employee records must not be deleted by normal application flows.

## 13. Resource Lifecycle

Resource lifecycle states:

- `active`
- `inactive`
- `archived`

Resource lifecycle:

```text
Create category
  -> create resource
  -> assign permission
  -> employee portal loads allowed active resources
  -> employee opens resource by open_mode
```

Resource rules:

- Resource title is required.
- Category is required.
- Resource type is required.
- URL is required unless type is `internal`.
- Display order must be numeric.
- Display order must be unique inside category.
- Archived resources must never appear to employees.

Supported resource types:

- `google_sheet`
- `apps_script`
- `power_bi`
- `looker`
- `website`
- `pdf`
- `internal`

Supported open modes:

- `same_tab`
- `new_tab`
- `external`

## 14. Announcement Lifecycle

Announcement lifecycle states:

- `active`
- `inactive`
- `archived`

Announcement lifecycle:

```text
Create
  -> schedule publish window
  -> preview
  -> publish
  -> archive or restore
```

Employee visibility rules:

- Announcement status must be `active`.
- Current date must be inside publish period.
- Audience permission must allow the employee.
- Friendly empty states must show when no announcements are available.

Priorities:

- `low`
- `normal`
- `high`
- `urgent`

## 15. Permission System

Resource permissions use `resource_permissions`.

Permission types:

- `public`
- `role`
- `employee`

Rules:

- `public`: `role_id` and `employee_id` must be null.
- `role`: `role_id` is required and `employee_id` must be null.
- `employee`: `employee_id` is required and `role_id` must be null.
- Public resources are visible to all active employees in the company.
- Role resources are visible to active employees with the assigned role.
- Employee resources are visible only to the assigned active employee.
- Only active permissions are respected.
- Permission filtering must happen server-side.
- Client-side filtering is never a security boundary.

## 16. Role Hierarchy

Roles:

```text
Admin
Sales Head
RSM
TSO
SR
```

Reporting rules:

- Admin: no manager.
- Sales Head: no manager.
- RSM: reports to Sales Head only.
- TSO: reports to RSM only.
- SR: reports to TSO only.

Hierarchy rules:

- Prevent self-manager assignment.
- Prevent circular hierarchy.
- Do not create a separate hierarchy table.
- Reporting hierarchy is represented by `employees.manager_id`.

## 17. UI Design Rules

- Use existing layouts and components.
- Keep UI professional, clean, minimal, and Microsoft 365 inspired.
- Use rounded cards, soft shadows, clear spacing, and large touch targets.
- Use Lucide icons where appropriate.
- Use empty states instead of blank screens.
- Use loading states for async views and actions.
- Do not create dashboard widgets or placeholders outside the sprint scope.
- Do not use raw database or auth errors in UI.

## 18. Theme Rules

Supported themes:

- Auto
- Light
- Dark

Rules:

- Use `next-themes`.
- Theme controls must be accessible.
- Theme preference should not break SSR rendering.
- Do not hardcode theme-only colors when design tokens exist.

## 19. Branding Rules

Company branding source of truth:

- `company_settings`

Branding fields:

- Company Name
- Short Name
- Logo
- Favicon
- Primary Color
- Secondary Color
- Theme
- Support Email
- Support Phone
- Website
- Address
- Timezone
- Date Format
- Currency

Rules:

- Store logo and favicon paths only.
- Actual image storage integration can be implemented later.
- Company Settings is the single source of truth for branding.

## 20. Responsive Rules

The application must support:

- 320px
- 375px
- 768px
- 1024px
- 1440px

Rules:

- Mobile-first layouts.
- Tables must have mobile card alternatives where needed.
- Forms must use large touch targets.
- Text must not overflow buttons, cards, headers, or table cells.
- Navigation must work on desktop and mobile.

## 21. Error Handling Rules

- Use friendly messages for users.
- Log technical details only on the server when logging is available.
- Never display raw Supabase errors.
- Use global error UI for unexpected crashes.
- Use form-level validation messages for user-correctable issues.
- Never leave partial records across Supabase Auth and database flows.

## 22. Validation Rules

General validation:

- Required fields must be checked before mutation.
- Enum values must be validated.
- Unique constraints must be validated before insert or update when useful for friendly errors.
- Server-side validation is mandatory.
- Client-side validation is only a UX enhancement.

Important validations:

- Employee ID unique.
- Phone required and format checked.
- Email format checked when present.
- Password minimum 8 characters.
- Password confirmation must match.
- Manager must match hierarchy rules.
- Resource display order must be unique inside category.
- Publish Until must be after Publish From.

## 23. Security Rules

- Never expose `internal_auth_email`.
- Never expose `auth_user_id`.
- Never trust client-side filtering.
- Keep privileged database operations server-side.
- Use Supabase service role only in server-only code.
- Protect private routes.
- Redirect unauthenticated users to Login.
- Redirect authenticated users away from Login where appropriate.
- Inactive employees cannot access protected resources.
- Archived resources must not appear to employees.
- Avoid leaking implementation details through errors.

## 24. Environment Variables

Required public variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Required server-only variables:

```text
SUPABASE_SERVICE_ROLE_KEY
```

Rules:

- Do not hardcode secrets.
- Do not commit `.env.local`.
- Keep `.env.example` updated when required variables change.
- Server-only variables must never be referenced in client components.

## 25. Build & Deployment

Required verification:

```text
npm install
npm run build
```

Recommended before deployment:

```text
npm run lint
npm run build
```

Deployment rules:

- Verify all required environment variables.
- Apply Supabase migrations in order.
- Do not deploy with broken route links.
- Do not deploy with placeholder production flows.

## 26. Git Workflow

- Keep commits scoped to one sprint or fix.
- Do not mix unrelated refactors with feature work.
- Do not revert user changes without explicit instruction.
- Use clear commit messages.
- Review `git diff` before finalizing.
- Do not commit secrets.
- Do not commit generated local artifacts unless required.

## 27. Sprint Workflow

Each sprint must:

- Follow this master specification.
- Stay inside the requested scope.
- Avoid creating unrelated modules.
- Avoid speculative migrations.
- Reuse existing services and components.
- Return the requested output summary.
- Stop after the sprint is complete.

If a sprint conflicts with this document, pause and revise the document only when explicitly requested.

## 28. Testing Workflow

Minimum workflow:

- Run `npm run build`.
- Validate TypeScript.
- Validate route rendering for changed pages.
- Validate server action friendly errors.
- Validate database queries do not expose secrets.

For business flows:

- Test success path.
- Test validation errors.
- Test permission denial.
- Test empty states.
- Test inactive and archived records where relevant.

Do not create test data in production without explicit approval.

## 29. Performance Rules

- Avoid N+1 queries.
- Batch related queries when possible.
- Reuse existing services.
- Keep server components responsible for initial data loading.
- Keep client state local and minimal.
- Avoid unnecessary re-renders.
- Use pagination for large lists.
- Use indexes already provided by migrations.
- Do not over-fetch sensitive or unused columns.

## 30. Future Modules

Future modules must follow the same architecture and security model.

Planned future modules:

- Attendance
- GPS
- Leave
- Documents
- Chat
- AI Assistant
- Push Notifications
- Analytics

Rules:

- Each future module needs its own explicit sprint.
- Do not create future-module tables, UI, services, or routes early.
- Future modules must not break existing employee, resource, permission, or auth flows.

## 31. Project Roadmap

Current foundation:

- Project foundation
- Supabase foundation
- Core database
- Authentication architecture and implementation
- Bootstrap first Admin
- Employee management
- Admin navigation
- Admin dashboard
- Resource management
- Resource permissions
- Employee resource portal
- Company settings
- Announcements
- Profile management

Near-term priorities:

- Stabilize first production workflow.
- Improve automated testing coverage.
- Add storage integration for logos, avatars, and banners.
- Add password reset UI.
- Add audit logging where required.

Future expansion:

- Attendance and GPS
- Leave management
- Documents
- Chat
- AI Assistant
- Push Notifications
- Analytics

## 32. Coding Principles

- Build the smallest complete version that satisfies the sprint.
- Prefer clarity over cleverness.
- Reuse existing patterns.
- Keep business rules in services or validation modules.
- Keep UI components focused and reusable.
- Use strict typing to prevent invalid states.
- Make errors friendly and actionable.
- Do not hide incomplete flows behind polished UI.

## 33. Architecture Principles

- Feature-based modules.
- Server-first data loading.
- Server-side authorization and permission filtering.
- Supabase access through approved clients.
- Business workflows must be complete before being called production-ready.
- Database migrations must be deliberate, ordered, and scoped.
- Auth architecture must remain separate from business modules.
- Company Settings remains the branding source of truth.

## 34. Things That Must Never Change

- Users log in with Employee ID, not email.
- Internal auth email must never be exposed to users.
- `auth_user_id` must never be exposed to users.
- Employee role belongs in `employees.role_id`.
- There is only one business role per employee.
- Do not recreate `employee_roles`.
- Do not create a hierarchy table.
- Hierarchy is represented by `employees.manager_id`.
- Resource visibility must be enforced server-side.
- Archived resources must never appear to employees.
- Inactive employees must not access protected app flows.
- Bootstrap can create only the first Admin and must run only once.
- Company Settings is the single source of truth for branding.
- Do not create database tables, auth changes, or business modules outside an explicit sprint.
