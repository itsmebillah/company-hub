# UI/UX Guidelines

The shared light-theme primary token is intentionally dark enough to maintain WCAG AA contrast with `primary-foreground`. Do not lighten the token or introduce branded button colors without rerunning the committed axe checks in Chrome and Edge.

## Product character

Company Hub uses a clean, compact, Microsoft-365-inspired operational aesthetic: clear hierarchy, rounded cards, restrained gradients, soft shadows, and large touch targets. The interface must prioritize scanning and task completion over decorative density.

## Design tokens

Canonical tokens live in `app/globals.css` and are mapped into Tailwind 4 through `@theme inline`.

- Use semantic colors: background, foreground, card, primary, secondary, muted, accent, destructive, success, warning, info, neutral.
- Use `app-*` radius, spacing, shadow, surface, page, card, table, chip, and navigation utilities before adding one-off values.
- Support system/light/dark via `next-themes`; never assume a light background.
- Use Lucide icons and label icon-only controls with accessible names.

## Layout

The four mobile groups must reserve a physical center lane for the Dashboard FAB. Keep the FAB centered at 64px, and do not apply an additional horizontal transform in hover, active, or current-page states. Notification, Theme, and Profile controls remain one right-aligned row from 320px upward; mobile logout belongs in the Me menu so it cannot force the employee header to wrap.

- Mobile-first; reference widths are 320, 375, 768, 1024, and 1440 px.
- Use admin and employee shells/navigation rather than route-specific chrome.
- Keep route pages as composition layers using `app-page`, `app-page-header`, `app-card`, and `app-table-shell` patterns.
- Provide mobile card alternatives for dense tables.
- Respect safe-area insets for floating/mobile navigation.
- Mobile navigation always has four bottom groups—Hub, Updates, Me, and More—with a 64–72px Dashboard FAB above the bar. Do not add a fifth slot or create a role-specific shell.
- Filter destinations before rendering. Disabled features must not produce blank cards, menu gaps, placeholders, settings sections, or dashboard grid cells.
- Quick Links use a 3-column grid at 320–375px, 4 columns from 390px, then expand responsively. Visual priority is uploaded image, non-blocking favicon, built-in icon, then the Company Hub placeholder. Preserve square crop, keyboard focus, and a minimum 44px touch target.
- Company Admin management cards may expose Edit, Change Icon, Upload Image, and Delete through a 550ms long press or keyboard-accessible/context-menu equivalent. Employee cards never expose management actions.
- Avoid horizontal scrolling except deliberate data tables/visualizations.

## Forms and actions

- Every input has a visible label, help/error association, and sensible autocomplete/input mode.
- Required validation occurs server-side; client validation improves feedback only.
- Disable submissions while pending and show a progress label/icon.
- Destructive actions require clear wording and confirmation proportional to impact.
- Success feedback states what changed; errors say what the user can do next.
- Never display raw database/Auth errors or internal IDs.

## Loading, empty, offline, and error states

- Use route loading boundaries and local pending states for async actions.
- Empty states should explain why data is absent and offer the authorized next action.
- Offline attendance must identify queued/failed state and avoid implying server success before sync.
- Error boundaries should preserve navigation/retry options.
- Placeholders visible to users are release debt; remove or clearly label intentionally unavailable capabilities.

## Accessibility

- Preserve logical heading order and landmark regions.
- All interactive controls must work by keyboard with visible focus.
- Use native buttons/links/forms before custom roles.
- Status updates use appropriate `aria-live` without excessive announcements.
- Do not communicate status by color alone.
- Honor `prefers-reduced-motion`; the global stylesheet already reduces animation.
- Verify contrast in light and dark themes and at 200% zoom.
- Pauseable announcement motion is required; the ticker pauses on hover/focus/active.

## Content

- Use concise sentence-case labels and domain language employees understand.
- Keep Admin and employee terminology consistent: Employees, Roles, Resources, Attendance, Leave, Announcements.
- Dates/times should use company timezone/date-format settings where implemented.
- Avoid “system,” “schema,” or provider details in user-facing errors.

## Media

- Store object paths; render through shared media helpers.
- Supply alt text for meaningful images and empty alt for decorative imagery.
- Prefer `next/image` when compatible; current raw `<img>` lint warnings are tracked debt.
- Do not render arbitrary rich HTML without an approved sanitization strategy.

## Review checklist

- Mobile and desktop shells work.
- Keyboard order and focus are correct.
- Loading, empty, success, failure, offline, and permission-denied states exist.
- Light/dark themes and reduced motion work.
- Text does not overflow and touch targets remain usable.
- Authorization-sensitive data is not briefly rendered before filtering.
