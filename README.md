# Company Hub

Role-aware company operations software for employee self-service, workforce administration, and platform governance.

![Company Hub social preview](assets/social-preview/company-hub-social-preview.png)

[![Status](https://img.shields.io/badge/status-active-15803d?style=flat-square)](PROJECT_STATE.md)
[![Production version](https://img.shields.io/badge/version-0.2.0-2563eb?style=flat-square)](CHANGELOG.md)
[![Framework](https://img.shields.io/badge/framework-Next.js-111827?style=flat-square)](#technology-stack)
[![Language](https://img.shields.io/badge/language-TypeScript-2563eb?style=flat-square)](#technology-stack)
[![Backend](https://img.shields.io/badge/backend-Supabase-15803d?style=flat-square)](#architecture)

[Live application](https://company-hub-zeta.vercel.app) | [Architecture](ARCHITECTURE.md) | [Product requirements](PRODUCT_REQUIREMENTS.md) | [Milestones](PROJECT_STATUS.md) | [Technical state](PROJECT_STATE.md)

![Company Hub dashboard](assets/screenshots/dashboard-desktop.png)

## Overview

Company Hub brings common internal operations into one application. Employees can manage attendance, leave, announcements, calendars, and shared resources. Company administrators manage people, policies, roles, locations, and company settings. A separately authorized platform control center manages company lifecycle, feature availability, releases, and system health.

The project is designed around explicit tenant boundaries and role-based access. Supabase provides authentication, PostgreSQL data storage, Row Level Security, realtime notifications, and file storage; Next.js provides the application and server-side control plane.

## Implemented Capabilities

- Employee authentication, profile management, and password recovery
- GPS-aware attendance, work-mode policies, working hours, and reporting
- Provider-neutral attendance media with private Supabase Storage active and a
  separately verified Google Drive OAuth foundation awaiting schema-approved
  activation
- Leave types, balances, requests, approvals, and employee self-service
- Employee directory, import/export, hierarchy, roles, and permissions
- Announcements, celebrations, company calendar, and realtime notifications
- Resource library with categories, visibility rules, and file storage
- Company branding, locations, attendance policy, and feature settings
- System-admin company lifecycle, feature control, releases, schema health, and maintenance state
- Responsive layouts, theme support, offline status, and PWA foundations

See [FEATURES.md](FEATURES.md) for the detailed implementation map and [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for current limitations.

## Screenshots

| Desktop                                                        | Tablet                                                       | Mobile                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![Desktop dashboard](assets/screenshots/dashboard-desktop.png) | ![Tablet dashboard](assets/screenshots/dashboard-tablet.png) | ![Mobile dashboard](assets/screenshots/dashboard-mobile.png) |

Additional before-and-after UI regression captures are stored in [`docs/screenshots`](docs/screenshots).

## Architecture

```mermaid
flowchart LR
    Browser[Next.js client] --> App[Next.js App Router]
    App --> Actions[Server actions and services]
    Actions --> Auth[Supabase Auth]
    Actions --> DB[(PostgreSQL + RLS)]
    Actions --> Storage[Supabase Storage]
    DB --> Realtime[Realtime notifications]
    Realtime --> Browser
    Cron[Vercel cron] --> Actions
```

The codebase follows feature-oriented modules. Pages compose feature services, repositories, actions, and UI components; database migrations define the security and business-data contracts. Global platform access is provisioned explicitly and is not inherited from company-admin access.

For design decisions and boundaries, read [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE.md](DATABASE.md), [AUTH.md](AUTH.md), and [DECISIONS.md](DECISIONS.md).

## Technology Stack

| Layer                 | Technology                                   |
| --------------------- | -------------------------------------------- |
| Application           | Next.js 15, React 19, TypeScript             |
| Styling               | Tailwind CSS, Radix UI primitives            |
| Backend               | Supabase Auth, PostgreSQL, Realtime, Storage |
| Validation and import | TypeScript services, SheetJS                 |
| Testing               | ESLint, TypeScript, Playwright, axe-core     |
| Delivery              | Vercel, GitHub Actions, Supabase CLI         |

## Local Development

### Prerequisites

- Node.js 20 or later
- npm
- A Supabase project for local or test use
- Supabase CLI when applying migrations locally

### Setup

```powershell
git clone https://github.com/itsmebillah/company-hub.git
Set-Location company-hub
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Populate `.env.local` using the keys documented in `.env.example`. Use a development Supabase project and never expose the service-role key to browser code.

Open `http://localhost:3000`. First-time environments use the bootstrap setup flow described in [DEVELOPMENT.md](DEVELOPMENT.md).

## Database Setup

Migrations in [`supabase/migrations`](supabase/migrations) define the schema, policies, functions, storage rules, notification foundations, and platform-control capabilities. Apply them in numeric order to a clean development project.

```powershell
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Review [DATABASE.md](DATABASE.md) and [SECURITY.md](SECURITY.md) before connecting the application to any environment containing real employee data.

## Verification

```powershell
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

Lint and TypeScript checks pass on the audited revision. A production build also compiles successfully; static page generation requires the Supabase variables from `.env.example`. End-to-end tests require an isolated configured environment and the test identities documented in [TESTING.md](TESTING.md).

## Project Structure

```text
app/                 Routes, layouts, server endpoints, and route groups
components/          Shared layout and UI components
features/            Domain modules with actions, services, repositories, and UI
lib/                 Auth, Supabase, configuration, navigation, and utilities
supabase/migrations/ Ordered database and security changes
tests/e2e/           Playwright user-flow and accessibility tests
docs/screenshots/    Versioned visual-regression evidence
```

## Deployment

The production path uses Vercel for the Next.js application and Supabase for managed backend services. Releases are gated by code checks, database compatibility, and environment configuration. Follow [DEPLOYMENT.md](DEPLOYMENT.md) and [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md); do not infer deployment state from migration files alone.

## Roadmap

Current priorities and deferred work are maintained in [NEXT_SPRINT.md](NEXT_SPRINT.md), [ROADMAP.md](ROADMAP.md), and [BACKLOG.md](BACKLOG.md). Completed changes are recorded in [CHANGELOG.md](CHANGELOG.md).

## Contributing and Security

Read [CONTRIBUTING.md](CONTRIBUTING.md), [CODING_STANDARDS.md](CODING_STANDARDS.md), and [SECURITY.md](SECURITY.md) before proposing changes. Do not include employee data, production credentials, service-role keys, or production database exports in issues or commits.

## License

No open-source license is currently declared. The source is publicly visible, but reuse rights are not granted until a license is added by the repository owner.

---

**Md. Masum Billah** | Data Analyst, Automation Developer, and Business Intelligence Specialist

[Portfolio](https://itsmebillah.github.io/) | [GitHub](https://github.com/itsmebillah) | [Email](mailto:itsmbillah@gmail.com) | [Live Demo](https://company-hub-zeta.vercel.app) | [Documentation](ARCHITECTURE.md) | [Related: Sales Intelligence Platform](https://github.com/itsmebillah/Sales-Dashboard)
