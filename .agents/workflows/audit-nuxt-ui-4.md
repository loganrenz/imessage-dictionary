---
description:
  Comprehensive Nuxt UI Pro component adoption audit — checks Pro primitives,
  layout consistency, state handling, responsiveness, dark mode, and polish
---

# Nuxt UI Pro Audit

This workflow audits whether the app correctly leverages Nuxt UI Pro's
page-building primitives instead of reinventing layout patterns with raw HTML.
It validates component adoption, visual consistency, state handling, and premium
feel across devices and color modes.

> **Prerequisite:** All Nuxt UI Pro components (Dashboard\*, Page\*, Pricing\*,
> Blog\*, Auth\*, Chat\*, Editor\*) are included in `@nuxt/ui` v4. No separate
> package needed.

> **Related workflows:**
>
> - `/build-landing-page` — Step-by-step Pro landing page builder
> - `/build-dashboard` — Dashboard scaffolding with Pro Dashboard components
> - `/enhance-design-system` — Design system generation using uipro skill
> - `/enhance-ui-ux` — UX enhancement & polish using uipro skill

---

## 1. Pro Component Adoption

Check that the app leverages Nuxt UI Pro's page-building primitives instead of
reinventing layout patterns with raw HTML.

### Landing / Marketing Pages

// turbo
`grep -rnl 'PageHero\|PageSection\|PageFeature\|PageCTA\|PageGrid\|PageColumns' app/pages/ app/components/ 2>/dev/null || echo "No Pro landing components found"`

Expected components for marketing pages:

- `UPageHero` — hero section with title, description, links, and optional slots
- `UPageSection` — responsive content sections with title/description/slot
- `UPageFeature` — feature showcase with icon, title, description
- `UPageCTA` — call-to-action blocks
- `UPageGrid` / `UPageColumns` — responsive grid/column layouts
- `UPageCard` — styled feature cards with title, description, link

If landing pages exist but use custom `<div>` layouts instead of these
components, flag for refactoring.

### Dashboard / Admin Pages

// turbo
`grep -rnl 'DashboardGroup\|DashboardSidebar\|DashboardPanel\|DashboardNavbar\|DashboardToolbar' app/pages/ app/layouts/ app/components/ 2>/dev/null || echo "No Pro dashboard components found"`

Expected components for admin/dashboard pages:

- `UDashboardGroup` — outer layout with sidebar state management and persistence
- `UDashboardSidebar` — collapsible, resizable sidebar with mobile drawer
- `UDashboardPanel` — resizable content panels
- `UDashboardNavbar` — responsive top navbar
- `UDashboardToolbar` — toolbar under the navbar for actions/filters
- `UDashboardSearch` — integrated CommandPalette search

### Layout Components

// turbo
`grep -rnl 'UHeader\|UFooter\|UMain\|UContainer' app/layouts/ app/components/ app/pages/ 2>/dev/null || echo "No Pro layout components found"`

Expected:

- `UHeader` — responsive header with navigation, logo, and actions
- `UFooter` / `UFooterColumns` — footer with organized link columns
- `UMain` — main content area that fills available viewport height
- `UContainer` — constrains content width

### Content Pages

// turbo
`grep -rnl 'ContentNavigation\|ContentSearch\|ContentToc\|ContentSurround' app/ 2>/dev/null || echo "No Pro content components found"`

Applicable if the app uses `@nuxt/content`:

- `UContentNavigation` — accordion-style content navigation
- `UContentSearch` — integrated search via CommandPalette
- `UContentToc` — sticky table of contents with active anchor highlighting
- `UContentSurround` — prev/next navigation links

---

## 2. Layout Consistency

1. **Header/Footer presence:** // turbo
   `ls app/layouts/*.vue 2>/dev/null | head -10`
   - Every layout should have a consistent header and footer. Check that they
     use `UHeader`/`UFooter` (not custom navbars).

2. **UApp wrapper:** // turbo
   `grep -c 'UApp' app/app.vue 2>/dev/null || echo "UApp not found in app.vue"`
   - `app.vue` MUST wrap everything in `<UApp>` for proper toast, modal, and
     color mode support.

3. **Container consistency:**
   - Content should be constrained with `UContainer` or `max-w-*` classes. Check
     for pages where content spans the full viewport width unintentionally.

---

## 3. State Handling

1. **Empty states:** // turbo
   `grep -rnl 'UEmpty' app/pages/ app/components/ 2>/dev/null || echo "No UEmpty components found — check for unhandled empty states"`
   - Lists, tables, and search results must show `UEmpty` when there's no data —
     not a blank page.

2. **Loading states:** // turbo
   `grep -rnl 'USkeleton' app/pages/ app/components/ 2>/dev/null || echo "No USkeleton components found — check for missing loading states"`
   - Data-fetching pages should show `USkeleton` placeholders during loading,
     not spinners or blank space.

3. **Error states:** // turbo
   `grep -rnl 'UAlert\|error\.' app/pages/ app/components/ 2>/dev/null | grep -v 'error.vue' | head -10`
   - Failed API calls should surface user-friendly `UAlert` messages, not raw
     error text.

4. **Toast feedback:** // turbo
   `grep -rn 'useToast\|toast\.' app/ 2>/dev/null | grep -v 'node_modules' | head -10`
   - Mutations (create, update, delete) should confirm success/failure via
     `useToast()`.

---

## 4. Responsive Design

