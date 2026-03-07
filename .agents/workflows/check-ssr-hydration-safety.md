---
description: 'Comprehensive SSR/Hydration safety audit + zero-tolerance hydration mismatch
---

# /check-ssr-hydration-safety

## Mission

Audit the codebase for SSR safety violations, then eliminate **all** hydration
mismatches and install **guardrails** so they don't come back. You are not here
to "silence warnings." You are here to make SSR and CSR render the **same DOM**
for the initial paint.

## Non-Negotiables

- Do **not** "fix" by disabling SSR globally.
- Do **not** blanket-wrap whole pages in `<ClientOnly>` unless explicitly
  justified.
- Do **not** ship a fix that hides warnings but keeps SSR/CSR divergence.
- Every fix must be backed by a reproducible reason and a test/guardrail.

---

## Phase 1 — Static Audit (automated + manual)

**ESLint (run first):** `nuxt-guardrails/no-ssr-dom-access` flags unguarded
`window`/`document`; `nuxt-guardrails/no-raw-fetch` flags raw `$fetch`.
`vue-official/no-composable-dom-access-without-client-guard` covers composables.
Store serialization is enforced by
`nuxt-guardrails/no-non-serializable-store-state`. Hydration-sensitive
components (UNavigationMenu, UColorMode\*) are enforced by
`atx/require-client-only-hydration-sensitive`. Run `pnpm run lint` before manual
checks below.

### 1. Check for `window` or `document` usage in setup

- Any access to `window` or `document` directly in `<script setup>` outside of
  lifecycle hooks (like `onMounted`) will cause SSR crashes.
- **Enforced by:** `nuxt-guardrails/no-ssr-dom-access`
- Optional manual check: // turbo
  `grep -rn "window\." app/ 2>/dev/null | grep -v "onMounted" || echo "No unsafe window access found (pass)"`

### 2. Verify data fetching patterns

- Ensure API calls during SSR are made using `useAsyncData` or `useFetch`. Raw
  `$fetch` calls in the setup block without wrapping them will execute twice
  (server and client), causing hydration mismatches.
- **Enforced by:** `nuxt-guardrails/no-raw-fetch`
- Optional manual check: // turbo
  `grep -rn "const .* = await \$fetch" app/ 2>/dev/null || echo "No unsafe raw $fetch found (pass)"`

### 3. Check for `isHydrated` pattern in Pinia stores and components

- Complex client-only state or stores that hold live/dynamic data (prices,
  WebSockets) must implement an `isHydrated` guard. This prevents live
  calculations from running on stale SSR-serialized data or mismatches from
  browser APIs. // turbo
  `grep -rn "isHydrated\|markHydrated" app/stores/ app/components/ 2>/dev/null || echo "No isHydrated pattern found — verify if stores/components hold live data"`

### 4. Check `ClientOnly` wrapping for hydration-sensitive components

- `UNavigationMenu`, color mode toggles, and any component depending on
  `localStorage` or `matchMedia` must be wrapped in `<ClientOnly>` to prevent
  SSR/client mismatch flicker. // turbo
  `grep -rn "UNavigationMenu\|UColorModeButton\|UColorModeSelect" app/ 2>/dev/null | grep -v "ClientOnly" | head -10 || echo "All hydration-sensitive components properly wrapped (pass)"`

### 5. Check for DOM nesting violations

- Invalid HTML nesting (e.g., `<div>` inside `<p>`, `<a>` inside `<a>`, block
  elements inside inline elements) causes Vue's hydration to fail silently,
  producing visual corruption. // turbo
  `grep -rn "<p>" app/components/ app/pages/ 2>/dev/null | grep -v "\.ts$" | head -20`
- Review output manually: look for `<p>` tags containing `<div>`, `<UCard>`, or
  other block-level elements. Refactor `<p>` to `<div>` if it wraps block
  content.

### 6. Check for non-serializable state in stores

- `Map`, `Set`, `Date`, and class instances cannot be serialized for SSR
  hydration. Store state must use plain objects (`Record<>`) and arrays. Use
  `shallowRef` + `skipHydrate` for unavoidable complex types. // turbo
  `grep -rn "ref<Map\|ref<Set\|new Map()\|new Set()" app/stores/ 2>/dev/null || echo "No non-serializable store state found (pass)"`

### 7. Check `#fallback` slot structural symmetry

- When using `<ClientOnly>` or `<Suspense>`, the `#fallback` skeleton must match
  the hydrated DOM structure (same container type and spacing). Mismatched
  fallback structures cause layout shift and hydration warnings. // turbo
  `grep -rn "#fallback\|v-slot:fallback" app/ 2>/dev/null | head -10 || echo "No fallback slots found — verify ClientOnly usage"`

### 8. Verify Teleports coverage

- If `Teleport` or `<UTooltip>`/`<UModal>` are used, make sure there are no
  scoped CSS hazards preventing them from rendering styles correctly (Tailwind
  `@theme` utility usage is preferred).

### 9. Check `<Transition>` wraps a native element root

