---
description:
  Full repository architecture audit — scores 19 categories out of 10 with
  findings and recommendations
---

# Repository Architecture Scorecard

This workflow performs a comprehensive architecture audit of the monorepo and
produces a scored report across 19 categories. Each category is scored 1-10 with
specific findings and recommendations.

## 1. Monorepo Structure (Target: 10/10)

Verify workspace integrity and organization.

1. **PNPM Workspace** // turbo
   - Check `pnpm-workspace.yaml` includes `apps/*`, `packages/*`, `layers/*`
   - Verify all directories declared in the workspace yaml actually exist //
     turbo
   - Run `ls apps/ layers/ packages/` to confirm structure

2. **Root package.json**
   - Verify `dev`, `build`, `lint`, `quality` scripts exist
   - Check for Volta/Node version pinning (should be consistent across all
     packages)
   - Check for task caching tools (turbo.json or nx.json) — bonus points if
     present

3. **Cleanliness** // turbo
   - Run `find . -name '.DS_Store' -not -path './node_modules/*' | head -20`
   - Flag any `.DS_Store`, `.env`, or stale build artifacts committed to git

**Scoring:** 10 = all checks pass. -1 for each: missing workspace member, no
version pinning, committed junk files, no task caching.

---

## 2. Layer Architecture (Target: 10/10)

Audit the shared Nuxt Layer for publication readiness and clean inheritance.

1. **Package Publishing**
   - Verify `publishConfig` in layer `package.json` (registry, access)
   - Check `exports` field covers `"."`, `"./server/*"`, `"./app/*"`
   - Check `files` field includes all necessary directories // turbo
   - Run `cat layers/narduk-nuxt-layer/package.json | grep -A5 publishConfig`

2. **Layer AGENTS.md**
   - Must exist and explain when to edit layer vs. app

3. **Type Safety**
   - Check for `H3EventContext` augmentation (`server/types/h3.d.ts`)
   - No `as` type casts in core utilities (useDatabase, etc.) // turbo
   - Run `grep -r 'as DrizzleD1Database' layers/ --include='*.ts' | head -10`

4. **Consumer ergonomics**
   - App's `nuxt.config.ts` should only need
     `extends: ['@narduk-enterprises/narduk-nuxt-template-layer']`
   - No duplicated module declarations between app and layer

**Scoring:** 10 = all checks pass. -1 for each: missing exports, missing type
augmentation, duplicated modules, no layer AGENTS.md.

---

## 3. CI/CD Pipeline (Target: 10/10)

Audit GitHub Actions workflows for correctness and completeness.

1. **Workflow inventory** // turbo
   - Run `ls .github/workflows/`
   - Expect: `ci.yml` (quality-only), `version-bump.yml`,
     `weekly-drift-check.yml` (minimum)

2. **CI (pull requests)**
   - Must run: `pnpm install --frozen-lockfile`, lint, typecheck
   - Should run: build (catches build-time errors)
   - Should run: test (if tests exist)

3. **Deploy (local only)**
   - CI does NOT deploy — deployment is done locally via `pnpm run ship`
     (wrangler deploy)
   - The `/deploy` agent workflow must refuse to deploy a dirty repo
     (uncommitted changes)
   - `pnpm run ship` script must exist in root package.json

4. **Layer publishing**
   - Must auto-bump version and publish on layer changes (template repo only)
   - Commit message should include `[skip ci]` to avoid deploy loops

**Scoring:** 10 = all checks pass. -1 for each: missing workflow, no build in
CI, wrong cache paths, no concurrency control, no path guards, no dirty-repo
guard in deploy workflow.

---

## 4. Security (Target: 10/10)

Audit server-side security middleware and headers.

1. **CSRF Protection** // turbo
   - Run `find layers/ -name 'csrf*' -o -name 'security*' | head -10`
   - Verify middleware blocks POST/PUT/PATCH/DELETE without `X-Requested-With`
   - Verify skip list for webhooks/cron/callbacks

2. **Rate Limiting**
   - Per-isolate rate limiter must exist (`server/utils/rateLimit.ts`)
   - Documentation should mention Cloudflare Rate Limiting Rules as
     complementary global protection

