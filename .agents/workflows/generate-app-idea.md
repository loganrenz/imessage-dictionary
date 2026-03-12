---
description:
  Generate an app idea suited for the stack and create an agent prompt to build
  it
---

This workflow helps you brainstorm app ideas that perfectly fit the template's
architecture (Nuxt 4, Cloudflare Workers, D1, Nuxt UI 4), bootstrap a new repo,
and generate a prompt for another agent to build the app while auditing the
template.

## Step 1: Brainstorm App Ideas

1. Consider what the `narduk-nuxt-template` provides:
   - **Full-stack SSR** (Nuxt 4 + Cloudflare Workers) — perfect for SEO-heavy
     content sites
   - **SQL database** (Cloudflare D1 via Drizzle ORM) — great for CRUD apps,
     dashboards, user-generated content
   - **Rich UI components** (Nuxt UI 4 with Pro components — Dashboard, Page,
     Pricing, Blog, Auth, Chat, Editor)
   - **Monorepo architecture** (apps + shared packages)
   - **Edge-first** — sub-50ms responses globally, ideal for tools people Google
     for

2. Generate **10** short, diverse app ideas. Each idea should be 1–2 sentences
   max. **You MUST include a mix of complexity levels and SEO potential:**

   **Include at least 2–3 "SEO magnets"** — simple, content-rich tools that
   target high-volume search queries people Google every day:
   - Calculators & converters (mortgage, BMI, unit, currency, tip, age, date
     diff, color, timezone)
   - Generators (password, QR code, lorem ipsum, UUID, regex, color palette,
     gradient, favicon, OG image)
   - Checkers & validators (DNS lookup, SSL checker, broken link finder, email
     validator, JSON formatter, contrast checker)
   - Reference & lookup tools (HTTP status codes, HTML entities, cron expression
     builder, chmod calculator, subnet calculator)
   - "What is my \_\_\_?" tools (IP address, screen resolution, browser, user
     agent, location)

   **Include at least 2–3 "full-stack complex" ideas** that exercise the entire
   stack (auth, D1, CRUD, real-time, dashboards):
   - SaaS dashboards & admin panels (invoice tracker, CRM, project board,
     analytics dashboard)
   - Multi-user collaborative tools (shared lists, kanban, polls, wikis, code
     snippet sharing)
   - Marketplace & directory platforms (job board, recipe collection, event
     calendar, resource directory)
   - Data-intensive apps (expense tracker with charts, habit tracker with
     streaks, workout logger with progress)
   - API-powered tools (weather dashboard, stock watchlist, news aggregator,
     social media scheduler)

   **Fill the remaining slots with mid-complexity ideas** from any category:
   - Productivity & planning (pomodoro timer, bookmark manager, reading list,
     meal planner)
   - Creative & media (meme maker, image compressor, markdown editor, font
     previewer)
   - Education & learning (flashcards, quiz builder, typing speed test, language
     vocab trainer)
   - Community & social (forum, link aggregator, review board, anonymous
     feedback wall)
   - Personal tools (journal, budget tracker, countdown timer, wishlist manager)
   - Niche verticals (pet tracker, plant care log, D&D character sheet, recipe
     scaler, wine cellar)
   - Games & entertainment (trivia, word puzzle, daily challenge, leaderboard
     app)

3. For each idea, tag it with a complexity indicator:
   - 🟢 **Simple** — 1–3 pages, minimal/no D1, high SEO value, can be built in
     one session
   - 🟡 **Medium** — 3–6 pages, some D1 tables, moderate features
   - 🔴 **Complex** — full dashboard/auth/CRUD, multiple D1 tables, rich
     interactions

4. Present all 10 to the user and let them pick (or remix).

## Step 2: Provision via Control Plane API

Once the user selects an app idea, **you** (the current agent) provision it via
the control plane:

// turbo-all