- Vue's `<Transition>` requires its direct child to be a single **native DOM
  element** (or a component with a single element root). Nuxt UI components like
  `UButton` render through multi-component chains (`NuxtLink > ULink`) that can
  produce non-element root nodes (comment nodes, text nodes, or fragments),
  which `<Transition>` cannot animate.
- **Symptom:**
  `[Vue warn]: Component inside <Transition> renders non-element root node that cannot be animated.`
- **Fix pattern:** Wrap the Nuxt UI component in a plain `<div>` (or
  semantically appropriate element) so `<Transition>` always sees a native
  element. Move `v-if`/`v-show` to the wrapper. Move any fixed/absolute
  positioning CSS to the wrapper class. // turbo
  `grep -rn '<Transition' app/components/ app/pages/ 2>/dev/null | head -20`
- Review output manually: for each `<Transition>`, verify the direct child is a
  native element (`<div>`, `<span>`, `<button>`, etc.) or a wrapper `<div>`
  around any Nuxt UI / component library components.

---

## Phase 2 — Runtime Detection & Triage

### Inputs (collect yourself)

1. Run dev build and capture hydration warnings:
   - `pnpm dev` — open the app and reproduce the warning route(s).
2. Build & run production locally (many mismatches only show here):
   - `pnpm build && pnpm preview`
3. Capture for each warning:
   - Exact console warning text
   - Route URL(s)
   - Component stack (from warning)
   - Screenshot or snippet of mismatching DOM if obvious

### Triage Map — classify each mismatch into ONE bucket

#### A) Non-deterministic values during SSR

**Culprits:** `Date.now()`, `new Date()`, `Math.random()`, locale/timezone
formatting, unstable sort/filter comparators, IDs generated in render (`uuid()`,
`nanoid()` in template/computed).

**Fix pattern:**

- Compute deterministic value on server and pass via `useState` / `useAsyncData`
  / props.
- Or defer to client _only for that fragment_ with a targeted `<ClientOnly>`
  wrapper around the non-deterministic node, not the whole page.
- For IDs: use Vue `:key` from stable data, or generate once in `setup()`
  guarded by `import.meta.server` vs `import.meta.client`.

#### B) Browser-only APIs used during SSR

**Culprits:** `window`, `document`, `localStorage`, `navigator`, `matchMedia`,
`ResizeObserver`, `IntersectionObserver`, accessing element sizes during render.

**Fix pattern:**

- Move access into `onMounted()` (client only).
- Gate with `if (import.meta.client) { ... }`.
- Use Nuxt composables where possible (`useCookie`, `useColorMode`,
  `useMediaQuery` with SSR-safe patterns).

#### C) Conditional rendering differs SSR vs CSR

**Culprits:** `v-if="process.client"` / `import.meta.client` in template that
changes DOM structure, auth state known only after client boot, feature flags
loaded only on client, reactive store initializes differently on client.

**Fix pattern:**

- Ensure SSR knows the initial state:
  - Auth: use server session endpoints + `useAsyncData` to resolve user before
    render.
  - Flags: load flags server-side and serialize.
- If state truly client-only, render a **stable SSR placeholder** that matches
  client initial markup (same tags), then enhance after mount.

#### D) Third-party components not SSR-safe

**Culprits:** Chart libraries, editors, map components, animation libs.

**Fix pattern:**

- Create an SSR-safe wrapper component:
  - SSR renders a stable placeholder skeleton.
  - Client mounts the real component inside a small `<ClientOnly>` boundary.
- Ensure wrapper's SSR markup matches the client's initial placeholder exactly.

#### E) CSS/media-query or layout-driven DOM differences

**Culprits:** Rendering different DOM based on breakpoints computed on client,
using `useWindowSize()` during render.

**Fix pattern:**

- SSR renders a single consistent DOM; use CSS to adapt layout.
- If DOM must differ by viewport, SSR must choose a consistent default and
  client must not switch structure until after mount (placeholder strategy).

#### F) Async data timing & race conditions

**Culprits:** Data fetched only client-side but SSR renders empty state,
different default values on server and client.

**Fix pattern:**

- Use `useAsyncData`/`useFetch` with SSR enabled and consistent defaults.
- Ensure initial values match on server and client (`ref(null)` vs `ref([])`
  matters if template branches).
- **When `server: false` is intentional** (e.g. Cloudflare Workers needing D1
  context): SSR sees `status === 'pending'` and empty defaults, so
  `v-if`/`v-else` toggles or `v-if` guards on data length will produce different
  DOM trees on server vs client. **Use `v-show` instead of `v-if`/`v-else`** for
  any template branch that depends on async state or data length. This keeps the
  same DOM nodes in both SSR and CSR — they are just shown/hidden via CSS. Apply
  to:
  - Loading skeleton vs content toggles
  - Empty-state conditionals
  - Data-count conditionals (e.g. `v-if="items.length > 0"`)
  - Add a comment:
    `<!-- hydration: v-show for server:false data (SSR/CSR must match) -->`

