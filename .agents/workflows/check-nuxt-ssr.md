---
description: Audit SSR safety, hydration, and data fetching
---

This workflow ensures the Nuxt 4 application is safe for Server-Side Rendering (SSR) and avoids common hydration mismatches.

1. **Check for `window` or `document` usage in setup**
   - Any access to `window` or `document` directly in `<script setup>` outside of lifecycle hooks (like `onMounted`) will cause SSR crashes.
     // turbo
     `npx grep -r "window\." app/ | grep -v "onMounted" || echo "No unsafe window access found (pass)"`

2. **Verify data fetching patterns**
   - Ensure that API calls during SSR are made using `useAsyncData` or `useFetch`. Raw `$fetch` calls in the setup block without wrapping them in an async data composable will execute twice (server and client) and can cause hydration mismatches.
     // turbo
     `npx grep -r "const .* = await \$fetch" app/ || echo "No unsafe raw $fetch found (pass)"`

3. **Check for `isHydrated` checks**
   - Complex client-only state (like browser APIs, local storage) should be fenced. A common pattern is using a `const isHydrated = ref(false)` and setting it in `onMounted`. Check if components are correctly utilizing this or `<ClientOnly>`.

4. **Verify Teleports**
   - If `Teleport` or `<UTooltip>`/`<UModal>` are used, make sure there are no scoped CSS hazards preventing them from rendering styles correctly (Tailwind `@theme` utility usage is preferred).