3. **CORS**
   - CORS middleware must exist (`server/middleware/cors.ts`)
   - Default must be same-origin (no headers when unconfigured)
   - Must use exact origin matching (no wildcards)

4. **Security Headers**
   - Check for CSP, X-Content-Type-Options, X-Frame-Options // turbo
   - Run
     `grep -r 'Content-Security-Policy\|X-Frame-Options\|X-Content-Type' layers/server/ --include='*.ts' | head -10`

5. **AGENTS.md Documentation**
   - Security section must exist documenting rate limiting, CORS, and CSRF

**Scoring:** 10 = all checks pass. -1 for each: missing CSRF, missing
rate-limit, missing CORS, missing CSP headers, missing documentation.

---

## 5. SEO & Meta (Target: 10/10)

Audit SEO composables, sitemap, and structured data.

1. **useSeo composable** // turbo
   - Run `cat layers/narduk-nuxt-layer/app/composables/useSeo.ts | head -5`
   - Must wrap `useSeoMeta()`, `useHead()`, and `defineOgImageComponent()`

2. **Schema.org**
   - `useSchemaOrg.ts` or equivalent must exist
   - AGENTS.md must document `useWebPageSchema()` requirement per page

3. **OG Image**
   - `OgImageDefault` component must exist // turbo
   - Run `find layers/ -path '*/OgImage*' | head -10`

4. **IndexNow**
   - Submit endpoint and key verification route must exist

5. **Site config**
   - `site.url`, `site.name`, `site.description` must be set in `nuxt.config.ts`

**Scoring:** 10 = all checks pass. -1 for each: missing useSeo, no OG image
template, no IndexNow, no Schema.org composable.

---

## 6. Cloudflare Workers Compatibility (Target: 10/10)

Audit edge runtime compliance.

1. **Nitro preset** // turbo
   - Run `grep -r 'cloudflare-module' layers/ --include='*.ts' | head -5`

2. **No Node.js modules** // turbo
   - Run
     `grep -rn "require('fs')\|require('path')\|require('crypto')\|from 'node:fs'\|from 'node:path'\|from 'node:crypto'" layers/narduk-nuxt-layer/server/ apps/web/server/ --include='*.ts' | head -20`
   - Exclude tools/ directory (runs in Node, not Workers)

3. **Pinned dependencies**
   - `rolldown-vite` must be pinned to a specific version (NOT `@latest`) //
     turbo
   - Run
     `grep -r 'rolldown-vite' apps/ layers/ --include='package.json' | head -10`
   - `@cloudflare/unenv-preset` must be pinned via overrides

4. **D1 Integration**
   - `useDatabase()` must create per-request instances (not module-scope
     singletons)
   - Must properly type check for missing D1 binding

**Scoring:** 10 = all checks pass. -1 for each: unpinned dep, Node module
import, module-scope DB, missing esbuild target.

---

## 7. ESLint & Code Quality (Target: 10/10)

Audit linting infrastructure.

1. **Custom plugin inventory** // turbo
   - Run `ls packages/eslint-config/ | grep eslint-plugin`
   - Count total rules across all custom plugins

2. **Shared config**
   - Central `eslint.config.mjs` must exist in `packages/eslint-config/`
   - Must include community plugins: import-x, unicorn, security, regexp

3. **Build pipeline**
   - `pnpm run build:plugins` must exist and work
   - `prelint` script should auto-build plugins

4. **Strictness**
   - Check `@typescript-eslint/no-explicit-any` setting (should be at least
     `warn`)

**Scoring:** 10 = all checks pass. -1 for each: missing plugin, no-explicit-any
off, no security plugin, no prelint auto-build.

---

## 8. DX & Tooling (Target: 10/10)

Audit developer experience infrastructure.

1. **Init script** // turbo
   - Run `wc -l tools/init.ts`
   - Must be idempotent (check for --repair mode)
   - Must provision: D1, Doppler, GitHub secrets, analytics

2. **Validate script**
   - `tools/validate.ts` must exist
   - Must be documented in AGENTS.md

3. **Agent workflows** // turbo
   - Run `ls .agents/workflows/ | wc -l`
   - Should have 10+ workflows covering architecture, SSR, SEO, UI, etc.

4. **Human developer guide**
   - Check for `CONTRIBUTING.md` or equivalent