1. **Mobile navigation:**
   - `UHeader` automatically handles mobile hamburger menus. Custom navbars must
     implement responsive behavior.
   - `UDashboardSidebar` automatically converts to a mobile drawer. Verify it
     works with `UDashboardSidebarToggle`.

2. **Table responsiveness:** // turbo
   `grep -rn 'UTable' app/ 2>/dev/null | grep -v 'node_modules' | head -10`
   - Tables should be scrollable or use card layouts on mobile. `UTable` handles
     this automatically.

3. **Touch targets:**
   - Buttons and interactive elements must be at least 44×44px on mobile
     (Tailwind: `min-h-11 min-w-11`).

4. **Input Sizing:** // turbo
   `grep -rn '<UInput\|<UTextarea' app/ 2>/dev/null | grep -v 'w-full' | head -10`
   - Input components like `<UTextarea>` and `<UInput>` do not take 100% of
     their container's width by default. Always apply `class="w-full"` unless
     explicitly designing a narrow inline field.

---

## 5. Dark Mode Audit

1. **Default to light mode:** // turbo
   `grep -rn "preference.*light\|preference.*dark\|colorMode" nuxt.config.ts app/app.config.ts 2>/dev/null | head -5 || echo "No colorMode preference found"`
   - **Institutional standard: light mode by default.** The app should set
     `colorMode: { preference: 'light' }` in `nuxt.config.ts`. Flag if
     defaulting to dark.

2. **Toggle presence:** // turbo
   `grep -rn 'ColorModeButton\|ColorModeSelect\|ColorModeSwitch' app/ 2>/dev/null | head -5 || echo "No color mode toggle found"`
   - Every app should have a color mode toggle accessible to users.

3. **Visual verification:**
   - Switch to dark mode and check that:
     - Backgrounds have depth (not flat `#000`)
     - Text contrast meets WCAG AA (4.5:1)
     - Borders are subtle but visible
     - Colored elements remain vibrant without being harsh
     - Images/logos have appropriate dark mode variants (use `UColorModeImage`
       if needed)

---

## 6. Typography & Spacing

1. **Font loading:** // turbo
   `grep -rn 'font-sans\|font-display' app/assets/css/main.css 2>/dev/null | head -5`
   - Custom fonts should be defined in `@theme` and loaded via `@nuxt/fonts`
     (not manual `@import url()`).

2. **Heading hierarchy:** // turbo
   `grep -rn '<h1' app/pages/ 2>/dev/null | head -10`
   - Each page should have exactly one `<h1>`. Verify no skipped levels (h1→h3
     without h2).

3. **Spacing consistency:**
   - Verify consistent spacing using Tailwind's scale (`p-4`, `gap-6`,
     `space-y-8`). Flag custom pixel values.

---

## 7. Motion & Polish

1. **Page transitions:** // turbo
   `grep -rn 'pageTransition\|layoutTransition' app/ 2>/dev/null | grep -v 'node_modules' | head -5`
   - Route transitions should be smooth. Use `app.pageTransition` in
     `nuxt.config.ts`.

2. **Interactive feedback:**
   - Buttons should have hover/active states (Nuxt UI provides this
     automatically).
   - Cards should lift on hover for clickable items
     (`hover:shadow-lg transition-shadow`).
   - Form inputs should have focus rings (Nuxt UI provides this automatically).

3. **No layout shift:**
   - Verify that images have explicit dimensions, skeleton placeholders match
     final content size, and conditional rendering doesn't cause visible jumps.

---

## 8. Compile Report

Present findings grouped by severity:

| Severity        | Category                                                            | What to check |
| --------------- | ------------------------------------------------------------------- | ------------- |
| 🔴 Critical     | Missing UApp wrapper, no error handling, broken mobile layout       |
| 🟠 High         | Custom layouts where Pro components exist, no empty/loading states  |
| 🟡 Medium       | Missing dark mode toggle, inconsistent spacing, no page transitions |
| 🟢 Nice-to-have | Motion polish, glassmorphism, micro-animations                      |

Present as a table with specific recommendations. Ask the user for approval
before making changes.

---

## Pro Component Quick Reference

| Component           | Purpose                          | Key Props                            |
| ------------------- | -------------------------------- | ------------------------------------ |
| `UPageHero`         | Hero section                     | `title`, `description`, `links`      |
| `UPageSection`      | Content section wrapper          | `title`, `description`, `headline`   |
| `UPageFeature`      | Feature with image               | `title`, `description`, `icon`       |
| `UPageCTA`          | Call to action                   | `title`, `description`, `links`      |
| `UPageCard`         | Feature card                     | `title`, `description`, `icon`, `to` |
| `UPageGrid`         | Responsive grid                  | Default slot                         |
| `UPageColumns`      | Column layout                    | `columns` (number)                   |
| `UPricingPlans`     | Pricing grid                     | Default slot for `UPricingPlan`      |
| `UDashboardGroup`   | Outer wrapper with sidebar state | Default slot                         |
| `UDashboardSidebar` | Collapsible sidebar              | `links`, `collapsible`               |
| `UDashboardPanel`   | Content panel                    | `width`, `resizable`, `grow`         |
| `UDashboardNavbar`  | Top navbar                       | `title`, left/right slots            |
| `UDashboardToolbar` | Action toolbar                   | left/right slots                     |
| `UDashboardSearch`  | Command palette modal            | `groups`                             |
| `UHeader`           | Navigation bar                   | `links`, logo/right slots            |
| `UFooter`           | Page footer                      | left/center/right slots              |
