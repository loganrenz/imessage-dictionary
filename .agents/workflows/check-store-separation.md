---
description: Audit architectural separation of component vs. composable/store logic
---

This workflow enforces the "Thin Component, Thick Composable" pattern standard. View components should contain minimal business logic.

1. **Check component size and logic**
   - Components in `app/components/` and `app/pages/` should ideally be under 150 lines.
   - Large `setup` blocks with extensive data fetching, state mutation, or complex conditional logic should be extracted to `app/composables/`.
     // turbo
     `find app/components app/pages -name "*.vue" | xargs wc -l | awk '$1 > 150 {print}' || echo "No oversized components found (pass)"`

2. **Verify component responsibilities**
   - Components should ONLY:
     - Subscribe to composables (e.g., `const { user, login } = useAuth()`).
     - Pass state down as props.
     - Emit events up.
   - Look for inline `fetch` calls, complex `try/catch` mutation blocks, or multi-step logic inside bounds like `@click`. These belong in composables.

3. **Check composable payload size**
   - Composables returning more than 5-7 refs/functions might need to be split into domain-specific composables to prevent "god objects".

4. **Verify Store/State Isolation**
   - Ensure that global reactive state uses Nuxt's `useState()` or standard Pinia stores (if installed). Do not use global `ref()` variables defined outside of a composable context, as this leads to cross-request state leakage during SSR.
