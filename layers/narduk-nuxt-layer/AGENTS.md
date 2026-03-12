# AGENTS.md — AI Agent Instructions

> **🚨 CRITICAL: THIS IS A NUXT LAYER 🚨**
>
> You are working inside **`narduk-enterprises/narduk-nuxt-layer`**. This is NOT
> an application that gets deployed to production directly. This is a shared
> library/layer that downstream applications extend using
> `extends: ['@narduk-enterprises/narduk-nuxt-template-layer']` in their
> `nuxt.config.ts`.
>
> **When to edit files here:**
>
> - When you are creating a generic, reusable component that should be available
>   to ALL Narduk applications.
> - When you are updating core ESLint toolings, base Nitro API endpoints, or
>   database schema primitives.
>
> **When NOT to edit files here:**
>
> - If you are building a feature specific to one app, you must make that change
>   in the downstream app, NOT here.

This layer provides a **minimal Nuxt 4 + Nuxt UI 4** foundation deployed to
**Cloudflare Workers** with **D1 SQLite** (Drizzle ORM).

## Project Structure

```
app/                  # All frontend code (Nuxt 4 convention)
  components/         # Vue components (thin — delegate logic to composables)
    OgImage/          # Dynamic OG image templates (Satori)
  composables/        # Business logic + SEO helpers (useSeo, useSchemaOrg)
  pages/              # File-based routing
  layouts/            # Page layouts (app.vue provides default shell)
  middleware/         # Route guards (empty — add as needed)
  plugins/            # Client plugins (PostHog, GA4, CSRF fetch interceptor)
  types/              # Shared TypeScript interfaces
  assets/css/main.css # Tailwind CSS 4 @theme tokens
public/               # Default static assets (override by placing files in app's public/)
  favicon.svg         # SVG favicon (source for generation)
  apple-touch-icon.png # 180×180 PNG (required by Safari/iOS)
  favicon-32x32.png   # 32×32 PNG favicon
  favicon-16x16.png   # 16×16 PNG favicon
  favicon.ico         # ICO fallback
  site.webmanifest    # Web app manifest with icon references
  app.config.ts       # Nuxt UI color tokens (primary/neutral)
server/
  api/                # Nitro endpoints (health check, IndexNow)
  database/           # Drizzle schema definitions
  middleware/         # CSRF protection, D1 injection
  routes/             # Dynamic routes (IndexNow key verification)
  utils/              # Cloudflare bindings (database, KV, R2, rate limiting)
drizzle/              # SQL migration files
scripts/              # Utility scripts (favicon generation)
.agents/workflows/    # Antigravity audit workflows (run via /slash-commands)
```

## Hard Constraints (Cloudflare Workers)

- **NO Node.js modules** — no `fs`, `path`, `crypto`, `bcrypt`, `child_process`
- **Use Web Crypto API** — `crypto.subtle` for all hashing (PBKDF2)
- **Nitro preset** is `cloudflare-module` (ES Module format, V8 isolates)
- **Drizzle ORM only** — no Prisma or other Node-dependent ORMs
- All server code must be stateless across requests (edge isolate model)

## Nuxt UI 4 Rules

- `UDivider` → renamed to **`USeparator`** in v4
- Icons use `i-` prefix: `i-lucide-home`, not `name="heroicons-..."`
- Use design token colors (`primary`, `neutral`) not arbitrary color strings
- Tailwind CSS 4 — configure via `@theme` in `main.css`, not `tailwind.config`
- **Input Sizing**: In Nuxt UI 4, input components like `<UTextarea>` and
  `<UInput>` do not take 100% of their container's width by default. Always
  apply `class="w-full"` to inputs unless explicitly designing a narrow inline
  field.

## SEO (Required on Every Page)

Every page **must** call both:

```ts
useSeo({
  title: '...',
  description: '...',
  ogImage: { title: '...', description: '...', icon: '🎯' },
})
useWebPageSchema({ name: '...', description: '...' }) // or useArticleSchema, useProductSchema, etc.
```

Sitemap and robots.txt are automatic. OG image templates live in
`app/components/OgImage/`.

## Architecture Patterns

- **Thin Components, Thick Composables** — components subscribe to composables,
  pass props down, emit events up. No inline fetch or complex logic in
  templates.
- **SSR-safe state** — use `useState()` or Pinia stores. Never use bare `ref()`
  at module scope (causes cross-request leaks).
- **Data fetching** — always use `useAsyncData` or `useFetch`, never raw
  `$fetch` in `<script setup>`.
- **Client-only code** — wrap `window`/`document` access in `onMounted` or
  `<ClientOnly>`.

## Integrating this Layer into a New Project

If you are an agent tasked with adding this layer to a new or existing Nuxt
application, run the `/migrate-to-monorepo` workflow.

Do **NOT** clone `narduk-nuxt-layer` directly to start a project. Start with
`narduk-nuxt-template` instead.

## Quality Audit Workflows

Run these during development (Antigravity slash-commands):

