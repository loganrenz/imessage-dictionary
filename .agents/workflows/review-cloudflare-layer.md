---
description:
  Full review of the Nuxt layer + Cloudflare Workers monorepo setup —
  cross-references official docs and golden examples
---

# Nuxt Layer × Cloudflare Workers Full Review

This workflow performs a holistic review of the monorepo's Nuxt Layer +
Cloudflare Workers integration. It cross-references every configuration,
binding, and server pattern against the **official Cloudflare docs** and the
**Cloudflare Workers Best Practices guide** (Feb 2026). Existing `/check-*`
workflows are referenced where they overlap — this workflow fills the gaps they
don't cover.

> **DX Focus:** Every step starts with automated checks (`// turbo`) so you get
> instant pass/fail feedback. Manual reasoning is only required when automated
> checks surface findings.

---

## Quick Reference: Official Docs to Cross-Reference

Before starting, open or search these docs as needed:

| Topic                    | Doc URL                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| Workers Best Practices   | https://developers.cloudflare.com/workers/best-practices/workers-best-practices/              |
| Nuxt on Workers          | https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/nuxt/ |
| D1 Get Started           | https://developers.cloudflare.com/d1/get-started/                                             |
| D1 Local Development     | https://developers.cloudflare.com/d1/best-practices/local-development/                        |
| D1 Drizzle ORM           | https://orm.drizzle.team/docs/connect-cloudflare-d1                                           |
| Workers Monorepo CI/CD   | https://developers.cloudflare.com/workers/ci-cd/builds/advanced-setups/                       |
| Node.js Compatibility    | https://developers.cloudflare.com/workers/runtime-apis/nodejs/                                |
| R2 Bindings              | https://developers.cloudflare.com/r2/api/workers/workers-api-reference/                       |
| KV Bindings              | https://developers.cloudflare.com/kv/api/                                                     |
| `wrangler.json` Schema   | https://developers.cloudflare.com/workers/wrangler/configuration/                             |
| Golden Monorepo Examples | https://github.com/jahands/workers-monorepo-template, https://github.com/cloudflare/templates |

---

## Step 1: Wrangler Configuration Audit

Validate every `wrangler.json` against the official schema and best practices.

1. **Find all wrangler configs in the monorepo:** // turbo
   `find . -name "wrangler.json" -o -name "wrangler.jsonc" -o -name "wrangler.toml" | grep -v node_modules | grep -v .output | sort`

