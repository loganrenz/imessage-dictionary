---
description:
  Audit Tailwind v4 CSS import order, token usage, and Nuxt UI v4 compliance
---

This workflow enforces Tailwind CSS v4 and Nuxt UI 4 styling standards.
Incorrect import order is the #1 cause of completely unstyled Nuxt UI
components. It also ensures the codebase correctly uses modern styling
primitives and avoids deprecated patterns.

**ESLint (run first):** Component renames (UDivider→USeparator,
UDropdown→UDropdownMenu) are enforced by `nuxt-ui/no-deprecated-component`.
Hardcoded colors and icons by `atx/no-inline-hex`, `atx/no-raw-tailwind-colors`,
and `atx/lucide-icons-only`. Tailwind v3 deprecated classes (flex-shrink→shrink,
bg-gradient-to-_→bg-linear-to-_) by `atx/no-tailwind-v3-deprecated`. Invalid
Nuxt UI tokens (e.g. text-foreground) by `atx/no-invalid-nuxt-ui-token`.
`atx/no-apply-in-scoped-style` disallows `@apply` in scoped styles. Run
`pnpm run lint` before manual checks below.

1. **Verify `main.css` import order**
   - The import order MUST be: (1) Google Fonts `@import url(...)`, (2)
     `@import 'tailwindcss'`, (3) `@import '@nuxt/ui'`. Getting this wrong
     causes all Nuxt UI components to render unstyled. // turbo
     `head -10 app/assets/css/main.css`
   - Manually verify the order matches the required sequence above.

2. **Check for legacy Tailwind/PostCSS config files**
   - Tailwind v4 uses the Vite plugin. Legacy config files interfere with Nuxt
     UI 4's built-in integration and must be deleted. // turbo
     `ls tailwind.config.* postcss.config.* 2>/dev/null || echo "No legacy config files found (pass)"`

3. **Check for `@apply` in scoped styles**
   - Using `@apply` inside `<style scoped>` (especially with `:deep()`) triggers
     `Cannot apply unknown utility class` errors during SSR. Use CSS variables
     instead (e.g., `var(--color-neutral-100)`). // turbo
     `grep -rn "@apply" app/components/ app/pages/ app/layouts/ 2>/dev/null || echo "No @apply usage found (pass)"`
   - If found in `<style scoped>` blocks, refactor to use Tailwind utility
     classes inline or CSS variables.

4. **Check for deprecated Tailwind v3 class names**
   - **Enforced by:** `atx/no-tailwind-v3-deprecated` (fixable). These classes
     were renamed in Tailwind v4 and will silently fail:
     - `flex-shrink-0` → `shrink-0`
     - `flex-grow-0` → `grow-0`
     - `bg-gradient-to-r` → `bg-linear-to-r` // turbo
       `grep -rn "flex-shrink-\|flex-grow-\|bg-gradient-to-" app/ 2>/dev/null || echo "No deprecated TW3 classes found (pass)"`

5. **Check for hardcoded color values and generic Tailwind color usage**
   - Templates should use Nuxt UI design tokens (`primary`, `neutral`, etc.) and
     Tailwind theme colors, not hardcoded hex/rgb values in templates.
   - **Enforced by:** `atx/no-inline-hex`, `atx/no-raw-tailwind-colors`
   - Optional manual check: // turbo
     `grep -rn "color: #\|color: rgb\|bg-\[#" app/components/ app/pages/ 2>/dev/null | head -15 || echo "No hardcoded colors found (pass)"`
   - A few exceptions are acceptable (e.g., `theme-color` meta tag), but
     component styling should always use tokens.
   - Nuxt UI 4 uses design tokens. Ensure buttons, badges, and alerts are using
     `color="primary"` or `color="neutral"` instead of arbitrary generic colors
     unless specifically configured in `app.config.ts`.

6. **Check for `UDivider`**
   - Ensure `UDivider` is not used anywhere in `app/`. It has been renamed to
     `USeparator` in v4.
   - **Enforced by:** `nuxt-ui/no-deprecated-component` (also
     UDropdown→UDropdownMenu)
   - Optional manual check: // turbo
     `grep -rn "UDivider" app/ 2>/dev/null || echo "No UDivider found (pass)"`
   - If found, replace with `USeparator`.

7. **Check for correct icon syntax**
   - Nuxt UI 4 and Nuxt Icon strongly prefer the `i-` prefix syntax (e.g.,
     `i-lucide-home`).
   - **Enforced by:** `atx/lucide-icons-only`
   - Optional manual check: // turbo
     `grep -rn "name=\"heroicons" app/ 2>/dev/null || echo "No old heroicons found (pass)"`

8. **Review `app.config.ts`**
   - Verify that the UI configuration is correctly structured for v4 (e.g.,
     configuring `primary` and `neutral` under `ui.colors`).

9. **Check Nuxt UI Pro component adoption for landing pages**
   - Landing pages should use Pro layout primitives instead of custom div-heavy
     structures:
     - `UPageHero` for hero sections (not raw flex/grid containers)
     - `UPageSection` for content sections (not bare `<section>` tags)
     - `UPageFeature` for feature showcases
     - `UPageCTA` for call-to-action blocks
     - `UHeader` / `UFooter` for navigation and footers // turbo
       `grep -rnl 'PageHero\|PageSection\|PageFeature\|PageCTA\|UHeader\|UFooter' app/pages/ app/layouts/ 2>/dev/null || echo "No Pro landing page components found — verify if landing pages exist"`
   - If the app has marketing/landing pages built with raw HTML instead of Pro
     components, flag for refactoring.

10. **Check dashboard layout compliance**
    - Admin or dashboard pages should use Pro dashboard primitives:
      - `UDashboardGroup` for the outer layout with sidebar state management
      - `UDashboardSidebar` for collapsible side navigation
      - `UDashboardPanel` for resizable content panels
      - `UDashboardNavbar` for the top navigation bar // turbo
        `grep -rnl 'DashboardGroup\|DashboardSidebar\|DashboardPanel\|DashboardNavbar' app/pages/ app/layouts/ 2>/dev/null || echo "No Pro dashboard components found — verify if dashboard pages exist"`
    - If the app has dashboard pages built with custom sidebar/panel layouts,
      flag for migration to Pro components.