| Workflow                      | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `/audit-repo-hygiene`         | Full sweep for secrets, junk files, duplicated code            |
| `/audit-template-compliance`  | Comprehensive Nuxt 4 + Nuxt UI 4 layer template audit          |
| `/check-architecture`         | Thin Components, Thick Composables, Thin Stores separation     |
| `/check-data-fetching`        | Catches waterfalls, raw $fetch, and N+1 queries                |
| `/check-layer-health`         | Layer inheritance, shadowed files, config drift, overrides     |
| `/check-plugin-lifecycle`     | Plugin naming, lifecycle safety, and analytics patterns        |
| `/check-seo-compliance`       | Audits pages for useSeo, Schema.org, and OG images             |
| `/check-ssr-hydration-safety` | SSR safety, window access, isHydrated, ClientOnly, DOM nesting |
| `/check-ui-styling`           | Tailwind v4 CSS import order, token usage, Nuxt UI v4          |
| `/migrate-to-monorepo`        | Migration workflow to convert legacy apps to this monorepo     |
| `/review-cloudflare-layer`    | Full review of Nuxt layer + Cloudflare Workers setup           |
| `/review-doppler-pattern`     | Audit Doppler secret management for completeness and security  |
| `/score-repo`                 | Full repo audit — scores 19 categories out of 10               |

## ESLint Plugins (Automated Enforcement)

These workspace-local ESLint plugins enforce patterns at lint time. Run
`pnpm run build:plugins` after cloning to build the TypeScript plugins.

| Plugin                                      | Rules | What It Enforces                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint-plugin-nuxt-ui`                     | 8     | Nuxt UI v4 props, slots, events, variants, deprecated components (UDivider→USeparator), deprecated API usage                                                                                                                                                                                                                    |
| `eslint-plugin-nuxt-guardrails`             | 16    | SSR DOM access, legacy head/fetch, no raw `$fetch`, `import.meta.client`/`import.meta.dev`, `useAsyncData`/`useFetch`; **SEO:** require useSeo/Schema on pages, prefer useSeo over bare useHead; **server:** no `.map(async)` (N+1); **stores:** useAppFetch, no Map/Set state, plugin `.client.ts` for browser APIs            |
| `eslint-plugin-atx`                         | 30    | Design system: UButton/ULink, no inline hex, Lucide icons, no Tailwind v3 deprecated (fixable), no invalid Nuxt UI tokens, Zod validation; **hydration:** ClientOnly for USwitch/UNavigationMenu/UColorMode\*; no @apply in scoped style; **architecture:** no module-scope ref in composables/utils, no inline types in stores |
| `eslint-plugin-vue-official-best-practices` | 13    | Composition API, Pinia patterns, typed defineProps, `use` prefix                                                                                                                                                                                                                                                                |

**Build:** `pnpm run build:plugins` (ATX plugin is plain `.mjs` — no build
needed).

## Layer nuxt.config Defaults

The following settings are provided by this layer's `nuxt.config.ts`. Downstream
apps **inherit these automatically** and do not need to repeat them:

| Setting                        | Value                                                                   |
| ------------------------------ | ----------------------------------------------------------------------- |
| `modules`                      | `@nuxt/ui`, `@nuxt/fonts`, `@nuxt/image`, `@nuxtjs/seo`, `@nuxt/eslint` |
| `nitro.preset`                 | `cloudflare-module`                                                     |
| `nitro.esbuild.options.target` | `esnext`                                                                |
| `nitro.externals.inline`       | `['drizzle-orm']`                                                       |
| `future.compatibilityVersion`  | `4`                                                                     |
| `ui.colorMode`                 | `true`                                                                  |
| `colorMode.preference`         | `system`                                                                |
| `ogImage.defaults.component`   | `OgImageDefaultTakumi`                                                  |
| `image.provider`               | `cloudflare`                                                            |
| `app.head.link`                | Favicon SVG, PNG 32/16, apple-touch-icon, site.webmanifest              |
| `css`                          | Layer's `app/assets/css/main.css`                                       |

## Files Provided by This Layer (DO NOT Duplicate)

**App files** (auto-inherited by consuming apps):

- `app/app.vue` — `<UApp>` shell with `<NuxtLayout>` + `<NuxtPage>`
- `app/app.config.ts` — Nuxt UI color tokens (primary/neutral)
- `app/error.vue` — Branded error page (404/500)
- `app/assets/css/main.css` — Tailwind v4 `@theme` tokens, glass/card utility
  classes
- `app/composables/useSeo.ts`, `useSchemaOrg.ts`
- `app/plugins/gtag.client.ts`, `posthog.client.ts`, `fetch.client.ts`
- `app/types/api.ts`, `runtime-config.d.ts`

**Public assets** (default favicons — apps override by placing their own in
`public/`):

- `public/favicon.svg`, `apple-touch-icon.png`, `favicon-32x32.png`,
  `favicon-16x16.png`, `favicon.ico`, `site.webmanifest`

**Server files:**

- `server/middleware/` — cors, csrf, d1, indexnow, securityHeaders
- `server/utils/` — auth, database, google, kv, r2, rateLimit
- `server/api/` — health.get, indexnow/submit.post, admin/indexing/\*
  (batch.post, publish.post, status.get), admin/ga/overview.get,
  admin/gsc/performance.get
- `server/database/schema.ts` — Base Drizzle schema
- `server/routes/cdn-cgi/image/[...path].ts` — Image transform proxy

---

# 📖 Application Recipes

The opt-in feature recipes (Auth, Analytics, Content, Testing, UI Components,
Forms) are application-level concerns.

For full instructions on how to implement them, please refer to the
**[Workspace Root AGENTS.md](../../AGENTS.md)**.
