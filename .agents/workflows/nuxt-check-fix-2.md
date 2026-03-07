---
description:
  Google Antigravity workflow — Nuxt 4 + narduk-nuxt-template compliance audit &
  mechanical refactor. Eliminates broad runtime warning classes (transition
  roots, routing invariants, suspense/async boundaries, hydration drift) plus
  monorepo + Cloudflare edge gotchas.
---

# /nuxt-4-compliance-and-runtime-warnings

You are an autonomous Nuxt 4 auditor + refactor agent operating inside the
**narduk-nuxt-template PNPM monorepo**. Harden the repo to Nuxt 4 best practices
and eliminate **classes** of runtime warnings/dev-console noise (no one-off
symptom chasing).

Do not ask the user questions.

## Constraints (hard)

- Minimal, mechanical diffs.
- Preserve behavior + visuals unless clearly incorrect.
- No new frameworks; reuse existing tooling/modules.
- Fix patterns repo-wide (invariants > occurrences).
- Monorepo-aware: apps/_ + layers/_ + packages/_ + tools/_.

## Deliverables (must exist)

1. `NUXT_4_COMPLIANCE_REPORT.md`
2. PR-style summary grouped by category
3. Complete list of changed files

---

## Phase 0 — Baseline Snapshot (monorepo + deploy reality)

Capture and record exact versions + paths:

- Root: `package.json`, lockfile, `pnpm-workspace.yaml`
- Each app: `apps/*/nuxt.config.*`, `app.config.*`
- Layer: `layers/narduk-nuxt-layer/**`
- Tooling: `tsconfig*.json`, `eslint*`, `wrangler*`, `drizzle*`

Record (per app):

- Rendering posture: SSR vs hybrid vs prerender usage, route rules strategy
- Deployment posture: Cloudflare target, Nitro preset, wrangler config source of
  truth
- Module inventory (Nuxt UI 4, SEO suite, analytics, security)

Write into `NUXT_4_COMPLIANCE_REPORT.md`:

- Versions, module list, repo map, rendering/deploy summary

---

## Phase 1 — Template Compliance Gate (fleet invariants)

Goal: ensure the repo matches fleet expectations before refactors.

Enforce:

- Shared logic belongs in `layers/narduk-nuxt-layer/` (avoid app copies)
- `pnpm run quality` is the single “zero warnings” gate
- `/api/health` exists and is stable
- `/admin` route behavior is consistent (if present in app)

Report:

- PASS / PARTIAL / FAIL + exact failing invariants and files

---

## Phase 2 — Module + Build Hygiene (Nuxt 4 conventions)

Audit:

- Module ordering/duplication across apps + layer
- Plugin scoping (`.client` / `.server`) for browser-only APIs
- runtimeConfig usage (public vs private) and access pattern consistency
- Auto-import expectations (composables/components/utils)

Actions:

- Remove duplication, normalize module order.
- Fix plugin scope and SSR-safe imports.
- Align config ownership: app vs layer (one source of truth).

Report section: “Module/Build Hygiene”

---

## Phase 3 — Warning Class Remediation (broad fixes)

### 3A) Transition Safety (stable single-element root)

Inventory:

- `<Transition>` / page transitions / layout transitions
- Transition-wrapped UI primitives (buttons/links/menus/popovers)

Standardize ONE pattern:

- Any transition child must always render a single stable HTML element root.
- Conditional branches must not change the root shape.

Actions:

- Refactor offending components to guarantee stable roots.
- If needed, introduce a tiny shared wrapper component (reused broadly).

Report: “Transition Safety” (patterns + files)

### 3B) Routing Invariants (never render invalid targets)

Inventory:

- `<NuxtLink>` and Nuxt UI link wrappers
- “sometimes link, sometimes button” patterns

Standardize ONE pattern:

- If a target is invalid/missing, render a non-link element with identical
  visuals/ARIA.
- No `to=undefined`, no empty strings, no malformed route objects.

Actions:

- Introduce a small `safeLinkTarget()` helper (or typed prop guard) if it
  reduces repetition.
- Refactor all conditional-link UI to enforce invariants.

Report: “Routing Invariants” (patterns + files)

### 3C) Async/Suspense Boundaries (make it intentional)

Inventory:

- Explicit `<Suspense>` usage
- Async setup patterns that rely on suspense-like behavior

Standardize:

- Prefer Nuxt-native async patterns; keep suspense isolated and documented.

Actions:

- Replace accidental suspense usage with Nuxt-native patterns.
- If explicit Suspense remains, document why + isolate it.

Report: “Async/Suspense Boundaries”

---

## Phase 4 — Hydration & Determinism (SSR-safe output)

Audit classes:

