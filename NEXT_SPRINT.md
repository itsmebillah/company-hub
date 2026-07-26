# Next Sprint Handover

Checkpoint date: 2026-07-26

This document freezes the current Company Hub implementation at the end of the stabilization sprint. It is a handover for planning only; no item below is authorization to begin implementation.

## Done

- Stabilized the Employee, Company Admin, and System Admin account/logout experience with a visible, touch-friendly Account section where applicable.
- Preserved the single role-aware mobile navigation architecture while correcting Dashboard FAB balance, center-lane spacing, clipped labels, header action alignment, and mobile overflow regressions.
- Removed production-facing placeholders, misleading prepared-state labels, unsupported registration entry, dead dashboard components, temporary test code, and disposable QA data.
- Retained the completed platform control, hierarchical feature control, Quick Links, release-management, Company Admin, authentication, Storage, Realtime, PWA, and tenant-isolation architecture without expanding product scope.
- Replaced raw company-branding images with dimensioned Next.js images and reached zero lint warnings.
- Updated compatible patch dependencies and retained documented exceptions where the package registry offers no safe compatible remediation.
- Verified the production-build Chrome suite across Employee, Company Admin, disposable System Admin, feature denial, private Storage, Realtime, PWA, accessibility, and responsive widths from 320px through 1024px.
- Verified the canonical Vercel deployment, public routes, protected redirects, authenticated Company Admin and Employee sessions, dashboards, authorization boundaries, and logout behavior.
- Verified the linked Supabase project has exact migration parity for `0001` through `0040`, no database-lint errors, and no disposable QA records left by verification.
- Synchronized `PROJECT_STATE.md`, `KNOWN_ISSUES.md`, `BACKLOG.md`, `TESTING.md`, and `CHANGELOG.md` with the stabilized implementation.

## In progress

- Monitor one non-reproduced Vercel runtime event observed immediately after deployment: `POST /login` returned 500 from the `requireCompanyAdmin` authorization guard. Subsequent complete Company Admin and Employee login/logout smoke tests passed, and the following 30-minute production error-log check was empty. Capture the Vercel request ID and Server Action identifier if it recurs before changing behavior.
- Full Edge execution remains blocked by the workstation's missing Edge installation and required elevation. The Edge Playwright project remains committed.
- Authenticated browser tests are not yet part of the automatic release gate because production-linked fixtures are intentionally not mutated by CI.
- Repository-wide Prettier normalization remains intentionally separate from behavior work.

## Postponed

- UI polish.
- Mobile UX improvements.
- Branding improvements.
- Navigation improvements.
- Release Center enhancements.
- PDF export for the Platform Audit Center.
- Audit retention policy and archival automation.
- Dependency updates that require a controlled framework or library migration.
- Image optimization warnings and broader remote/user-media optimization beyond the dimensioned images completed in this sprint.
- Remaining technical debt, including isolated unit/service integration coverage, repository formatting, CI browser isolation, historical credential rotation confirmation, and reviewed dependency/security-advisor exceptions.

## Next recommended order

1. Reproduce or close the isolated production Server Action authorization event using request IDs and deployment source maps; make no code change unless evidence identifies a deterministic cause.
2. Establish an isolated QA data environment for authenticated Chrome/Edge CI, then add those browser checks to the release gate.
3. Complete the security maintenance decision set: historical credential rotation confirmation, leaked-password-protection policy, and the documented authenticated helper review.
4. Plan compatible replacements or upgrades for `xlsx` and the remaining Next.js/PostCSS/Sharp advisory chain; do not force an incompatible audit fix.
5. Establish the repository-wide formatting baseline in a dedicated mechanical change.
6. Define and implement audit retention, followed by Platform Audit PDF export.
7. Continue Release Center work only after the quality and security gates above are complete.
8. Perform measured UI, mobile UX, branding, and navigation polish last, preserving the frozen architecture and existing business rules.
