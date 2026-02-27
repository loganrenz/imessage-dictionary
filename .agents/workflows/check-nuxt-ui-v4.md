---
description: Audit components for strict Nuxt UI v4 compliance
---

This workflow ensures the codebase correctly uses Nuxt UI v4 components and avoids deprecated v3 patterns.

1. **Check for `UDivider`**
   - Ensure `UDivider` is not used anywhere in `app/`. It has been renamed to `USeparator` in v4.
     // turbo
     `npx grep -r "UDivider" app/ || echo "No UDivider found (pass)"`
   - If found, replace with `USeparator`.

2. **Check for generic Tailwind color usage in UI components**
   - Nuxt UI 4 uses design tokens. Ensure buttons, badges, and alerts are using `color="primary"` or `color="neutral"` instead of arbitrary strings unless specifically configured in `app.config.ts`.
3. **Check for correct icon syntax**
   - Nuxt UI 4 and Nuxt Icon strongly prefer the `i-` prefix syntax (e.g., `i-lucide-home`).
     // turbo
     `npx grep -r "name=\"heroicons" app/ || echo "No old heroicons found (pass)"`

4. **Review `app.config.ts`**
   - Verify that the UI configuration is correctly structured for v4 (e.g., configuring `primary` and `neutral` under `ui.colors`).
