<div align="center">
  <h1>✨ Nuxt 4 + Nuxt UI 4 Edge Template ✨</h1>
  <p><strong>A minimal, production-ready starter template designed for maximum performance on Cloudflare Workers.</strong></p>
</div>

<br />

Built exclusively for the edge. This template combines the power of **Nuxt 4**, the aesthetics of **Nuxt UI 4 (Tailwind CSS 4)**, and the global low-latency of **Cloudflare Workers** with **D1 SQLite databases**.

Skip the configuration boilerplate. Clone, deploy, and focus on building your product.

> **Looking for examples?** Check out the companion repo **[`nuxt-v4-template-examples`](https://github.com/loganrenz/nuxt-v4-template-examples)** for full-featured implementations of auth, analytics, blog, dashboard layouts, and more.

---

## 🚀 Features

- ⚡️ **Nuxt 4** — Configured for the future with `compatibilityVersion: 4` and the new `app/` structure.
- 🎨 **Nuxt UI 4** — Gorgeous, accessible UI components with built-in dark mode and Tailwind CSS 4 (`@theme`).
- 🦾 **TypeScript** — Full end-to-end type safety out of the box.
- 🌐 **Cloudflare Workers** — True edge deployment running on V8 isolates (no Node.js cold starts).
- 🗄️ **Cloudflare D1** — Edge SQLite database integrated seamlessly with **Drizzle ORM**.
- 🔍 **Advanced SEO System** — Powered by `@nuxtjs/seo`: auto sitemap, robots.txt, Schema.org structured data, dynamic OG images, and `useSeo()` / `useSchemaOrg()` composables.
- 📊 **Analytics-Ready** — PostHog and GA4 client plugins wired up; just add your keys via Doppler.
- 🛡️ **Hardened Security** — Built-in CSRF protection and per-isolate IP rate limiting.
- 🚦 **Health Checks & Error Handling** — Branded global error pages (404/500) and `/api/health` endpoint.

---

## ⚠️ IMPORTANT: This is a Template Repository

> **DO NOT push changes back to `loganrenz/nuxt-v4-template`.** This repository is a read-only template. Always create your own copy first.

---

## 💻 Quick Start

### Option A: Use as GitHub Template (Recommended)

```bash
gh repo create my-new-project --template loganrenz/nuxt-v4-template --private --clone
cd my-new-project
pnpm install
```

### Option B: Clone and Re-point

```bash
git clone https://github.com/loganrenz/nuxt-v4-template.git my-new-project
cd my-new-project
gh repo create my-new-project --private --source=. --remote=origin --push
pnpm install
```

> **Verify:** `git remote -v` must NOT point to `loganrenz/nuxt-v4-template`.

### Local Development

```bash
# Option 1: With Doppler (recommended — injects secrets)
doppler run -- pnpm run dev

# Option 2: Without secrets (analytics will no-op)
pnpm run dev
```

---

## 🔑 Secrets Management (Doppler)

This template uses **Doppler** as the single source of truth for all secrets and environment variables. **No `.env` files.**

```bash
doppler projects create <app-name>
doppler setup
doppler run -- pnpm run dev
```

All `runtimeConfig` keys in `nuxt.config.ts` auto-map from Doppler via the `NUXT_` prefix convention.

---

## ☁️ Deployment (Cloudflare Workers)

### 1. Provision D1 Database

```bash
pnpm wrangler d1 create <app-name>-db
```

Paste the `database_id` into `wrangler.json`.

### 2. Apply Migrations

```bash
pnpm wrangler d1 execute <app-name>-db --remote --file=drizzle/0000_initial_schema.sql
```

### 3. Deploy

```bash
pnpm run deploy
```

---

## 🧩 Project Structure

```text
app/
  app.vue              # Main application shell
  app.config.ts        # Nuxt UI color tokens
  error.vue            # Full-page error handler
  components/
    OgImage/           # OG image templates (Satori)
  composables/         # useSeo, useSchemaOrg
  layouts/             # Page layouts (landing)
  middleware/          # Route guards (add as needed)
  plugins/             # PostHog, GA4, CSRF fetch interceptor
  pages/               # File-based routing
  types/               # Shared TypeScript interfaces
  assets/css/main.css  # Tailwind CSS 4 @theme tokens
server/
  api/                 # health check, IndexNow
  database/            # Drizzle schema definitions
  middleware/          # CSRF, D1 injection
  routes/              # IndexNow key verification
  utils/               # database, KV, R2, rate limiting
drizzle/               # SQL migration files
scripts/               # Utility scripts
```

---

## 🎨 Design Customization

```ts
// app/app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald', // blue, violet, rose, amber...
      neutral: 'slate', // zinc, gray, stone...
    },
  },
});
```

---

## 🤖 AI Agent Instructions

See **[AGENTS.md](./AGENTS.md)** for complete agent instructions, including:

- Hard constraints for Cloudflare Workers compatibility
- Nuxt UI 4 rules and gotchas
- **Recipes** — step-by-step guides for adding testing, auth, analytics, content, linting, and UI components
- Quality audit workflows (`/check-nuxt-ui-v4`, `/check-nuxt-ssr`, etc.)

---

## 📖 Examples Repository

For full-featured reference implementations, see **[`loganrenz/nuxt-v4-template-examples`](https://github.com/loganrenz/nuxt-v4-template-examples)**:

- 🔒 Authentication (Web Crypto PBKDF2 + D1 sessions)
- 📊 Analytics (PostHog + GA4 + GSC + IndexNow setup automation)
- 📝 Blog (Nuxt Content v3 with MDC rendering)
- 🎨 UI Components (Hero, Pricing, Testimonials, Contact Forms)
- 🏗️ Layouts (Blog, Dashboard with sidebar)
- 🧪 Tests (Vitest unit + Playwright E2E)