**Scoring:** 10 = all checks pass. -1 for each: non-idempotent init, missing
validate docs, < 10 workflows, no human dev guide.

---

## 9. Documentation (Target: 10/10)

Audit AGENTS.md and README quality.

1. **Root AGENTS.md** // turbo
   - Run `wc -l AGENTS.md`
   - Must include: project structure, hard constraints, security section,
     recipes, quality workflows table

2. **Layer AGENTS.md**
   - Must exist with layer-specific rules

3. **Package manager consistency** // turbo
   - Run `grep -n 'npm install\|npm run' AGENTS.md | head -10`
   - Should use `pnpm` consistently (not `npm`)

4. **README.md**
   - Must include quick start, deployment, and project structure

**Scoring:** 10 = all checks pass. -1 for each: missing section, inconsistent
package manager, no layer AGENTS.md.

---

## 10. Showcase / Examples (Target: 10/10)

Audit example app quality and documentation.

1. **Example inventory** // turbo
   - Run `ls apps/ | grep example`
   - Expect: auth, blog, dashboard, marketing (minimum)

2. **Per-app README** // turbo
   - Run `find apps/ -name 'README.md' -maxdepth 2 | head -10`
   - Each example must have a README explaining what it demonstrates

3. **Service Bindings**
   - Showcase gateway must use Service Bindings for routing
   - Dispatch middleware must exist

4. **Completeness**
   - Auth: register, login, logout, me
   - Blog: content directory, list page, detail page
   - Dashboard: sidebar layout, auth middleware
   - Marketing: hero, pricing, testimonials, contact

**Scoring:** 10 = all checks pass. -1 for each: missing example, missing README,
incomplete feature set.

---

## 11. Tailwind / Design System (Target: 10/10)

Audit CSS architecture and design tokens.

1. **Import order** // turbo
   - Run `head -5 layers/narduk-nuxt-layer/app/assets/css/main.css`
   - Must be: `@import 'tailwindcss'` then `@import '@nuxt/ui'`

2. **@theme tokens**
   - Check for font, color, spacing, shadow, and radius tokens // turbo
   - Run `grep -c '@theme' layers/narduk-nuxt-layer/app/assets/css/main.css`

3. **Utility classes**
   - Check for reusable utility classes (.glass, .form-\*, animations)

4. **Design token coverage**
   - `app.config.ts` must configure primary and neutral colors
   - Custom components should reference Nuxt UI tokens, not hardcoded values

**Scoring:** 10 = all checks pass. -1 for each: wrong import order, missing
token category, hardcoded colors, no utility classes.

---

## 12. Testing (Target: 10/10)

Audit test coverage and infrastructure.

1. **Test files exist** // turbo
   - Run
     `find . -name '*.test.ts' -o -name '*.spec.ts' | grep -v node_modules | head -20`

2. **Test infrastructure**
   - `vitest.config.ts` or equivalent must exist
   - `playwright.config.ts` for E2E must exist

3. **Layer tests**
   - Core utilities (useSeo, useDatabase, CSRF, rateLimit) should have unit
     tests

4. **CI integration**
   - CI must run tests (check `ci.yml` for test step)

5. **Scripts**
   - `test:unit` and `test:e2e` scripts must exist in relevant packages

**Scoring:** 10 = all checks pass. -1 for each: no test files, no vitest config,
no playwright config, no CI test step, no layer tests. Min score: 5 if only
recipe docs exist.

---

## 13. Nuxt 4 SSR & Hydration Safety (Target: 10/10)

Audit for the most common Nuxt 4 SSR failures, hydration mismatches, and
data-fetching anti-patterns.

1. **Browser API access in SSR** // turbo
   - Run
     `grep -rn 'window\.' apps/ layers/ --include='*.vue' --include='*.ts' | grep -v 'node_modules\|import.meta.client\|onMounted\|ClientOnly\|.d.ts' | head -20`
   - Unguarded `window`, `document`, `localStorage`, or `navigator` access
     outside `onMounted`/`import.meta.client` blocks causes SSR crashes
   - Must be wrapped in `if (import.meta.client)`, `onMounted()`, or
     `<ClientOnly>`

