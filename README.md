# Company Hub

Company Hub is a role-aware internal operations portal built with Next.js 15, React 19, TypeScript, Tailwind CSS, and Supabase. It combines employee self-service with administration for people, attendance, leave, resources, announcements, company settings, notifications, and reporting.

## Quick start

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

The application requires a configured Supabase project. See [DEVELOPMENT.md](DEVELOPMENT.md), [DATABASE.md](DATABASE.md), and [AUTH.md](AUTH.md) before first launch.

## Required checks

```powershell
npm run lint
npm run typecheck
npm run build
```

## Documentation

- Current status and risks: [PROJECT_STATE.md](PROJECT_STATE.md), [KNOWN_ISSUES.md](KNOWN_ISSUES.md)
- Product scope: [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md), [BUSINESS_RULES.md](BUSINESS_RULES.md), [FEATURES.md](FEATURES.md), [ROADMAP.md](ROADMAP.md)
- System design: [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE.md](DATABASE.md), [API.md](API.md), [AUTH.md](AUTH.md)
- Engineering workflow: [DEVELOPMENT.md](DEVELOPMENT.md), [TESTING.md](TESTING.md), [CODING_STANDARDS.md](CODING_STANDARDS.md)
- Operations: [DEPLOYMENT.md](DEPLOYMENT.md), [SECURITY.md](SECURITY.md), [TROUBLESHOOTING.md](TROUBLESHOOTING.md), [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
- Governance: [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md), [DECISIONS.md](DECISIONS.md), [CHANGELOG.md](CHANGELOG.md)

## Current backend

The repository is linked to Supabase project `jjfktbgfwvekhlvyjlww`. Migrations `0001` through `0028` define the current production schema and security model. Never commit `.env.local` or service-role credentials.