#### G) `<Transition>` wrapping a non-element root component

**Culprits:** Nuxt UI components (`UButton`, `UBadge`, etc.) used as the direct
child of `<Transition>`. These components render through multi-level component
chains (e.g., `NuxtLink > ULink`) that can produce non-element root nodes
(comment nodes, fragments, or text), which Vue's Transition cannot animate.

**Fix pattern:**

- Wrap the component in a native element (`<div>`, `<span>`, `<button>`) that
  becomes Transition's direct child.
- Move `v-if`/`v-show` to the wrapper element.
- Move any fixed/absolute positioning CSS to a wrapper class so the component
  inside remains naturally positioned.
- Add a comment:
  `<!-- Transition requires a native element root; UButton renders NuxtLink/ULink which are non-element -->`

---

## Phase 3 — Step-by-step Fix Execution

### Step 1 — Create a "Hydration Mismatch Case File"

For each warning, create a markdown block in `docs/hydration-cases.md`:

- **Route:**
- **Warning text:**
- **Component stack:**
- **Suspected bucket (A–F):**
- **SSR markup snapshot (describe):**
- **CSR markup snapshot (describe):**
- **Root cause hypothesis:**

Do not proceed without at least one concrete hypothesis per case.

### Step 2 — Prove SSR/CSR divergence (don't guess)

For each case:

- Find the first component in the stack that renders the mismatching node.
- Inspect what values influence the template output during SSR vs CSR.
- Add temporary logs (remove later):
  - `if (import.meta.server) console.log(...)`
  - `if (import.meta.client) console.log(...)`
- Confirm the exact variable/value that differs.

### Step 3 — Apply the minimal deterministic fix

Fix with the smallest boundary possible. Preferred order:

1. Make data deterministic at SSR (best)
2. Render SSR-stable placeholder that matches initial CSR
3. Targeted `<ClientOnly>` around the smallest fragment that cannot be
   deterministic

Every change must include a short inline comment:

```
// hydration: <reason> (SSR/CSR must match)
```

### Step 4 — Verify across modes

For each fixed case:

- `pnpm dev` — reproduce route(s) — warning gone
- `pnpm build && pnpm preview` — reproduce route(s) — warning gone
- Hard refresh on route (SSR path) and in-app navigation (CSR path)

### Step 5 — Install Guardrails (mandatory)

#### 5.1 ESLint rules / lint checks

- Ban use of `Date.now()`, `Math.random()` inside Vue templates and computed
  used in templates.
- Ban direct `window/document/localStorage` access outside `onMounted` or
  explicit `import.meta.client` blocks.
- If the repo doesn't have ESLint configured, configure it minimally for Nuxt
  4 + Vue and add these bans as custom rules (or `no-restricted-globals` +
  `no-restricted-syntax` patterns).

#### 5.2 A "hydration smoke" script

Create `scripts/hydration-smoke.mjs` that:

- Builds the app
- Runs preview
- Uses Playwright to visit top routes
- Fails if console contains hydration mismatch warnings

Wire into:

- `pnpm test:hydration`
- CI step on PRs

#### 5.3 SSR-safe component boundary pattern

Create `components/SsrStable.client.vue` wrapper pattern:

- SSR renders placeholder via a `.server.vue` sibling.
- Client renders real implementation.
- Document usage in `docs/ssr-safe-components.md`.

### Step 6 — Final output requirements

Provide:

1. `docs/hydration-cases.md` updated with root cause, fix summary, and files
   changed.
2. A short checklist in PR description:
   - [ ] Dev verified
   - [ ] Build+preview verified
   - [ ] Hydration smoke test added/passing

---

## Quick-Reference Fix Recipes

### Deterministic time formatting

- Server: compute formatted string in `useAsyncData` and render it.
- Client: do not reformat until after hydration.

### Stable IDs

- Generate IDs from stable data (database ID, slug).
- If no stable key exists: create once in server data layer and serialize.

### Auth gating

- SSR must know auth state or render identical placeholder DOM.
- Never `v-if="isLoggedIn"` when `isLoggedIn` is only known client-side without
  placeholder strategy.

### Client-only library wrapper

- SSR: skeleton div with fixed structure.
- CSR: mount library inside same container after mount.

### Transition-safe component wrapping

- Never use a Nuxt UI component (UButton, UBadge, etc.) as the direct child of
  `<Transition>` — wrap in a plain `<div>` or `<span>`.
- Move `v-if` to the wrapper so Transition toggles a native element.
- Move positioning CSS (fixed, absolute) to the wrapper class.

```vue
<!-- ✅ Correct -->
<Transition name="fade">
  <div v-if="visible" class="floating-wrapper">
    <UButton icon="i-lucide-arrow-up" />
  </div>
</Transition>

<!-- ❌ Wrong — UButton renders non-element root -->
<Transition name="fade">
  <UButton v-if="visible" icon="i-lucide-arrow-up" />
</Transition>
```

---

## Done Definition

This workflow is "done" only when:

- Zero hydration mismatch warnings in d