2. **Double-fetching with raw `$fetch`** // turbo
   - Run
     `grep -rn '\$fetch(' apps/ layers/ --include='*.vue' | grep -v 'node_modules\|useFetch\|useAsyncData\|@click\|@submit\|onMounted\|watch(' | head -20`
   - Using `$fetch` directly in component `setup()` causes server+client
     double-fetch
   - Must be wrapped in `useFetch()` or `useAsyncData()` for SSR data; reserve
     `$fetch` for event handlers

3. **Module-level `ref()` (state leak)** // turbo
   - Run
     `grep -rn '^const.*= ref(' apps/ layers/ --include='*.ts' | grep -v 'node_modules\|composables\|stores\|.test.\|.spec.' | head -20`
   - `ref()` declared at module scope (outside `setup`/composable) leaks state
     across SSR requests
   - Must use `useState()` for cross-request-safe shared state

4. **Non-deterministic values in SSR** // turbo
   - Run
     `grep -rn 'Math.random()\|crypto.randomUUID()\|new Date()\|Date.now()' apps/ layers/ --include='*.vue' | grep -v 'node_modules\|onMounted\|import.meta.client\|server/' | head -15`
   - `Math.random()`, `Date.now()`, UUIDs in templates cause hydration drift
   - Use `useId()` for SSR-safe unique IDs and `<NuxtTime>` for date rendering

5. **useAsyncData stale/static keys** // turbo
   - Run
     `grep -rn 'useAsyncData(' apps/ layers/ --include='*.vue' --include='*.ts' | grep -v 'node_modules' | head -20`
   - Template literal keys with `.value` (`` `key-${foo.value}` ``) are
     evaluated once at setup time and never update
   - Must use getter functions as keys: `() => \`key-${foo.value}\`` when data
     depends on reactive params

6. **useAsyncData `watch` + `lazy: false` hang** // turbo
   - Run
     `grep -rn -A2 'lazy.*false' apps/ layers/ --include='*.vue' --include='*.ts' | grep -B2 'watch' | head -15`
   - Combining `watch: [reactiveState]` with `lazy: false` in layouts/app.vue
     can block SSR indefinitely
   - Global background fetches must use `lazy: true`

7. **Invalid HTML nesting** // turbo
   - Run `grep -rn '<p>' apps/ layers/ --include='*.vue' | head -20`
   - `<div>` inside `<p>`, `<a>` inside `<a>`, `<form>` inside `<form>` cause
     browser auto-correction → hydration mismatch
   - Audit with `@nuxtjs/html-validator` or manual review

8. **Global middleware fetch loops** // turbo
   - Run
     `find apps/ layers/ -name '*.global.ts' -path '*/middleware/*' | head -10`
   - Global middleware that fetches local `/api/` routes causes recursive SSR
     sub-requests
   - Must guard with `if (to.path.startsWith('/api/')) return;`

9. **`reloadNuxtApp` in SSR context** // turbo
   - Run
     `grep -rn 'reloadNuxtApp' apps/ layers/ --include='*.vue' --include='*.ts' | grep -v 'node_modules\|import.meta.client' | head -10`
   - `reloadNuxtApp()` called during SSR hangs the Nitro worker
   - Must be wrapped in `if (import.meta.client)` block

10. **Known hydration-prone components** // turbo
    - Run
      `grep -rn '<UNavigationMenu\|<UIcon\|<UEmpty' apps/ layers/ --include='*.vue' | grep -v 'ClientOnly' | head -15`
    - `UNavigationMenu`, `UIcon` (in dynamic contexts), and `UEmpty` in
      conditional branches are known hydration mismatch sources
    - Wrap in `<ClientOnly>` or use the `isHydrated` guard pattern

**Scoring:** 10 = all checks pass. -1 for each: unguarded browser API, raw
`$fetch` in setup, module-scope `ref()`, non-deterministic values, static
useAsyncData keys, missing API guard in global middleware, SSR-unsafe
`reloadNuxtApp`, unguarded hydration-prone components.

---

## 14. Nuxt UI v4 Compliance (Target: 10/10)

Audit for deprecated Nuxt UI syntax, old v2/v3 patterns, and common Nuxt UI v4
migration failures.

