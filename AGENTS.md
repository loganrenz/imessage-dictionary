# AGENTS.md — AI Agent Instructions

> **🚨 CRITICAL: DO NOT PUSH TO `loganrenz/nuxt-v4-template` 🚨**
>
> This is a **read-only template repository**. Before writing ANY code, you MUST create your own repo:
>
> ```bash
> gh repo create <project-name> --template loganrenz/nuxt-v4-template --private --clone
> cd <project-name>
> pnpm install
> ```
>
> **Verify your remote** with `git remote -v` — it must NOT point to `loganrenz/nuxt-v4-template`.

This is a **minimal Nuxt 4 + Nuxt UI 4** boilerplate deployed to **Cloudflare Workers** with **D1 SQLite** (Drizzle ORM).

For full-featured example implementations (auth, analytics, blog, dashboard, forms, etc.), see the companion repo: **[`loganrenz/nuxt-v4-template-examples`](https://github.com/loganrenz/nuxt-v4-template-examples)**.

## Project Structure

```
app/                  # All frontend code (Nuxt 4 convention)
  components/         # Vue components (thin — delegate logic to composables)
    OgImage/          # Dynamic OG image templates (Satori)
  composables/        # Business logic + SEO helpers (useSeo, useSchemaOrg)
  pages/              # File-based routing
  layouts/            # Page layouts (default: landing)
  middleware/         # Route guards (empty — add as needed)
  plugins/            # Client plugins (PostHog, GA4, CSRF fetch interceptor)
  types/              # Shared TypeScript interfaces
  assets/css/main.css # Tailwind CSS 4 @theme tokens
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

## SEO (Required on Every Page)

Every page **must** call both:

```ts
useSeo({
  title: '...',
  description: '...',
  ogImage: { title: '...', description: '...', icon: '🎯' },
});
useWebPageSchema({ name: '...', description: '...' }); // or useArticleSchema, useProductSchema, etc.
```

Sitemap and robots.txt are automatic. OG image templates live in `app/components/OgImage/`.

## Architecture Patterns

- **Thin Components, Thick Composables** — components subscribe to composables, pass props down, emit events up. No inline fetch or complex logic in templates.
- **SSR-safe state** — use `useState()` or Pinia stores. Never use bare `ref()` at module scope (causes cross-request leaks).
- **Data fetching** — always use `useAsyncData` or `useFetch`, never raw `$fetch` in `<script setup>`.
- **Client-only code** — wrap `window`/`document` access in `onMounted` or `<ClientOnly>`.

## Starting a New Project from This Template

1. Install dependencies: `pnpm install`
2. **Change `name` in `package.json`** away from `"nuxt-v4-template"`.
3. Remove the git origin: `git remote remove origin`
4. Update `nuxt.config.ts` `site` block with your domain and site name.
5. Set up secrets in **Doppler** (see Secrets recipe below).
6. Run `pnpm run dev` to start building.

## 🚨 CRITICAL RULE: NEVER COMMIT TO THIS REPOSITORY 🚨

If you are an agent building a new project inside a clone of this repository, **DO NOT COMMIT OR PUSH** directly back to `loganrenz/nuxt-v4-template`. Verify the user has set up a new remote origin first.

## Quality Audit Workflows

Run these during development (Antigravity slash-commands):

| Workflow                  | Purpose                                             |
| ------------------------- | --------------------------------------------------- |
| `/check-nuxt-ui-v4`       | Validates UI 4 component usage                      |
| `/check-nuxt-ssr`         | Validates SSR-safe data fetching and hydration      |
| `/check-store-separation` | Validates thin component / thick composable pattern |
| `/check-nitro-edge`       | Validates Cloudflare Workers compatibility          |

---

# 📖 Recipes

These are opt-in feature recipes. Follow them when the project needs a specific capability. For working reference implementations of each, clone **[`loganrenz/nuxt-v4-template-examples`](https://github.com/loganrenz/nuxt-v4-template-examples)**.

---

## 🚀 Initialization Routine (New Projects)

**When:** You have just cloned this template to begin a new application.
**CRITICAL:** This must be your very first step before writing any code.

**Steps:**

1. Run the mass-replacer script from the root directory:
   ```bash
   npm run init -- --name="your-app-name" --display="Your Display Name" --url="https://yoururl.com"
   ```
   _(This will rename the project, create the Cloudflare D1 database, spin up the Doppler project, rewrite `wrangler.json`, and then self-destruct.)_
2. Configure your Doppler secrets (see Secrets & Env below).
3. Pull Doppler secrets and initialize the local database schema:
   ```bash
   doppler setup && npm run db:migrate
   ```
4. Commit the initialization.

---

## 🔑 Recipe: Secrets & Environment (Doppler)

**When:** Always. This is the standard for all projects.

**Principle:** Doppler is the single source of truth for all secrets and environment variables. **Never** create `.env` or `.env.example` files. Never commit secrets.

**Steps:**

1. Create a Doppler project: `doppler projects create <app-name>`
2. Wire Doppler into your dev workflow:
   ```bash
   doppler setup           # Select project + config
   doppler run -- npm run dev  # Injects env vars at runtime
   ```
3. In `nuxt.config.ts`, declare all secrets in `runtimeConfig`:
   ```ts
   runtimeConfig: {
     secretKey: '',        // Server-only — reads from NUXT_SECRET_KEY
     public: {
       appUrl: '',         // Client-safe — reads from NUXT_PUBLIC_APP_URL
     },
   }
   ```
4. Doppler env var names map to Nuxt's `NUXT_` prefix convention automatically.

### Enterprise Hub-and-Spoke Architecture

All template derivatives should utilize **Doppler Cross-Project Secret Referencing** to avoid duplicating sensitive keys. Do not copy/paste keys manually.

1. **`narduk-enterprise-apps` Hub**: This project holds infrastructure deploy credentials (e.g., `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`).
2. **`narduk-analytics` Hub**: This project holds central management keys for generating analytics (e.g., `POSTHOG_PERSONAL_API_KEY`, `GA_ACCOUNT_ID`).
3. **App Spoke (`<app-name>`)**: This is your new app's isolated project. Inherit the deploy credentials from the Hub using Doppler references:
   - `CLOUDFLARE_API_TOKEN` = `${narduk-enterprise-apps.prd.CLOUDFLARE_API_TOKEN}`
   - `CLOUDFLARE_ACCOUNT_ID` = `${narduk-enterprise-apps.prd.CLOUDFLARE_ACCOUNT_ID}`

**Reference:** See `nuxt-v4-template-examples/nuxt.config.ts` for the full runtimeConfig block and `nuxt-v4-template-examples/AGENT_ANALYTICS.md` for automation script details.

---

## 🧪 Recipe: Testing (Vitest + Playwright)

**When:** You need unit tests for composables or E2E tests for user flows.

**Steps:**

1. Install dependencies:

   ```bash
   npm install -D vitest @nuxt/test-utils happy-dom playwright @playwright/test
   npx playwright install chromium
   ```

2. Create `vitest.config.ts`:

   ```ts
   import { defineVitestConfig } from '@nuxt/test-utils/config';
   export default defineVitestConfig({});
   ```

3. Create `playwright.config.ts`:

   ```ts
   import { defineConfig, devices } from '@playwright/test';
   export default defineConfig({
     testDir: './tests/e2e',
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     reporter: 'html',
     use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
     webServer: {
       command: 'npx nuxi dev --port 3000',
       url: 'http://localhost:3000',
       reuseExistingServer: !process.env.CI,
       timeout: 120_000,
     },
     projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
   });
   ```

4. Add npm scripts to `package.json`:

   ```json
   "test:unit": "vitest run",
   "test:e2e": "playwright test"
   ```

5. Place unit tests in `tests/composables/`, E2E tests in `tests/e2e/`.

**Reference:** See `nuxt-v4-template-examples/tests/` for example test files.

---

## 🔒 Recipe: Authentication (Web Crypto + D1 Sessions)

**When:** Your app needs user accounts, login, and protected routes.

**Steps:**

1. Add auth tables to `server/database/schema.ts` (users + sessions tables with Drizzle).
2. Create `server/utils/auth.ts` — PBKDF2 password hashing using `crypto.subtle` (NOT bcrypt).
3. Create API routes: `server/api/auth/login.post.ts`, `register.post.ts`, `logout.post.ts`, `me.get.ts`.
4. Create `app/composables/useAuth.ts` — reactive auth state backed by `useState()`.
5. Create `app/middleware/auth.ts` — route guard that redirects unauthenticated users.

**Key constraint:** All crypto MUST use Web Crypto API (`crypto.subtle.deriveKey` with PBKDF2). Node.js `crypto` and `bcrypt` are forbidden on Cloudflare Workers.

**Reference:** See `nuxt-v4-template-examples/server/utils/auth.ts` and `nuxt-v4-template-examples/app/composables/useAuth.ts`.

---

## � Recipe: Analytics (PostHog + GA4 + GSC + IndexNow)

**When:** You need product analytics, web analytics, and search engine integration.

**Steps:**

1. **PostHog:** Already wired — `app/plugins/posthog.client.ts` reads `POSTHOG_PUBLIC_KEY` from runtimeConfig. Set the key via Doppler reference from `narduk-analytics` (no new project is created; apps differentiate via the `app` event property automatically injected by the plugin).
2. **GA4:** Already wired — `app/plugins/gtag.client.ts` reads `GA_MEASUREMENT_ID`. Set in Doppler.
3. **IndexNow:** Already wired — `server/routes/[key].txt.ts` + `server/api/indexnow/submit.post.ts`. Set `INDEXNOW_KEY` in Doppler.
4. **Google Search Console:** Use the setup automation in the examples repo.

All plugins **no-op gracefully** when their keys are empty — safe for dev without any Doppler config.

**Automated setup:** The examples repo includes `tools/setup-analytics.ts` which bootstraps GA4 and GSC via API.

**Doppler architecture:** Universal management keys live in the `narduk-analytics` Doppler project. Per-app keys go in the app's own Doppler project. You must reference the exact `POSTHOG_PUBLIC_KEY` and `POSTHOG_PROJECT_ID` from the analytics hub.

> **⚠️ WARNING: PostHog Workspaces**
> Do not create a separate project workspace inside PostHog for each new app unless specifically requested! The expected behavior is that ALL template apps log to the single "Narduk Analytics" master project in PostHog. The apps are differentiated using the `app:` property attached to every event by the client plugin.
> Ensure your Doppler environment references the `narduk-analytics` keys directly.

---

## 📝 Recipe: Content & Blog (Nuxt Content v3)

**When:** Your app needs a blog, documentation, or markdown-based content.

**Steps:**

1. `@nuxt/content` is already in the template. Create markdown files in `content/`.
2. Create a blog layout: `app/layouts/blog.vue` with sidebar + header chrome.
3. Create blog pages: `app/pages/blog/index.vue` (list) and `app/pages/blog/[slug].vue` (detail).
4. Query content with `queryCollection('content')` in `useAsyncData`.
5. Render with `<ContentRenderer :value="post" />`.

**Key gotcha:** On Cloudflare Workers, Nuxt Content auto-switches to D1 database storage. Make sure the `DB` binding is configured in `wrangler.json`.

**Reference:** See `nuxt-v4-template-examples/content/templates/blog/` and `nuxt-v4-template-examples/app/pages/templates/blog/`.

---

## 🎯 Recipe: Linting & Code Quality

**When:** Setting up ESLint for a new project.

**Steps:**

1. Install: `npm install -D @nuxt/eslint eslint`
2. Add to `nuxt.config.ts` modules: `'@nuxt/eslint'`
3. Create `eslint.config.mjs`:
   ```js
   import withNuxt from './.nuxt/eslint.config.mjs';
   export default withNuxt();
   ```
4. Add script: `"lint": "eslint ."` / `"lint:fix": "eslint . --fix"`

**Runtime audits:** Use the built-in `/check-*` workflows (see Quality Audit Workflows above) to validate Nuxt UI v4 compliance, SSR safety, store separation, and edge compatibility.

---

## 🎨 Recipe: UI Components (Landing Pages, Dashboards)

**When:** You need pre-built UI sections like heroes, pricing tables, testimonials, contact forms, or dashboard layouts.

**Steps:**

1. Browse the components in `nuxt-v4-template-examples/app/components/ui/` — includes `HeroSection`, `FeatureGrid`, `PricingTable`, `TestimonialCarousel`, `ContactForm`, `CTABanner`.
2. Browse layouts in `nuxt-v4-template-examples/app/layouts/` — includes `blog.vue`, `dashboard.vue`, `landing.vue`.
3. Copy what you need into your project's `app/components/` or `app/layouts/`.
4. Customize colors via `app/app.config.ts` and fonts via `app/assets/css/main.css`.

**Reference:** See `nuxt-v4-template-examples/app/components/ui/` for the full set.

---

## 🛠️ Recipe: Form Handling

**When:** You need validated forms with Zod and consistent styling.

**Steps:**

1. Use Nuxt UI's native `<UForm :schema :state>` with Zod validation.
2. Connect fields via `<UFormField name="...">`.
3. For consistent card chrome, create an `AppFormCard` wrapper component (see examples repo).
4. Use layout utility classes in `main.css`: `.form-section` (vertical gap), `.form-row` (2-col grid), `.form-actions` (button alignment).

**Reference:** See `nuxt-v4-template-examples/app/components/AppFormCard.vue` and `nuxt-v4-template-examples/app/composables/useFormHandler.ts`.