- Browser globals in shared codepaths
- Random/time/locale causing server/client divergence
- Conditional SSR markup based on client-only state
- Non-deterministic IDs

Actions:

- Move browser-only logic behind `.client` or `ClientOnly` boundaries.
- Ensure SSR output is deterministic and stable on first render.
- Standardize “loading skeleton” markup patterns to prevent root churn.

Report: “Hydration Safety”

---

## Phase 5 — Cloudflare Edge + D1/Drizzle Gotchas (fleet critical)

Goal: eliminate “works locally, breaks on Pages/Workers” classes.

Audit:

- Where Cloudflare bindings are read (request-time vs module init)
- D1 binding usage in server routes and composables
- Nitro preset + wrangler config source (generated vs user-provided)
- Any static generation + workers deployment mismatch patterns

Actions:

- Enforce request-time access for Cloudflare env/bindings (no module-top-level
  reads).
- Ensure D1 is accessed via the existing fleet pattern (do not invent a new
  adapter layer).
- Normalize wrangler config strategy (Nitro-generated vs repo-owned) and stop
  drift.
- Add a minimal “edge runtime assertions” utility that throws clear errors in
  dev if bindings are missing.

Report: “Edge Runtime & D1”

---

## Phase 6 — Monorepo / PNPM Resolution Gotchas (Nuxt UI + layers)

Goal: prevent dependency/duplication warnings caused by workspace hoisting.

Audit:

- Duplicate UI systems or mixed UI package generations across workspace
- Conflicting dependency versions across apps/layer
- Nuxt UI icon collections or module option merge anomalies

Actions:

- Normalize to one Nuxt UI generation per repo (or isolate intentionally).
- Remove accidental duplicates and align versions in root constraints.
- If icon collections are used, centralize config in the layer and avoid per-app
  duplication.

Report: “Monorepo Resolution”

---

## Phase 7 — SEO Suite Gotchas (sitemap, images, absolute URLs, head)

Goal: eliminate SEO regressions that look “fine in UI” but fail in crawlers.

Audit:

- `@nuxtjs/seo` config ownership (app vs layer)
- Canonical URLs and base URL consistency
- OG/Twitter images absolute URLs
- Sitemap: route completeness + image entries strategy

Actions:

- Ensure a single consistent SEO config source (prefer layer).
- Normalize canonical/base URL and absolute OG image URLs.
- If sitemap images are expected, implement the module-supported images strategy
  and ensure layout structure supports scanning when used.
- Ensure robots/sitemap endpoints are correct per app.

Report: “SEO Gotchas”

---

## Phase 8 — Architecture Standards (Nuxt 4 + fleet conventions)

Rules:

- Layouts: shell only
- Pages: route composition only
- Components: reusable UI + local behavior
- Composables: orchestration/business logic
- Stores: state/actions only

Actions:

- Move obvious violations into composables/stores (or shared layer).
- Deduplicate repeated UI markup into shared components in the layer.

Report: “Architecture Standards”

---

## Phase 9 — Logging Discipline (zero-noise policy)

Audit:

- Console noise in client runtime
- Debug logs in production codepaths

Actions:

- Remove noise or gate behind an existing dev flag strategy.
- Ensure production build ships without debug spam.

Report: “Logging Discipline”

---

## Phase 10 — Guardrails (prevent regressions)

Use existing repo tooling (ESLint/types only):

- Add/adjust lint rules if ESLint exists
- Add lightweight TS prop guards for link targets
- Add shared helpers only if they reduce duplication:
  - `safeLinkTarget()`
  - `TransitionSafeRoot` wrapper

Report: “Guardrails”

---

## Phase 11 — Verification (commands + outcomes)

Run (root):

- install
- `pnpm run quality` (lint + typecheck)
- `pnpm run build` and `pnpm run preview` (if present)

Acceptance criteria:

- No transition-root warnings under normal navigation
- No invalid link-target warnings
- Suspense warnings eliminated or isolated and documented
- No new hydration warnings
- No edge-binding runtime failures in local Cloudflare dev flow

Report: “Verification” with commands + results

---

## Phase 12 — Final Report Output

Write `NUXT_4_COMPLIANCE_REPORT.md`:

1. Executive Summary

- PASS / PARTIAL / FAIL
- Warning classes addressed
- Risk: low/med/high

2. Findings by Category

- Template compliance
- Module/build hygiene
- Transition safety
- Routing invariants
- Async/suspense boundaries
- Hydration safety
- Edge runtime & D1
- Monorepo resolution
- SEO gotchas
- Architecture standards
- Logging discipline
- Guardrails
- Verification

3. Change Log

- Added/modified/removed files (paths)

4. Future Rules (10 bullets max)

Final chat output:

- PR-style summary grouped by category
- Complete list of changed files
- Confirm report exists