1. **Deprecated component names** // turbo
   - Run
     `grep -rn 'UNavigationTree\|UDashboardPanelContent\|UDashboardNavbar\|ButtonGroup\|PageAccordion\|PageMarquee' apps/ layers/ --include='*.vue' | grep -v 'node_modules' | head -15`
   - v3→v4 renames: `UNavigationTree`→`UTree`,
     `UDashboardPanelContent`→`UDashboardPanelBody`, `ButtonGroup`→`FieldGroup`,
     `PageAccordion`→`Accordion`

2. **Old prop syntax (value-attribute / option-attribute)** // turbo
   - Run
     `grep -rn 'value-attribute\|option-attribute\|:options=' apps/ layers/ --include='*.vue' | grep -v 'node_modules' | head -15`
   - v4 renames: `value-attribute`→`value-key`, `option-attribute`→`label-key`,
     `:options`→`:items`

3. **Legacy CSS imports** // turbo
   - Run
     `grep -rn "@nuxt/ui-pro\|@import.*ui-pro" apps/ layers/ --include='*.css' --include='*.ts' --include='*.vue' | grep -v 'node_modules' | head -10`
   - `@nuxt/ui-pro` is unified into `@nuxt/ui` in v4 — any
     `@import '@nuxt/ui-pro'` must be replaced with `@import '@nuxt/ui'`
   - `@nuxt/ui-pro` module registration must be removed (all Pro components are
     included in `@nuxt/ui` v4)

4. **CSS import order** // turbo
   - Run `head -5 layers/narduk-nuxt-layer/app/assets/css/main.css`
   - Must be: `@import 'tailwindcss'` THEN `@import '@nuxt/ui'` (in that exact
     order)
   - Wrong order causes unstyled components (no padding, no background)

5. **Legacy color tokens** // turbo
   - Run
     `grep -rn 'color="gray"' apps/ layers/ --include='*.vue' | grep -v 'node_modules' | head -10`
   - `color="gray"` is replaced by `color="neutral"` in v4
   - Custom color strings (e.g., `color="orange"`) must be semantic tokens or
     use class overrides

6. **@apply with Nuxt UI tokens** // turbo
   - Run
     `grep -rn '@apply.*bg-\(neutral\|primary\|secondary\)' apps/ layers/ --include='*.vue' | grep -v 'node_modules' | head -10`
   - `@apply` with Nuxt UI semantic classes inside `<style scoped>` causes SSR
     errors in Tailwind 4
   - Must use CSS variables instead:
     `background-color: var(--color-neutral-100);`

7. **Stale v3 model modifiers** // turbo
   - Run
     `grep -rn 'nullify\|modelModifiers' apps/ layers/ --include='*.vue' | grep -v 'node_modules' | head -10`
   - v3 `nullify` modifier is now `nullable` in v4; new `optional` modifier
     converts to `undefined`

8. **Old utility import paths** // turbo
   - Run
     `grep -rn "#ui-pro/\|from.*@nuxt/ui-pro" apps/ layers/ --include='*.vue' --include='*.ts' | grep -v 'node_modules' | head -10`
   - `#ui-pro/utils/*` paths must be updated (e.g.,
     `#ui-pro/utils/content`→`@nuxt/content/utils`)

9. **Event handler type mismatches** // turbo
   - Run
     `grep -rn '@click="refresh"\|@click="execute"' apps/ layers/ --include='*.vue' | grep -v 'node_modules' | head -10`
   - Passing `useAsyncData` `refresh` directly to `@click` causes TS errors
     (MouseEvent vs AsyncDataExecuteOptions)
   - Must wrap: `@click="() => refresh()"`

10. **Stale `@nuxt/ui-pro` dependency** // turbo
    - Run
      `grep -rn 'ui-pro' apps/ layers/ --include='package.json' | grep -v 'node_modules' | head -5`
    - `@nuxt/ui-pro` is unified into `@nuxt/ui` in v4 — a separate
      `@nuxt/ui-pro` dependency must be removed