2. **Check `compatibility_date` is current** (Best Practice: "Set this to
   today's date"): // turbo
   `for f in $(find . -name "wrangler.json" -not -path "*/node_modules/*" -not -path "*/.output/*"); do echo "=== $f ===" && grep -o '"compatibility_date": "[^"]*"' "$f"; done`
   - Per Cloudflare docs: should be within the last 3 months. If older, flag for
     update.

3. **Check `compatibility_flags` includes `nodejs_compat`** (Best Practice:
   always enable): // turbo
   `for f in $(find . -name "wrangler.json" -not -path "*/node_modules/*" -not -path "*/.output/*"); do echo "=== $f ===" && grep -c '"nodejs_compat"' "$f" && echo "✅ nodejs_compat present" || echo "❌ nodejs_compat MISSING"; done`

4. **Check `observability` is enabled** (Best Practice: "Enable Workers Logs and
   Traces"): // turbo
   `for f in $(find . -name "wrangler.json" -not -path "*/node_modules/*" -not -path "*/.output/*"); do echo "=== $f ===" && grep -c '"observability"' "$f" > /dev/null && echo "✅ observability configured" || echo "⚠️ observability not configured"; done`

5. **Check for identical `database_id` across different apps** (likely a
   copy-paste bug): // turbo
   `for f in $(find . -name "wrangler.json" -not -path "*/node_modules/*" -not -path "*/.output/*"); do echo "=== $f ===" && grep '"database_id"' "$f"; done`
   - If two apps share the same `database_id` but have different `database_name`
     values, flag as 🔴 **Critical**: they'll collide in production.

6. **Validate `preview_database_id`** format: // turbo
   `for f in $(find . -name "wrangler.json" -not -path "*/node_modules/*" -not -path "*/.output/*"); do echo "=== $f ===" && grep '"preview_database_id"' "$f"; done`
   - Per D1 docs: `preview_database_id` should be a UUID (for a real preview DB)
     or the string `"DB"` (for local-only). Using `"DB"` disables remote preview
     — note this in findings.

7. **Check `$schema` reference** (DX: enables autocomplete in editors): // turbo
   `for f in $(find . -name "wrangler.json" -not -path "*/node_modules/*" -not -path "*/.output/*"); do echo "=== $f ===" && grep '"$schema"' "$f" || echo "⚠️ No $schema — add for editor autocomplete"; done`

8. **Cross-reference `main` and `assets.directory`** entries against Nuxt's
   build output: // turbo
   `for f in $(find . -name "wrangler.json" -not -path "*/node_modules/*" -not -path "*/.output/*"); do echo "=== $f ===" && grep -E '"main"|"directory"' "$f"; done`
   - Nuxt with `cloudflare-module` preset outputs to `.output/server/index.mjs`
     and `.output/public`. These must match.

**Think:** Read each `wrangler.json` holistically. Are there any bindings (R2,
KV, Queues, Durable Objects) declared in the wrangler config that the server
code doesn't use? Conversely, does the server code reference bindings not
declared in wrangler?

---

## Step 2: Nitro Preset & Build Configuration

Validate the Nitro config in `nuxt.config.ts` against Cloudflare's Nuxt
framework guide.

1. **Check Nitro preset across all configs:** // turbo
   `grep -rn "preset:" layers/*/nuxt.config.ts apps/*/nuxt.config.ts 2>/dev/null || echo "No preset found"`
   - Must be `'cloudflare-module'` (not `cloudflare-pages` or `cloudflare`). The
     `cloudflare-module` preset uses ES Module format, which is the modern
     standard.

2. **Check for `esbuild.options.target`** in layer config: // turbo
   `grep -A2 "esbuild" layers/*/nuxt.config.ts 2>/dev/null || echo "No esbuild config found"`
   - Should be `'esnext'` to avoid unnecessary transpilation on V8 isolates.

3. **Check `externals.inline`** for Drizzle ORM: // turbo
   `grep -A2 "externals" layers/*/nuxt.config.ts 2>/dev/null || echo "No externals config found"`
   - Drizzle ORM must be inlined (`inline: ['drizzle-orm']`) to work on Workers.
     If missing, the build will fail at deploy time.

4. **Verify downstream apps DON'T duplicate Nitro config** (the layer provides
   it): // turbo
   `grep -n "nitro:" apps/*/nuxt.config.ts 2>/dev/null || echo "✅ No nitro override in downstream apps (pass)"`
   - Downstream apps should inherit the layer's Nitro config via `extends`.
     Duplicating the preset or esbuild config risks drift.

5. **Check `@cloudflare/unenv-preset` override consistency:** // turbo
   `grep -rn "unenv-preset" */*/package.json 2>/dev/null`
   - The `@cloudflare/unenv-preset` version must be identical across ALL
     workspace `package.json` files. Mismatches cause subtle runtime errors.

---

## Step 3: D1 Database & Drizzle Integration

Cross-reference the Drizzle ORM setup against
[Drizzle + D1 docs](https://orm.drizzle.team/docs/connect-cloudflare-d1) and
Cloudflare D1 best practices.

1. **Check D1 middleware injection pattern:** // turbo
   `cat layers/*/server/middleware/d1.ts 2>/dev/null || echo "⚠️ No D1 middleware found"`
   - Must extract `DB` from `event.context.cloudflare.env` (not `process.env`).
     Cloudflare bindings are per-request, not env vars.

2. **Check database singleton pattern:** // turbo
   `cat layers/*/server/utils/database.ts 2>/dev/null || echo "⚠️ No database utility found"`
   - Per Workers best practice "Avoid global mutable state": the singleton is
     acceptable for Drizzle (it's a wrapper, not state), but ensure it doesn't
     cache query results across requests.

3. **Check for raw D1 access vs. Drizzle** (prefer Drizzle for consistency): //
   turbo
   `grep -rn "\.prepare\b\|\.exec\b\|\.batch\b" layers/*/server/ apps/*/server/ 2>/dev/null | grep -v node_modules | grep -v ".output" || echo "✅ No raw D1 API calls found (pass)"`

4. **Check Drizzle schema location** (should be in the layer, not duplicated in
   apps): // turbo
   `find . -path "*/server/database/schema*" -not -path "*/node_modules/*" | sort`
   - Schema should live in `layers/narduk-nuxt-layer/server/database/schema.ts`.
     Apps should extend, not duplicate.

5. **Check migration file consistency:** // turbo
   `find . -path "*/drizzle/*.sql" -not -path "*/node_modules/*" | sort`
   - Migration SQL files should exist in the layer. Apps should reference them
     via relative paths in their `db:migrate` scripts.

6. **Validate `drizzle.config.ts`** in both layer and apps: // turbo
   `find . -name "drizzle.config.ts" -not -path "*/node_modules/*" -exec sh -c 'echo "=== {} ===" && cat "{}"' \;`
   - Check: Does each config point to the correct schema path and output
     directory?

7. **Check `db:migrate` and `db:seed` script paths:** // turbo
   `grep -n "db:" apps/*/package.json 2>/dev/null`
   - Verify migration scripts reference the correct database name (matching
     `wrangler.json`) and the correct SQL file path.

---

## Step 4: Cloudflare Bindings Audit (KV, R2, Workers AI)

Verify that every binding utility in the layer has a matching wrangler
declaration, and vice versa.

1. **Inventory binding utilities in the layer:** // turbo
   `ls -la layers/*/server/utils/ 2>/dev/null`
   - Expected: `database.ts`, `kv.ts`, `r2.ts`, `rateLimit.ts`, `auth.ts`. Each
     should follow the pattern: get binding from `event.context.cloudflare.env`,
     throw `createError` if missing.

2. **Check binding utilities use `createError` from h3** (not native
   `throw new Error`): // turbo
   `grep -rn "throw new Error\|throw Error" layers/*/server/utils/ 2>/dev/null || echo "✅ No raw throws in utils (pass)"`
   - Per Nitro best practice: use `createError()` to return proper HTTP error
     responses. Raw throws leak stack traces on the edge.

3. **Check for `any` types on Cloudflare bindings** (Best Practice: use
   `wrangler types`): // turbo
   `grep -rn ": any" layers/*/server/utils/ layers/*/server/middleware/ 2>/dev/null`
   - Per Workers Best Practices: "Generate binding types with `wrangler types`".
     Typed bindings catch config mismatches at compile time.

4. **Cross-reference declared bindings vs. wrangler configs:**
   - Read each wrangler.json and note which bindings are declared (D1, R2, KV,
     etc.)
   - Read each server utility and note which bindings they expect
   - **Matrix check:** Does every utility have a corresponding wrangler binding?
     Does every wrangler binding have a server utility that uses it?

---

## Step 5: Edge Runtime Safety

1. **Check for Node.js built-ins**
   - Cloudflare Workers using the ES Module format do not support legacy Node.js
     APIs (`fs`, `path`, `crypto`, `child_process`). // turbo
     `grep -rnE "import .* from 'fs'|import .* from 'path'|import .* from 'crypto'" layers/*/server/ apps/*/server/ 2>/dev/null | grep -v node_modules || echo "No Node.js core modules found (pass)"`
   - _Note:_ Web Crypto (`crypto.subtle`) is a global browser API and is
     perfectly safe. Avoid `import crypto from 'node:crypto'`.

2. **Verify API route structure and naming**
   - Nitro endpoint files should follow the `[name].[method].ts` pattern (e.g.,
     `todos.get.ts`). // turbo
     `find layers/*/server/api apps/*/server/api -type f -not -name "*.*.ts" 2>/dev/null | grep -v "\.gitkeep" || echo "All API routes follow method naming (pass)"`
   - Review methods to ensure `GET` routes do not execute mutations (use
     `POST`/`PATCH`/`DELETE`).

3. **Check for `Math.random()` in security contexts** (Best Practice: use Web
   Crypto): // turbo
   `grep -rn "Math\.random" layers/*/server/ apps/*/server/ 2>/dev/null | grep -v node_modules || echo "✅ No Math.random in server code (pass)"`

4. **Check for global mutable state** (Best Practice: "Avoid global mutable
   state"): // turbo
   `grep -rn "^let \|^var " layers/*/server/ apps/*/server/ 2>/dev/null | grep -v node_modules | grep -v ".output" | grep -v "database.ts" || echo "✅ No unexpected global mutable state (pass)"`
   - The Drizzle singleton in `database.ts` is an acceptable exception. Flag any
     others.

5. **Check for unhandled promises** (Best Practice: "Always await or waitUntil
   your Promises"): // turbo
   `grep -rn "\.then(" layers/*/server/ apps/*/server/ 2>/dev/null | grep -v node_modules | grep -v ".output" || echo "✅ No floating .then() chains in server code (pass)"`
   - Prefer `async/await`. If `.then()` is used, verify it has a `.catch()` or
     is `await`ed.

6. **Check for `process.env` usage in server code** (should use
   `useRuntimeConfig` or bindings): // turbo
   `grep -rn "process\.env" layers/*/server/ apps/*/server/ 2>/dev/null | grep -v node_modules | grep -v ".output" || echo "✅ No process.env in server code (pass)"`
   - On Workers, `process.env` is shimmed but not reliable for secrets. Use
     `useRuntimeConfig()` for Nuxt config or `event.context.cloudflare.env` for
     bindings.

---

## Step 6: Monorepo DX & Developer Onboarding

Review the developer experience of cloning, setting up, and running the
template.

1. **Check for `postinstall` scripts:** // turbo
   `grep -n "postinstall" */*/package.json package.json 2>/dev/null`
   - Layer should have `"postinstall": "nuxt prepare"` so types are generated
     after install.
   - Apps with `postinstall` should also only run `nuxt prepare`, not heavy
     build steps.

2. **Verify dev server scripts exist and work:** // turbo
   `grep -n '"dev"' */*/package.json package.json 2>/dev/null`
   - Both the root `package.json` and each app should have a `dev` script. Root
     should orchestrate with `--filter`.

3. **Check init/scaffold tooling:** // turbo
   `ls tools/ 2>/dev/null && cat tools/*.ts 2>/dev/null | head -30 || echo "⚠️ No tools directory found"`
   - The template should have an init script that renames the project, creates
     the D1 database, and rewrites wrangler configs. Verify it exists and is
     documented.

4. **Check for `.npmrc` / `.nuxtrc` consistency across workspaces:** // turbo
   `find . -name ".npmrc" -o -name ".nuxtrc" | grep -v node_modules | sort`
   - `.npmrc` should contain `shamefully-hoist=true` for Nuxt + pnpm
     compatibility if needed.
   - `.nuxtrc` should be identical across apps if present.

5. **Verify `pnpm-workspace.yaml` is correct:** // turbo
   `cat pnpm-workspace.yaml`
   - Should list `apps/*`, `layers/*`, and `packages/*`. Missing entries mean
     those workspaces won't resolve internal dependencies.

6. **Check `tsconfig.json` consistency:** // turbo
   `find . -name "tsconfig.json" -not -path "*/node_modules/*" -not -path "*/.nuxt/*" -not -path "*/.output/*" -exec sh -c 'echo "=== {} ===" && cat "{}"' \;`
   - Apps should extend `.nuxt/tsconfig.json` (auto-generated by Nuxt). The
     layer's `tsconfig.json` should also extend its `.nuxt/tsconfig.json`.

---

## Step 7: Deployment & CI/CD Readiness

Validate the deployment pipeline. Deployment is done **locally** via
`wrangler deploy` — CI is quality-only.

1. **Check deploy scripts:** // turbo
   `grep -n '"deploy"' */*/package.json 2>/dev/null`
   - Expected pattern: `"deploy": "nuxt build && wrangler deploy"`. Both steps
     must be present.
   - Root package.json should have
     `"deploy": "doppler run -- pnpm --filter web run deploy"`.

2. **Check `/deploy` agent workflow has dirty-repo guard:** // turbo
   `grep -c 'porcelain' .agents/workflows/deploy.md`
   - The deploy workflow must refuse to deploy when the working tree has
     uncommitted changes.

3. **Check CI is quality-only (no deploy job):** // turbo
   `grep -c 'wrangler deploy' .github/workflows/ci.yml`
   - Should be 0 — CI should only run lint, typecheck, and tests.

4. **Check for `wrangler` version consistency:** // turbo
   `grep -rn '"wrangler"' */*/package.json 2>/dev/null`
   - Must be identical across all workspaces. Mismatched wrangler versions cause
     different build outputs and subtle deployment bugs.

---

## Step 8: Cross-Reference with Existing Workflows

This step ensures this review covers gaps not already handled by other
workflows. Check off each existing workflow and note any overlap.

| Workflow                      | Covered by this review? | Overlap notes                                                                     |
| ----------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| `/check-layer-health`         | Partially               | That workflow covers shadowing/config drift; this adds Cloudflare-specific checks |
| `/audit-repo-hygiene`         | No overlap              | Run separately for secrets/junk files                                             |
| `/check-ssr-hydration-safety` | No overlap              | SSR safety is orthogonal to Cloudflare config                                     |
| `/check-ui-styling`           | No overlap              | UI component audit is orthogonal                                                  |
| `/check-data-fetching`        | No overlap              | Data fetching patterns are orthogonal                                             |

---

## Step 9: Compile Report

Write a structured report with the following sections. Every finding must
include the **official doc source** it was checked against.

| Section             | What to Include                                                                 |
| ------------------- | ------------------------------------------------------------------------------- |
| **Wrangler Config** | Each config file with pass/fail per check, doc reference                        |
| **Nitro & Build**   | Preset validation, esbuild target, externals                                    |
| **D1 & Drizzle**    | Middleware injection, singleton pattern, schema location, migration paths       |
| **Bindings**        | Binding ↔ wrangler matrix, type safety                                          |
| **Edge Safety**     | Global state, floating promises, crypto, process.env                            |
| **DX**              | Onboarding friction points, missing scripts, config inconsistencies             |
| **CI/CD**           | Deploy scripts, wrangler version consistency, dirty-repo guard, quality-only CI |

For each finding, assign a severity:

- 🔴 **Breaking** — will cause deploy failures, data corruption, or security
  issues
- 🟠 **Drift Risk** — inconsistency that will bite you during the next upgrade
  or migration
- 🟡 **DX Improvement** — friction that slows developers down but doesn't break
  anything
- 🟢 **Best Practice** — matches official docs, no action needed

Present findings to the user before making any changes.