1. Call the control plane provision API:

   ```bash
   curl -X POST https://control-plane.nard.uk/api/fleet/provision \
     -H "Authorization: Bearer $PROVISION_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"name":"<app-name>","displayName":"<Display Name>","url":"https://<app-name>.nard.uk"}'
   ```

   This creates the GitHub repo, registers it in the fleet, and triggers the
   `provision-app.yml` GitHub Action which runs init.ts, analytics setup, and
   first deploy automatically.

2. Poll for completion:

   ```bash
   curl https://control-plane.nard.uk/api/fleet/provision/{provisionId}
   ```

   Wait until status is `complete` (typically ~5 minutes).

3. Clone the provisioned repo locally:

   ```bash
   git clone https://github.com/narduk-enterprises/<app-name>.git ~/new-code/<app-name>
   ```

4. Install dependencies:
   ```bash
   cd ~/new-code/<app-name> && pnpm install
   ```

**Setup, analytics, and first deploy have already been handled** by the
provision pipeline. The app is live with a "Coming Soon" page.

## Step 3: Generate the Build Prompt and Copy to Clipboard

Generate a single prompt for the user to paste into a new Antigravity window
opened at `~/new-code/<app-name>`. Copy it to the clipboard using `pbcopy`.

The prompt **must** contain three sections:

### Section 1: Project Verification

Since the app was provisioned via the control plane, setup has already been
completed. Instruct the agent to verify the infrastructure:

```
pnpm run validate
pnpm run db:migrate
pnpm --filter <app-name> run quality
```

Then instruct the agent to:

1. Read `AGENTS.md` and `tools/AGENTS.md`.

### Section 2: Build the App

Define the specific features:

- **Database Schema:** Tables, columns, and Drizzle models in
  `apps/web/server/database/schema.ts`.
- **API Routes:** Nitro/Worker endpoints, D1 interactions, validation logic.
- **Frontend UI:** Pages, components, design requirements using Nuxt UI 4 and
  the shared `narduk-nuxt-layer` design system.

**CRITICAL: Include these setup-saving instructions in Section 2:**

> ### Database Schema Extension Pattern
>
> When adding app-specific tables beyond the layer's base schema:
>
> 1. Create `apps/web/server/database/schema.ts` — re-export the layer schema
>    first (`export * from '#layer/server/database/schema'`), then define your
>    app tables below.
> 2. Create `apps/web/server/utils/database.ts` — export `useAppDatabase(event)`
>    using YOUR full schema (layer + app tables).
> 3. Use `useAppDatabase(event)` in ALL app server routes — **NEVER** use the
>    auto-imported `useDatabase` from the layer (it only sees layer tables and
>    Nitro will warn about "Duplicated imports" if you shadow its name).
>
> ### Server Import Rule
>
> Always use `#server/` aliases for server-to-server imports:
>
> - ✅ `import { schema } from '#server/database/schema'`
> - ✅ `import { useAppDatabase } from '#server/utils/database'`
> - ❌ `import { schema } from '../../../database/schema'` (breaks
>   `nuxt typecheck`)
>
> ### Quality Scope
>
> Only run quality/typecheck scoped to the app:
> `pnpm --filter <app-name> run quality`. Do NOT run workspace-root quality —
> layer warnings are pre-existing and not your concern.

### Section 2b: Brand Identity

Instruct the agent to run the `/generate-brand-identity` workflow
(`.agents/workflows/generate-brand-identity.md`) after the app is built and
functional. This ensures every new app ships with an intentional visual identity
— theme colors, typography, favicons, imagery, and design polish — instead of
default template styling.

### Section 3: Template Audit & Issue Reporting

Instruct the agent to create `audit_report.md` capturing friction across:

- **Initialization:** `pnpm run setup` results, string replacements, missing
  dependencies.
- **Database & CLI:** Drizzle migrations, `wrangler`, `nitro-cloudflare-dev`
  binding.
- **Monorepo Layers:** Module resolution, layer inheritance issues.
- **Type Safety:** TypeScript errors, auto-import type failures.
- **Agent Experience:** Adequacy of `AGENTS.md` and documentation.
- **Other Friction:** Port collisions, Tailwind issues, Doppler token errors.

## Step 4: Tell the User

