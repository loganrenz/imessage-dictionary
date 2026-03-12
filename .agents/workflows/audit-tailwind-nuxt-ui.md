---
description:
  Audit and fix Tailwind v4 + Nuxt UI 4 best-practice drift — CSS entry point,
  @theme usage, semantic tokens, color runtime config, scoped style safety,
  deprecated utilities, import order, design token compliance, and custom CSS
  minimization (Tailwind-First enforcement)
---

# Tailwind v4 + Nuxt UI 4 Best-Practice Drift Audit & Fix

Systematic audit that detects and fixes the most impactful categories of drift
from the official Nuxt UI 4 / Tailwind v4 best practices. Sources:
[ui.nuxt.com/getting-started](https://ui.nuxt.com/getting-started),
[tailwindcss.com/docs](https://tailwindcss.com/docs), and institutional KIs.

> **Scope:** One app at a time. Run from the app root (e.g. `apps/<app-name>`).
> Layer audits run from `layers/narduk-nuxt-layer/`.

> **Related workflows:**
>
> - `/check-ui-styling` — Quick-pass Tailwind lint check
> - `/audit-nuxt-ui-4` — Pro component adoption audit
> - `/nuxt-check-fix-2` — Full Nuxt 4 compliance & runtime warning audit

// turbo-all

---

## Phase 1 — CSS Entry Point & Import Order (Critical)

Wrong import order is the **#1 cause** of completely unstyled Nuxt UI
components.

### 1.1 Verify `main.css` exists and is registered

```bash
cat app/assets/css/main.css 2>/dev/null || echo "FAIL: main.css not found"
```

```bash
grep -n 'css:' nuxt.config.ts 2>/dev/null | head -5 || echo "FAIL: no css key in nuxt.config.ts"
```

### 1.2 Check import order

The **only correct order** is:

```css
/* 1. External font @import url() — MUST come first (PostCSS rule) */
@import url('https://fonts.googleapis.com/...');

/* 2. Tailwind */
@import 'tailwindcss';

/* 3. Nuxt UI — immediately after Tailwind */
@import '@nuxt/ui';

/* 4. @source directives (if any) */
/* 5. @theme block (if any) */
/* 6. :root / .dark CSS variable overrides */
```

```bash
head -20 app/assets/css/main.css
```

**Fix rules:**

- If `@import url(...)` (Google Fonts) appears after `@import 'tailwindcss'`,
  move it to line 1.
- If `@import '@nuxt/ui'` is missing, add it immediately after
  `@import 'tailwindcss'`.
- If any `@import` appears after non-import CSS rules, move it before all rules.

### 1.3 Check for legacy config files

Tailwind v4 uses its Vite plugin. Legacy config files **interfere** with Nuxt UI
4's integration.

```bash
ls tailwind.config.* postcss.config.* 2>/dev/null || echo "PASS: no legacy config files"
```

**Fix:** Delete any `tailwind.config.*` or `postcss.config.*` files found.

---

## Phase 2 — `@theme` vs `@theme static` (Color Discovery)

### 2.1 Check `@theme` usage for brand/primary colors

Colors mapped to semantic aliases (`primary`, `neutral`) via `app.config.ts`
**MUST** use `@theme` (dynamic), not `@theme static`. Using `@theme static`
prevents Nuxt UI from discovering the color and populates `--ui-color-primary-*`
as empty strings.

```bash
grep -n '@theme' app/assets/css/main.css 2>/dev/null
```

**Fix rules:**

- If custom brand colors are defined inside `@theme static { ... }` and those
  colors are mapped to `primary` or `neutral` in `app.config.ts`, change to
  `@theme { ... }` (remove `static`).
- **Exception:** Overriding _existing_ Tailwind default colors (e.g. redefining
  `--color-green-*`) is fine with `@theme static` because Tailwind already
  generates those utilities.

### 2.2 Verify color variable naming

Custom colors must use the `--color-<name>-<shade>` pattern with all 11 shades
(50–950).

```bash
grep -c '\-\-color-' app/assets/css/main.css 2>/dev/null || echo "No custom color variables"
```

---

## Phase 3 — Semantic Token Compliance

### 3.1 Check `app.config.ts` color mapping

```bash
cat app/app.config.ts 2>/dev/null || cat app.config.ts 2>/dev/null || echo "FAIL: no app.config.ts"
```

Verify `ui.colors` maps `primary` and `neutral` to valid color names. The
official defaults are:

| Alias       | Default  |
| ----------- | -------- |
| `primary`   | `green`  |
| `secondary` | `blue`   |
| `success`   | `green`  |
| `info`      | `blue`   |
| `warning`   | `yellow` |
| `error`     | `red`    |
| `neutral`   | `slate`  |

### 3.2 Check for semantic token shadowing (Critical)

Nuxt UI 4 provides built-in `.text-default`, `.bg-default`, `.border-default`
etc. **DO NOT** redefine these in app CSS with hardcoded values — it breaks dark
mode.

```bash
grep -n '\.text-default\|\.bg-default\|\.border-default\|\.text-muted\|\.bg-muted\|\.bg-elevated\|\.text-dimmed\|\.text-toned\|\.text-highlighted\|\.text-inverted\|\.bg-inverted\|\.bg-accented\|\.border-muted\|\.border-accented\|\.border-inverted' app/assets/css/main.css 2>/dev/null || echo "PASS: no hardcoded semantic token overrides"
```

**Fix:** Remove CSS rules that shadow Nuxt UI semantic tokens. Configure colors
via `app.config.ts` → `ui.colors` or `--ui-*` CSS variables in `:root`/`.dark`
blocks instead.

### 3.3 Check for `--ui-*` variable overrides

It _is_ valid to override semantic CSS variables like `--ui-primary`,
`--ui-text`, `--ui-bg`, `--ui-border`, `--ui-radius`, and `--ui-container` in
`:root` / `.dark` blocks. Ensure overrides reference `--ui-color-*` variables
(not hardcoded hex).

```bash
grep -n '\-\-ui-' app/assets/css/main.css 2>/dev/null | head -20
```

**Fix:** Replace any hardcoded `--ui-primary: #hex` with
`--ui-primary: var(--ui-color-<name>-<shade>)`.

---

## Phase 4 — Nuxt Config Compliance

### 4.1 Verify `@nuxt/ui` module registration

```bash
grep -n '@nuxt/ui' nuxt.config.ts
```

`@nuxt/ui` MUST be in the `modules` array. It handles Tailwind integration
internally.

### 4.2 Check for manual Tailwind plugin registration

If `@nuxtjs/tailwindcss` or manual Tailwind/PostCSS plugins are also registered
alongside `@nuxt/ui`, they may conflict.

```bash
grep -n 'tailwindcss\|postcss' nuxt.config.ts 2>/dev/null | grep -v 'import\|//' | head -5
```

**Fix:** Remove `@nuxtjs/tailwindcss` from modules if `@nuxt/ui` is present.
Nuxt UI 4 bundles Tailwind v4 internally.

### 4.3 Verify `UApp` wrapper

```bash
grep -c 'UApp' app/app.vue 2>/dev/null || echo "FAIL: UApp not found in app.vue"
```

`app.vue` MUST wrap content in `<UApp>` for overlays, toasts, and color mode to
work.

### 4.4 Check for extended theme colors registration

If the app uses extra semantic colors beyond defaults (e.g. `tertiary`), they
must be registered in `nuxt.config.ts` under `ui.theme.colors`.

```bash
grep -A 10 'theme:' nuxt.config.ts 2>/dev/null | head -15
```

---

## Phase 5 — Scoped Style Safety

### 5.1 Check for `@apply` in scoped styles

`@apply` inside `<style scoped>` (especially with `:deep()`) can trigger
`Cannot apply unknown utility class` errors during SSR.

```bash
grep -rn '@apply' app/components/ app/pages/ app/layouts/ 2>/dev/null | head -20 || echo "PASS: no @apply usage"
```

**Fix rules:**

- Replace `@apply bg-neutral-100` with
  `background-color: var(--color-neutral-100)`.
- Replace `@apply dark:bg-neutral-800` with a `.dark` selector block using
  `--color-*` variables.
- Alternatively, move classes inline to the template.

### 5.2 Check for `:deep()` with Tailwind classes

```bash
grep -rn ':deep(' app/components/ app/pages/ 2>/dev/null | head -15
```

Inspect hits — if they use Tailwind utility classes, prefer CSS variable
equivalents for SSR safety.

---

## Phase 6 — Deprecated Utilities & Renames

### 6.1 Tailwind v3 → v4 class renames

```bash
grep -rn 'flex-shrink-\|flex-grow-\|bg-gradient-to-' app/ 2>/dev/null | grep -v node_modules | head -20 || echo "PASS: no deprecated TW3 classes"
```

| Tailwind v3        | Tailwind v4      |
| ------------------ | ---------------- |
| `flex-shrink-0`    | `shrink-0`       |
| `flex-grow-0`      | `grow-0`         |
| `bg-gradient-to-r` | `bg-linear-to-r` |

### 6.2 Nuxt UI component renames

```bash
grep -rn 'UDivider\|UDropdown[^M]\|UFormGroup\|ButtonGroup' app/ 2>/dev/null | grep -v node_modules | head -15 || echo "PASS: no deprecated component names"
```

| Deprecated      | Replacement     |
| --------------- | --------------- |
| `UDivider`      | `USeparator`    |
| `UDropdown`     | `UDropdownMenu` |
| `UFormGroup`    | `UFormField`    |
| `ButtonGroup`   | `UFieldGroup`   |
| `PageMarquee`   | `UMarquee`      |
| `PageAccordion` | `UAccordion`    |

### 6.3 Nuxt UI prop renames

```bash
grep -rn 'value-attribute\|option-attribute\|v-model=".*[Mm]odal\|nullify' app/ 2>/dev/null | grep -v node_modules | head -10 || echo "PASS: no deprecated props"
```

| Deprecated         | Replacement        | Context              |
| ------------------ | ------------------ | -------------------- |
| `value-attribute`  | `value-key`        | USelect, USelectMenu |
| `option-attribute` | `label-key`        | USelect, USelectMenu |
| `v-model="isOpen"` | `v-model:open`     | UModal, UDrawer      |
| `v-model.nullify`  | `v-model.nullable` | UInput, UTextarea    |

### 6.4 Icon syntax

Nuxt UI 4 and Nuxt Icon prefer the `i-` prefix syntax.

```bash
grep -rn 'name="heroicons\|name="mdi-\|icon="heroicons' app/ 2>/dev/null | head -10 || echo "PASS: no legacy icon syntax"
```

**Fix:** Replace `heroicons:icon-name` with `i-lucide-icon-name` (or
`i-heroicons-icon-name` if the heroicons collection is installed).

### 6.5 Input Sizing

Input components like `<UTextarea>` and `<UInput>` do not take 100% of their
container's width by default, which can cause squished layouts.

```bash
grep -rn '<UInput\|<UTextarea' app/ 2>/dev/null | grep -v 'w-full' | head -10 || echo "PASS: no inputs missing w-full"
```

**Fix:** Always apply `class="w-full"` to `<UInput>` and `<UTextarea>` unless
explicitly designing a narrow inline field.

---

## Phase 7 — Hardcoded Colors & Raw Tailwind Colors

### 7.1 Inline hex/rgb in templates

```bash
grep -rn 'color: #\|color: rgb\|bg-\[#\|text-\[#\|border-\[#' app/components/ app/pages/ 2>/dev/null | head -15 || echo "PASS: no inline hex/rgb"
```

**Fix:** Replace with semantic tokens (`text-primary`, `bg-muted`) or
`--color-*` / `--ui-*` CSS variables.

### 7.2 Raw Tailwind palette colors in components

Using `bg-red-500` or `text-blue-600` directly ties the UI to specific colors
and breaks theme switching.

```bash
grep -rn 'bg-red-\|bg-blue-\|bg-green-\|text-red-\|text-blue-\|text-green-\|border-red-\|border-blue-\|border-green-' app/components/ app/pages/ 2>/dev/null | grep -v node_modules | head -15 || echo "PASS: no raw palette colors"
```

**Fix:** Replace with semantic aliases:

- `text-red-500` → `text-error`
- `bg-green-500` → `bg-success` or `bg-primary`
- `text-blue-500` → `text-info`

---

## Phase 8 — Nuxt UI CSS Variable Vocabulary

Verify codebase uses the official Nuxt UI 4 design tokens from the
[CSS Variables reference](https://ui.nuxt.com/getting-started/theme/css-variables):

### Text tokens

`text-dimmed` · `text-muted` · `text-toned` · `text-default` ·
`text-highlighted` · `text-inverted`

### Background tokens

`bg-default` · `bg-muted` · `bg-elevated` · `bg-accented` · `bg-inverted`

### Border tokens

`border-default` · `border-muted` · `border-accented` · `border-inverted`

### Semantic color tokens

`text-primary` · `text-secondary` · `text-success` · `text-info` ·
`text-warning` · `text-error`

Check for invalid / non-existent Nuxt UI tokens:

```bash
grep -rn 'text-foreground\|bg-background\|text-subtitle\|bg-surface' app/ 2>/dev/null | grep -v node_modules | head -10 || echo "PASS: no invalid design tokens"
```

**Fix:** Replace with the correct Nuxt UI 4 token names listed above.

---

## Phase 9 — Monorepo Resolution (Layers)

### 9.1 Layer CSS import resolution

In a PNPM workspace, `@import '@nuxt/ui'` in a layer or child app CSS may fail
if `@nuxt/ui` is not resolvable from that package.

```bash
grep -n '@nuxt/ui' layers/*/app/assets/css/main.css 2>/dev/null
```

```bash
grep '@nuxt/ui' layers/*/package.json 2>/dev/null || echo "Check if @nuxt/ui is resolvable via workspace"
```

**Fix:** Ensure `@nuxt/ui` is in the dependency tree of any package that imports
it in CSS.

### 9.2 Module duplication across layer + app

```bash
grep -n '@nuxt/ui' layers/*/nuxt.config.ts nuxt.config.ts 2>/dev/null
```

Nuxt UI should be registered in **one** config (prefer the layer). If registered
in both, options may conflict.

---

## Phase 10 — `@source` Directive Audit

If the app renders external content (markdown, fixtures), ensure Tailwind scans
those files for classes.

```bash
grep -n '@source' app/assets/css/main.css 2>/dev/null || echo "No @source directives (may be fine)"
```

**When to add `@source`:**

- App uses `@nuxt/content` with custom HTML/components
- App renders user-generated or API-sourced HTML with Tailwind classes
- Tests or fixtures contain Tailwind classes that must be in the CSS bundle

---

## Phase 11 — Custom CSS Minimization (Tailwind-First)

Custom CSS is technical debt. Every line of custom CSS is a line that could
break on Tailwind upgrades, doesn't respond to dark mode automatically, and is
harder to maintain. **Favor Tailwind utility classes and Nuxt UI design tokens
over custom CSS rules.**

### 11.1 Audit `<style>` blocks in components and pages

```bash
grep -rlc '<style' app/components/ app/pages/ app/layouts/ 2>/dev/null | while read f; do count=$(grep -c '<style' "$f"); echo "  $count style block(s): $f"; done || echo "PASS: no style blocks"
```

**Best practice:**

- **Eliminate `<style>` blocks** in components. Use Tailwind classes inline.
- The only acceptable `<style>` blocks are in `main.css` (design system
  primitives), `app.vue` (page transitions), or third-party component overrides
  that cannot use props/slots.
- If a `<style scoped>` block only contains `@apply`, inline the classes
  directly in the template and delete the block.

### 11.2 Audit custom CSS classes in `main.css`

```bash
grep -c '{' app/assets/css/main.css 2>/dev/null || echo "0"
```

Review the count. A healthy `main.css` should be **mostly** `@import`, `@theme`,
and `:root`/`.dark` variable blocks. Custom utility classes (`.card-base`,
`.glass`, `.form-container`) are acceptable as **design system primitives** —
but keep the count low.

**Rules for acceptable custom CSS in `main.css`:**

- ✅ `@theme` variables (fonts, shadows, radius, transitions)
- ✅ `:root` / `.dark` semantic variable overrides
- ✅ Reusable design system primitives (glass, card-base, form layouts)
- ✅ Keyframe animations
- ✅ Page transition styles
- ❌ One-off component styles (move to Tailwind inline)
- ❌ Color definitions outside `@theme` or `:root`/`.dark`
- ❌ Media queries that duplicate Tailwind breakpoints (`sm:`, `md:`, `lg:`)
- ❌ Flexbox/grid rules that Tailwind handles (`flex`, `grid`, `gap-*`)

### 11.3 Check for custom CSS that duplicates Tailwind utilities

```bash
grep -rn 'display:\s*flex\|display:\s*grid\|display:\s*none\|margin:\|padding:\|font-size:\|font-weight:\|text-align:\|justify-content:\|align-items:\|gap:' app/assets/css/main.css app/components/ app/pages/ 2>/dev/null | grep -v node_modules | grep -v '@theme\|:root\|\.dark' | head -20 || echo "PASS: no custom CSS duplicating Tailwind"
```

**Fix:** Replace custom CSS properties with their Tailwind equivalents:

| Custom CSS                          | Tailwind class   |
| ----------------------------------- | ---------------- |
| `display: flex`                     | `flex`           |
| `display: grid`                     | `grid`           |
| `justify-content: center`           | `justify-center` |
| `align-items: center`               | `items-center`   |
| `gap: 1rem`                         | `gap-4`          |
| `padding: 1.5rem`                   | `p-6`            |
| `font-weight: 600`                  | `font-semibold`  |
| `border-radius: 0.5rem`             | `rounded-lg`     |
| `@media (min-width: 640px) { ... }` | `sm:...`         |

### 11.4 Check for inline `style` attributes

```bash
grep -rn ' style="' app/components/ app/pages/ app/layouts/ 2>/dev/null | grep -v node_modules | head -15 || echo "PASS: no inline style attributes"
```

**Fix:** Replace `style="..."` with Tailwind classes or CSS variables.
Exception: dynamic styles bound with `:style` for computed values (e.g.
`transform`, `--progress`) are acceptable.

---

## Phase 12 — Compile Report & Fix

Present findings grouped by severity:

| Severity    | Examples                                                                      |
| ----------- | ----------------------------------------------------------------------------- |
| 🔴 Critical | Wrong import order, missing `@import '@nuxt/ui'`, `@theme static` for primary |
| 🟠 High     | Semantic token shadowing, `@apply` in scoped styles, deprecated components    |
| 🟡 Medium   | Raw palette colors, deprecated class names, missing `UApp`, custom CSS bloat  |
| 🟢 Low      | Missing `@source`, icon syntax, arbitrary value bracket cleanup               |

**For each finding:**

1. State the rule violated
2. Show the exact file + line
3. Provide the before/after fix
4. Apply the fix (or ask user approval for design decisions)

After fixing, run the quality gate:

```bash
pnpm run quality
```

```bash
pnpm run build 2>&1 | tail -20
```
