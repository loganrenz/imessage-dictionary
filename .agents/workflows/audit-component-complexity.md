---
description:
  Audit for component file size, proper separation of pages/components, reducing
  lines of code (LOC), and promoting component reuse.
---

# Component Complexity & Reuse Audit

This workflow defines the standards for keeping the Nuxt 4 frontend lean,
maintaining a clear boundary between view-only "Pages" and reusable
"Components", and identifying bloated files that need decomposition.

---

## 1. File Size & Line Count Audit

We aim for highly focused components. Large files are harder to test, maintain,
and reason about.

1. **Identify Bloated Components:** // turbo
   `find app/components -name "*.vue" -exec wc -l {} + | sort -rn | head -10`
   - **Threshold:** Components exceeding **300 lines** should be prioritized for
     audit.
   - Look for large `<script setup>` blocks (logic bloat) or massive
     `<template>` blocks (UI bloat).
   - If a component is large due to logic, move logic to a **Composable**.
   - If a component is large due to UI volume, split into **Sub-components**.

2. **Identify Bloated Pages:** // turbo
   `find app/pages -name "*.vue" -exec wc -l {} + | sort -rn | head -10`
   - Pages often grow large because they contain inline UI patterns (modals,
     forms, list items) that haven't been abstracted yet.

---

## 2. Separation of Concerns (Pages vs. Components)

Pages should be "Orchestrators", not "Implementers".

1. **The "Fat Page" Antipattern:**
   - Audit `app/pages/` for direct usage of complex Tailwind layouts, inline
     `<svg>` icons, or massive form definitions.
   - **Page Responsibility:** Data fetching (via `useAsyncData`), SEO meta, and
     high-level layout orchestration.
   - **Action:** If a Page contains a distinct UI section (e.g., a "User Profile
     Header" or "Analytics Chart Group"), it must be extracted to
     `app/components/[feature]/`.

2. **Template Redundancy:**
   - Scan for repetitive layout code across multiple pages. If 3 pages use the
     same "Section Title + Description + Separator" pattern, it must be a
     reusable component.

---

## 3. Component Reuse & Nuxt UI Alignment

1. **Reinventing the Wheel:** // turbo
   `grep -rn "button\|input\|select" app/components app/pages | grep -v "UButton\|UInput\|USelect" | head -10`
   - Audit for raw HTML elements or custom CSS classes that mimic Nuxt UI Pro
     components.
   - **Rule:** Use Nuxt UI components (`UButton`, `UInput`, etc.) for all
     primitive interactions to ensure design system consistency and built-in
     accessibility.

2. **Prop-Based Abstraction:**
   - Look for components that are nearly identical but have hardcoded values
     (e.g., `CardA.vue` and `CardB.vue`).
   - **Refactor:** Merge into a single component using props and slots to handle
     variations.

---

## 4. Logical Optimization (Reducing LOC)

1. **Composable Extraction:**
   - Identify repetitive logic blocks (form validation, data transformation,
     complex filters).
   - **Goal:** Move this logic into `app/composables/` to share across
     components and reduce the script size of individual `.vue` files.

2. **Computed vs. Ref:**
   - Audit for manual `watch` or `ref` updates that could be simplified into a
     single `computed` property, which is more declarative and reduces line
     count.

---

## 5. Audit Report & Refactoring Plan

Produce a report with the following structure:

| File Path                  | LOC | Issue                    | Recommendation                               |
| -------------------------- | --- | ------------------------ | -------------------------------------------- |
| `app/pages/index.vue`      | 450 | Fat Page (Inline Modals) | Extract modals to `app/components/home/`     |
| `app/components/Chart.vue` | 320 | Logic Bloat              | Move D3/Chart logic to `useChart` composable |
| `app/components/MyBtn.vue` | 50  | Reinventing Wheel        | Replace with standard `UButton`              |

Present the findings and wait for user preference on which file to refactor
first.