After copying the prompt to clipboard, tell the user:

> Bootstrap complete! Open `~/new-code/<app-name>` in a new Antigravity window
> and paste (Cmd+V).

---

## Example Prompt Template

```markdown
# Role and Objective

You are an expert Nuxt 4, Cloudflare Workers, and Vue developer. You have been
dropped into a newly cloned monorepo based on `narduk-nuxt-template`.

**You have a triple mission:**

1. **Build "[App Name]"**: [app description] using Nuxt 4, Cloudflare D1, and
   Nuxt UI 4.
2. **Brand Identity & SEO Excellence**: Make it stunning and discoverable.
3. **Template Audit**: Report any friction, broken types, or tooling failures.

---

## Step 0: Project Setup

First, verify your git remote is correctly set (setup needs this for GitHub
secrets):
```

git remote -v

```
If no remote exists, or it still points to `narduk-nuxt-template`, fix it:
```

git remote remove origin 2>/dev/null; git remote add origin
https://github.com/narduk-enterprises/<app-name>.git

```

Run the setup script (the script is NOT interactive). This handles ALL initialization including D1 provisioning, Doppler setup, example app cleanup, and favicon generation:
```

pnpm run setup -- --name="<app-name>" --display="<Display Name>"
--url="https://<app-name>.nard.uk"

````

> **What to expect:** Setup takes ~2 minutes and prints 10 steps. Steps involving Doppler and analytics may show ⏭ (skipped) or ⚠️ (deferred) — this is normal if Doppler isn't fully configured. The critical steps are **1** (string replacement), **2** (D1 provisioning), and **3** (wrangler.json). At the end, a **SETUP SUMMARY** shows ✅ completed / ⏭ deferred — if the critical steps show ✅, setup succeeded.

After setup completes, verify everything is healthy:

```bash
pnpm run validate
pnpm run db:migrate
pnpm --filter <app-name> run quality
````

If quality passes with zero errors and zero warnings, proceed. If not, fix any
issues before building.

Then read `AGENTS.md` and `tools/AGENTS.md`.

---

## Mission 1: Build [App Name]

Build the app inside `apps/web`. Features:

**1. Database Schema (Cloudflare D1)**

- [table details...]

**2. API Routes (Nitro / Cloudflare Workers)**

- [endpoint details...]

**3. Frontend (Nuxt UI 4)**

- [UI requirements...]
- **Requirement:** Use the inherited layer design tokens, Nuxt UI 4 components
  (including Pro components: `PageHero`, `PageSection`, `PageFeature`, `PageCTA`
  for landing pages; `DashboardGroup`, `DashboardSidebar`, `DashboardPanel` for
  admin interfaces), and Tailwind v4.

### ⚠️ CRITICAL: Database Schema Extension Pattern

When adding app-specific tables beyond the layer's base schema (`users`,
`sessions`):

1. **Create `apps/web/server/database/schema.ts`** — re-export the layer schema
   first, then define your app tables:

   ```ts
   export * from '#layer/server/database/schema'
   // App-specific tables below
   export const myTable = sqliteTable('my_table', { ... })
   ```

2. **Create `apps/web/server/utils/database.ts`** — export
   `useAppDatabase(event)` using the FULL schema:
   ```ts
   import { drizzle } from 'drizzle-orm/d1'
   import * as schema from '#server/database/schema'
   export function useAppDatabase(event: H3Event) {
     return drizzle(event.context.cloudflare.env.DB, { schema })
   }
   ```
3. **Use `useAppDatabase(event)` in ALL your server routes** — NEVER use the
   auto-imported `useDatabase` from the layer (it only sees layer tables; naming
   your helper `useDatabase` causes "Duplicated imports" warnings and the
   layer's version wins).

### Server Import Rule

Always use `#server/` aliases for server-to-server imports:

- ✅ `import { ... } from '#server/database/schema'`
- ✅ `import { useAppDatabase } from '#server/utils/database'`
- ❌ `import { ... } from '../../../database/schema'` (breaks `nuxt typecheck`)

### Migration Pattern