11. **Pro Component Adoption** // turbo
    - Run
      `grep -rnl 'PageHero\|PageSection\|PageFeature\|PageCTA\|DashboardGroup\|DashboardSidebar\|PricingPlan\|AuthForm\|BlogPost' apps/ layers/ --include='*.vue' | grep -v 'node_modules' | head -15`
    - Nuxt UI v4 includes 110+ components including powerful Pro layout
      primitives (Dashboard*, Page*, Pricing*, Blog*, Auth\*). Landing pages
      should use `PageHero`, `PageSection`, `PageFeature`, `PageCTA`. Admin
      dashboards should use `DashboardGroup`, `DashboardSidebar`,
      `DashboardPanel`. Flag apps that build these patterns with custom divs.

**Scoring:** 10 = all checks pass. -1 for each: deprecated component name, old
prop syntax, legacy CSS import, wrong import order, legacy color tokens,
`@apply` with semantic classes, stale model modifiers, old utility paths,
unguarded refresh handler, stale ui-pro dependency, no Pro component adoption.

## 15. Accessibility (Target: 10/10)

Audit for WCAG AA compliance and keyboard/screen-reader usability.

1. **Image alt text** // turbo
   - Run
     `grep -rn '<img\|<NuxtImg\|<NuxtPicture' apps/ layers/ --include='*.vue' | grep -v 'node_modules\|alt=' | head -15`
   - Every `<img>`, `<NuxtImg>`, and `<NuxtPicture>` must have an `alt`
     attribute (empty `alt=""` for decorative)

2. **Interactive element labels** // turbo
   - Run
     `grep -rn '<button\|<UButton\|<a ' apps/ layers/ --include='*.vue' | grep -v 'node_modules\|aria-label\|aria-describedby' | grep 'icon\|:icon' | head -15`
   - Icon-only buttons/links must have `aria-label` or visually-hidden text
   - Form inputs must be associated with `<label>` or `aria-label`

3. **Heading hierarchy** // turbo
   - Run
     `grep -rn '<h1' apps/ layers/ --include='*.vue' | grep -v 'node_modules' | head -15`
   - Each page should have exactly one `<h1>`, no skipped heading levels (h1→h3
     with no h2)

4. **Keyboard navigation**
   - Interactive modals/dropdowns must trap focus and respond to Escape
   - Skip-to-content link should exist in the main layout // turbo
   - Run
     `grep -rn 'skip-to\|skipnav\|skip-nav\|tabindex' layers/ apps/ --include='*.vue' | grep -v 'node_modules' | head -10`

5. **Color contrast**
   - `text-muted` class must maintain 4.5:1 contrast ratio against backgrounds
   - Error/success states should not communicate via color alone (add icons) //
     turbo
   - Run
     `grep -rn 'text-muted' layers/ apps/ --include='*.vue' | grep -v 'node_modules' | wc -l`

6. **ARIA roles on custom widgets** // turbo
   - Run
     `grep -rn 'role=\|aria-' apps/ layers/ --include='*.vue' | grep -v 'node_modules\|aria-hidden' | head -15`
   - Custom interactive widgets (tabs, accordions, carousels) need proper
     `role`, `aria-expanded`, `aria-selected`

**Scoring:** 10 = all checks pass. -1 for each: missing alt text, unlabeled icon
buttons, broken heading hierarchy, no skip link, questionable contrast, missing
ARIA roles.

---

## 16. Performance & Bundle Optimization (Target: 10/10)

Audit for fast cold starts, minimal bundle size, and optimized asset delivery.

1. **Unused dependencies** // turbo
   - Run
     `npx depcheck layers/narduk-nuxt-layer --ignores='@types/*,@cloudflare/*,@narduk/*,@tailwindcss/*,eslint,prettier,typescript,vue-tsc,wrangler,drizzle-kit,nuxt,postcss' 2>/dev/null | head -20`
   - Installed packages that are never imported add to install time and lockfile
     size

2. **Lazy-loaded components** // turbo
   - Run
     `grep -rn 'defineAsyncComponent\|<Lazy' apps/ layers/ --include='*.vue' --include='*.ts' | grep -v 'node_modules' | head -10`
   - Heavy components (modals, charts, maps) should use `<LazyXxx>` or
     `defineAsyncComponent`

3. **Image optimization** // turbo
   - Run
     `grep -rn '<img ' apps/ layers/ --include='*.vue' | grep -v 'node_modules\|NuxtImg\|NuxtPicture' | head -15`
   - Raw `<img>` tags bypass Cloudflare image optimization — use `<NuxtImg>` or
     `<NuxtPicture>` instead

