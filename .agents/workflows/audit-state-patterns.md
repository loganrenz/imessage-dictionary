---
description:
  Comprehensive audit of Component, Composable, and Pinia Store usage patterns —
  checks 'Thin Store' implementation, Dumb vs Smart component boundaries,
  Mutation Centralization, and Nuxt 4 state safety.
---

# State Management Architecture Audit

This workflow defines how an agent should audit a Nuxt 4 codebase for correct
separation of concerns between Vue Components, generic Nuxt Composables, and
Pinia Stores.

It checks against institutional standards such as "Thin Store" decomposition,
Mutation Centralization, and proper hydration/SSR safety.

---

## 1. Store Layer (Pinia) Patterns

The Pinia store layer should serve as the absolute source of truth for global or
domain-specific application state.

1. **Thin Store Decomposition:** // turbo `ls app/stores/ 2>/dev/null`
   - Stores should be modularized by domain (e.g., `useAuthStore`,
     `useUserStore`) rather than functioning as single monolithic "god objects".
2. **Mutation Centralization:** // turbo
   `grep -rn '\$patch' app/components/ 2>/dev/null | head -10 || echo "No manual \$patch identified in components"`
   - Components should call Store _Actions_ to mutate state. Complex state
     patching (like merging trade arrays or deeply nested structures) MUST
     happen inside the store definition.
   - If `updateX` logic is heavily repeated inside `.vue` files manipulating a
     bare Pinia state via `$patch` or raw reassignment, flag it for
     centralization.
3. **Store-First Data Management:**
   - Review initialization logic (`app/plugins/` or `app.vue`). Key domain data
     should be loaded into stores early (SSR compatible).

---

## 2. Composable Layer (`composables/`)

Composables must encapsulate reusable, stateless logic, window/device
reactivity, or API wrappers—they should _not_ act as stealth singletons for
shared global state.

1. **Global State Warning:** // turbo
   `grep -A 5 "const .*=.*\(ref\|reactive\)" app/composables/ 2>/dev/null | grep -v 'export const' | head -10 || echo "Checking for module-scoped refs"`
   - **Antipattern:** Initializing a `ref()` outside the `export` boundary of a
     composable file makes it shared across all server requests, leading to
     dangerous state leaks in SSR. Identify and flag module-scoped state. Move
     this to Pinia.
   - _Exception_: `useState()` from Nuxt provides secure SSR-friendly global
     state.

2. **Destructuring Safety:**
   - Preferred composable return pattern is returning standard refs or a
     reactive object, ensuring components can selectively access what they need.

---

## 3. Component Layer (`components/` and `pages/`)

Components should reflect the UI presentation of the state, not the state engine
itself.

1. **Smart vs Dumb Components:**
   - Observe the `app/components/` structure. Pure UI components (e.g., a
     specific button variant, a card layout) should receive state exclusively
     via `defineProps` and communicate changes strictly via `defineEmits`.
   - "Smart" (Container) components or `pages/` handle fetching the store or
     `useAsyncData`, then pass down primitives holding the result.
   - Flag highly nested components that initialize their own API fetching
     instead of taking data from parent layers or stores (preventing Request
     Waterfalls).

2. **Dangling Local Ref Overload:** // turbo
   `grep -rn 'const .* = ref(' app/components/ | wc -l && echo "Check high ref count files manually"`
   - If a component has >10 local `ref()` or `reactive()` declarations, it is
     likely doing heavy lifting that belongs in a Pinia store module or a
     dedicated composable.

---

## 4. Nuxt 4 Hydration & Async Safety

1. **Async Data Duplication:** // turbo
   `grep -rn 'await \$fetch' app/pages/ app/components/ 2>/dev/null | head -10 || echo "No naked \$fetch calls found"`
   - Data fetching inside components must use `useAsyncData` or `useFetch`.
     Calling `$fetch` directly in `setup()` risks double-fetching during
     hydration and creates layout shifts.
2. **Server/Client State Sync:**
   - Look for uses of `onMounted()` that initialize visual state which could
     have been rendered during SSR.
   - Using browser-specific APIs (window/document) too early triggers hydration
     mismatches. Use `<ClientOnly>` or `import.meta.client` bounds correctly.

---

## 5. Compile Findings Report

Synthesize the review findings grouped by layer:

| Domain          | Institutional Ideal                                  | Checklist Items / Findings                                  |
| --------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| **Stores**      | Thin, domain-focused stores centralized via Actions. | Are components doing direct state manipulation?             |
| **Composables** | Pure functions/lifecycle bindings. Safe SSR scope.   | Any module-level scoped variables causing leaks?            |
| **Components**  | Strict UI/Container boundary. Minimal local state.   | Are UI components fetching data instead of receiving props? |
| **Hydration**   | Efficient, deduplicated server requests.             | Are there `$fetch` calls outside `useFetch`/`useAsyncData`? |

Present the final compiled list to the user and request approval before
implementing structural refactoring.