After creating or modifying the schema, add a new SQL migration file in
`apps/web/drizzle/` (e.g., `0001_app_tables.sql`). The `db:migrate` script
automatically runs all `drizzle/*.sql` files in alphabetical order — no script
edits needed.

### Quality Scope

Only run lint/typecheck scoped to the app:
`pnpm --filter <app-name> run quality`. Do NOT run workspace-root quality —
layer warnings are pre-existing and not your responsibility.

---

## Mission 1b: Brand Identity

Once the app is built and functional, follow the `/generate-brand-identity`
workflow (`.agents/workflows/generate-brand-identity.md`) end-to-end. **Do not
ask any questions** — you are the creative director. Analyze the app, make all
creative decisions yourself, and execute the full pipeline: theme colors,
typography, visual assets (logo, hero imagery), favicons, and holistic design
polish. The app should feel like a real product — not a template.

Generate a **distinctive, memorable logo** using `/generate-brand-identity`
Phase 3. The logo must work as a favicon at 16×16 and as an app icon at 180×180.
Use the `generate_image` tool and the `pnpm generate:favicons` script to produce
all required assets.

### ⚠️ MANDATORY: Remove ALL Template Branding

The template ships with default branding that **MUST** be replaced:

1. **Remove the N4 icon.** The green "N4" Nuxt logo in the header/navbar is
   template branding. It must be deleted and replaced with the app's own logo.
   Do NOT ship an app with the N4 icon anywhere.
2. **Remove or redesign the default navbar.** The template's default `UHeader`
   with a generic "Home" link and color mode toggle is lazy scaffolding. Either:
   - **Remove it entirely** if the app doesn't need top navigation (most
     single-page tools, utilities, and simple apps don't), OR
   - **Redesign it completely** with the app's own logo, meaningful navigation
     links, and intentional layout — only if navigation genuinely adds value to
     the user experience.
   - A navbar with just "Home" and a color toggle is **unacceptable**. If that's
     all you'd put in it, remove it.
3. **Replace all placeholder text.** Search for "Nuxt 4", "N4", "Demo",
   "Template" in the UI and replace with app-specific content.
4. **Light theme by default.** Set `colorMode: { preference: 'light' }` in
   `nuxt.config.ts`. We prefer light mode as the default experience. Dark mode
   must still look polished, but light mode is what users see first.

## Mission 1c: SEO Excellence

This app must be **exceptionally SEO-friendly**. Go beyond the template
defaults:

- Every page MUST call `useSeo()` with rich, keyword-optimized titles and
  descriptions.
- Every page MUST call `useWebPageSchema()` (or appropriate Schema.org type) for
  structured data.
- Write compelling, unique meta descriptions for every route — not generic
  placeholders.
- Ensure the landing page has a clear `<h1>` with proper heading hierarchy
  throughout.
- Use semantic HTML5 elements (`<main>`, `<article>`, `<section>`, `<nav>`,
  etc.).
- OG images must be customized per page with descriptive text and branding.
- Verify that `sitemap.xml` and `robots.txt` are correctly generated.
- IndexNow is already wired — ensure it fires on content changes.
- Target relevant long-tail keywords in page content and headings.

---

## Mission 2: Template Audit & Issue Reporting

Create `audit_report.md` answering:

1. Did `pnpm run setup` complete smoothly?
2. Did Drizzle migration and `nitro-cloudflare-dev` work out of the box?
3. Did Nuxt layer inheritance work seamlessly?
4. Any pre-existing TypeScript errors from
   `pnpm --filter <app-name> run quality`?
5. Did documentation accurately guide you?
6. Any HMR port collisions, Tailwind issues, or Doppler errors?

### Final Deliverable:

- Working code for [App Name] with **ZERO errors and ZERO warnings**
  (TypeScript, ESLint, Build).
- `audit_report.md` with brutally honest feedback.

**CRITICAL RULE:** If you encounter errors or warnings, you must fix them
properly. Do NOT use hacky monkey fixes, `@ts-expect-error`, or suppressions.
Solve the actual root cause.

```

```