4. **Font loading strategy** // turbo
   - Run
     `grep -rn 'fonts\|@nuxt/fonts' layers/narduk-nuxt-layer/nuxt.config.ts | head -5`
   - Must use `@nuxt/fonts` (automatic optimization) — no manual `@import url()`
     in CSS
   - Verify the CSS comment confirms this:
     `/* Fonts are handled by @nuxt/fonts */`

5. **Bundle analysis capability**
   - Check for `analyze` script or `vite-plugin-inspect` for debugging bundle
     issues // turbo
   - Run
     `grep -rn 'analyze\|vite-plugin-inspect' apps/ layers/ --include='package.json' --include='nuxt.config.ts' | grep -v 'node_modules' | head -5`

6. **Large dependency audit** // turbo
   - Run
     `grep -rn 'lodash\|moment\|dayjs\|axios' apps/ layers/ --include='package.json' | grep -v 'node_modules' | head -10`
   - `lodash` (use native JS), `moment` (use Intl), `axios` (use `$fetch`) are
     unnecessary in modern Nuxt

**Scoring:** 10 = all checks pass. -1 for each: unused deps, raw `<img>` tags,
no @nuxt/fonts, manual font imports, large unnecessary dependencies, no
lazy-loading.

---

## 17. Error Handling & Resilience (Target: 10/10)

Audit for graceful failure modes, consistent error shapes, and user-facing error
pages.

1. **Global error page** // turbo
   - Run
     `find layers/ apps/ -name 'error.vue' -not -path '*/node_modules/*' | head -10`
   - `error.vue` must exist and handle both 404 and 500 gracefully
   - Must render a user-friendly page (not raw JSON or a blank screen)

2. **API error consistency** // turbo
   - Run
     `grep -rn 'createError(' apps/ layers/ --include='*.ts' -l | grep -v 'node_modules\|.test.' | head -15`
   - All API routes must use `createError({ statusCode, message })` — no raw
     `throw new Error()` // turbo
   - Run
     `grep -rn 'throw new Error' apps/ layers/ --include='*.ts' | grep -v 'node_modules\|.test.\|.spec.\|utils/\|middleware/' | head -10`
   - API routes should NOT use `throw new Error()` (loses statusCode)

3. **Frontend error states** // turbo
   - Run
     `grep -rn 'error\.' apps/ layers/ --include='*.vue' | grep -v 'node_modules\|error.vue\|console.error\|.d.ts' | head -15`
   - Pages using `useAsyncData` should destructure and handle `{ error }` in
     templates
   - Display user-friendly messages, not raw error objects

4. **Unhandled rejections in API routes** // turbo
   - Run
     `grep -rn 'async.*defineEventHandler' apps/ layers/ --include='*.ts' | grep -v 'node_modules\|middleware' | head -15`
   - API routes with async handlers should have explicit error handling or rely
     on H3's built-in catch
   - Check for routes doing multiple DB operations without try/catch

5. **D1 unavailability fallback**
   - `useDatabase()` must throw a descriptive 500 error when D1 is not bound
   - API routes should not crash with cryptic errors when DB is missing

**Scoring:** 10 = all checks pass. -1 for each: missing error.vue, raw
`throw new Error()` in API routes, no error state handling in templates, unclear
D1 error messages.

---

## 18. Dependency Hygiene (Target: 10/10)

Audit for up-to-date, secure, and minimal dependency tree.

1. **Known vulnerabilities** // turbo
   - Run `pnpm audit --audit-level moderate 2>&1 | tail -5`
   - There should be zero high/critical vulnerabilities

2. **Peer dependency warnings** // turbo
   - Run `pnpm install --frozen-lockfile 2>&1 | grep 'unmet peer' | wc -l`
   - Unmet peer dependencies cause runtime inconsistencies — aim for zero

3. **Duplicate packages** // turbo
   - Run `pnpm dedupe --check 2>&1 | tail -5`
   - Duplicate versions of the same package inflate bundle size

4. **Version consistency across workspace** // turbo
   - Run
     `grep -rn '"nuxt":' apps/ layers/ --include='package.json' | grep -v 'node_modules' | head -10`
   - Core shared deps (nuxt, @nuxt/ui, tailwindcss) should be the same version
     across all workspace members

