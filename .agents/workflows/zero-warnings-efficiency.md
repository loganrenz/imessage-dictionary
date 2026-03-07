---
description:
  Maximize efficiency in getting zero errors and zero warnings across the fleet
---

# Zero Warnings & Errors Workflow

This workflow is designed to systematically burn down all ESLint/TypeScript/Vue
warnings and errors across the Narduk Nuxt Template fleet.

The "Zero Errors & Warnings Policy" is a strict institutional standard. **We do
not suppress warnings**; we root-cause and fix them.

## Prerequisites

- Working within the `narduk-nuxt-template` monorepo.
- Fleet apps cloned locally in `~/new-code/template-apps/`.

## Step 1: Run the Fleet Quality Check

1. Run `pnpm quality:fleet` from the monorepo root for a fleet baseline.
2. **Fleet Blitz (Optional)**: If there are many fixable warnings, run
   `pnpm quality:fleet --fix` to automatically resolve what can be automated
   across the whole fleet.

## Step 2: Target One Failing App

Focus on the **lowest hanging fruit** or the most critical failure first.

1. Pick an app from the summary failure list.
2. Run targeted quality to see details:
   `pnpm quality:fleet --filter=APP_NAME --no-pull`.

## Step 3: Run Local Quality & Fix

1. `cd` into the app (e.g., `cd ~/new-code/template-apps/APP_NAME/apps/web`).
2. Run `pnpm run quality` (or `pnpm run quality --fix`).

## Step 4: Categorize and Fix Issues

Attack in this order:

1. **TypeScript Errors**: Fix immediately (structural).
2. **Vue Compiler Warnings**: Prop types, hydration, complex expressions.
3. **ESLint Warnings**: Formatting, logic patterns (e.g., `unicorn/prefer-at`,
   `unicorn/prefer-string-replace-all`).

### Common Institutional Fixes:

- **Template Complexity**: Move complex logic from `<template>` to `computed()`.
- **String Replace**: Use `.replaceAll()` if applicable, or fix regex.
- **Array Access**: Use `.at(-1)` instead of `[length - 1]`.
- **isNaN**: Use `Number.isNaN`.

## Step 5: Verify & Commit

1. Verify it runs clean: `pnpm run quality`.
2. Commit and push:

```bash
git add .
git commit -m "chore: resolve quality warnings and errors"
git push origin main
```

## Step 6: Verify Fleet Resolution

Return to monorepo root and verify the app is now green in the fleet summary:
`pnpm quality:fleet --filter=APP_NAME --no-pull`