5. **Lockfile freshness** // turbo
   - Run `git diff --name-only HEAD~5 -- pnpm-lock.yaml | wc -l`
   - Lockfile should be updated regularly (at least within last 5 commits if
     deps changed)

6. **No floating versions for critical deps** // turbo
   - Run
     `grep -rn '"@nuxt/ui":\|"nuxt":\|"tailwindcss":' apps/ layers/ --include='package.json' | grep -v 'node_modules' | head -15`
   - Critical framework dependencies should use exact or tilde versions, not `*`
     or `latest`

**Scoring:** 10 = all checks pass. -1 for each: critical vulnerability, 5+ unmet
peers, duplicate deps, version inconsistency, floating critical dep.

---

## 19. Type Safety Depth (Target: 10/10)

Audit for strict TypeScript usage beyond the linter — catching real type holes.

1. **Strict mode** // turbo
   - Run
     `grep -rn '"strict"' apps/ layers/ --include='tsconfig.json' | grep -v 'node_modules' | head -10`
   - All `tsconfig.json` files should have `"strict": true` (Nuxt 4 sets this by
     default)

2. **Suppression comments** // turbo
   - Run
     `grep -rn '@ts-ignore\|@ts-expect-error\|@ts-nocheck' apps/ layers/ --include='*.ts' --include='*.vue' | grep -v 'node_modules\|.d.ts' | head -15`
   - Each `@ts-ignore` / `@ts-expect-error` must have an explanatory comment
   - `@ts-nocheck` should never be used in production code

3. **Type assertions** // turbo
   - Run
     `grep -rn ' as ' apps/ layers/ --include='*.ts' --include='*.vue' | grep -v 'node_modules\|.d.ts\|.test.\|.spec.\|import ' | head -20`
   - Excessive `as` assertions indicate type holes — prefer type narrowing or
     generics
   - Flag `as any` specifically

4. **Untyped API responses** // turbo
   - Run
     `grep -rn 'useFetch\|useAsyncData' apps/ layers/ --include='*.vue' --include='*.ts' | grep -v 'node_modules\|.test.' | head -15`
   - `useFetch<T>()` and `useAsyncData<T>()` should have explicit type
     parameters when the API doesn't auto-infer

5. **Zod validation on API inputs** // turbo
   - Run
     `grep -rn 'readBody\|getQuery\|getRouterParam' apps/ layers/ --include='*.ts' | grep -v 'node_modules\|.test.' | head -15`
   - All `readBody()`, `getQuery()`, and `getRouterParam()` calls should be
     validated with Zod // turbo
   - Run
     `grep -rn 'z\.object\|z\.string\|z\.number' apps/ layers/ --include='*.ts' | grep -v 'node_modules\|.test.' | head -15`
   - Compare: routes reading user input should have a corresponding Zod parse

6. **No `any` in function signatures** // turbo
   - Run
     `grep -rn ': any\b\|: any,' apps/ layers/ --include='*.ts' | grep -v 'node_modules\|.d.ts\|.test.\|.spec.\|eslint' | head -15`
   - Function parameters and return types should avoid explicit `any`

**Scoring:** 10 = all checks pass. -1 for each: non-strict tsconfig, uncommented
@ts-ignore, `as any` cast, untyped useFetch, unvalidated readBody, `any` in
function signatures.

---

## Audit Report Format

Compile the final report as a markdown artifact with this structure:

```markdown
# 🏗️ Repository Architecture Scorecard

**Date:** [date] **Overall Score:** [X.X / 10]

## 📊 Category Scores

| Category           | Score | Grade | Key Finding |
| ------------------ | ----- | ----- | ----------- |
| Monorepo Structure | X/10  | A/B/C | ...         |
| ...                |       |       |             |

## 🔍 Detailed Findings

### [Category Name] — X/10

- ✅ [What's correct]
- ❌ [What's wrong] → **Recommendation:** [fix]

## 🎯 Priority Fix List

1. [Most impactful fix first]
2. ...
```

**Grading Scale:**

- **A** (9-10): Excellent, minimal issues
- **B** (7-8): Good, some gaps
- **C** (5-6): Needs work
- **D** (3-4): Significant issues
- **F** (1-2): Missing entirely
