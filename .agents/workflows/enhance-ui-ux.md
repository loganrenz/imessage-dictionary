---
description:
  Comprehensive UI/UX enhancement and polish using the uipro skill — icons,
  interactions, contrast, layout, accessibility, and pre-delivery checklist
---

# Enhance UI/UX

This workflow uses the `ui-ux-pro-max` skill (installed via `uipro` CLI) to
audit and enhance the visual quality, interaction design, and accessibility of
the app. It applies the skill's professional UI rules and pre-delivery checklist
to catch common issues that make interfaces look unpolished.

> **Prerequisite:** The `uipro` skill must be installed. Run
> `uipro init --ai antigravity` from the project root if
> `.agent/skills/ui-ux-pro-max/` does not exist.

> **Related workflows:**
>
> - `/enhance-design-system` — Generate design system using uipro skill
> - `/audit-nuxt-ui-pro` — Nuxt UI Pro component adoption audit
> - `/check-ui-styling` — Tailwind v4 CSS import order and token usage

---

## Step 1: Load or Generate Design System

Check for an existing persisted design system:

// turbo
`ls design-system/MASTER.md 2>/dev/null && echo "Design system found" || echo "No design system — run /enhance-design-system first"`

If no design system exists, run `/enhance-design-system` to generate one before
proceeding.

If one exists, read `design-system/MASTER.md` to understand the app's intended
visual language.

---

## Step 2: UX Guidelines Audit

Search for common UX issues specific to the app:

```bash
# Animation best practices
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "animation transition micro-animation" --domain ux

# Accessibility fundamentals
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "accessibility contrast keyboard focus" --domain ux

# Loading and performance UX
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "loading skeleton empty-state error" --domain ux

# Z-index and layering
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "z-index stacking modal overlay" --domain ux

# Web interface guidelines
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "aria semantic focus keyboard" --domain web
```

---

## Step 3: Icon & Visual Element Audit

Scan for common visual quality issues:

// turbo
`grep -rn '🎨\|🚀\|⚙️\|📊\|💡\|🔥\|✨\|🎯\|📈\|🔒' app/pages/ app/components/ 2>/dev/null | head -20 || echo "No emoji icons found (good)"`

**Rules (from uipro skill):**

| Rule                       | Do                                              | Don't                                  |
| -------------------------- | ----------------------------------------------- | -------------------------------------- |
| **No emoji icons**         | Use SVG icons (Heroicons, Lucide, Simple Icons) | Use emojis like 🎨 🚀 ⚙️ as UI icons   |
| **Stable hover states**    | Use color/opacity transitions on hover          | Use scale transforms that shift layout |
| **Correct brand logos**    | Research official SVG from Simple Icons         | Guess or use incorrect logo paths      |
| **Consistent icon sizing** | Use fixed viewBox (24x24) with `w-6 h-6`        | Mix different icon sizes randomly      |

---

## Step 4: Interaction & Cursor Audit

// turbo
`grep -rn 'cursor-pointer' app/pages/ app/components/ 2>/dev/null | wc -l`

// turbo
`grep -rn '@click\|v-on:click\|NuxtLink\|to=' app/pages/ app/components/ 2>/dev/null | wc -l`

Compare clickable element count vs `cursor-pointer` usage. Every clickable
element needs a pointer cursor.

**Rules:**

| Rule                   | Do                                                    | Don't                                        |
| ---------------------- | ----------------------------------------------------- | -------------------------------------------- |
| **Cursor pointer**     | Add `cursor-pointer` to all clickable/hoverable cards | Leave default cursor on interactive elements |
| **Hover feedback**     | Provide visual feedback (color, shadow, border)       | No indication element is interactive         |
| **Smooth transitions** | Use `transition-colors duration-200`                  | Instant state changes or too slow (>500ms)   |

---

## Step 5: Light/Dark Mode Contrast Audit

// turbo
`grep -rn 'bg-white/10\|bg-white/20\|bg-white/30' app/ 2>/dev/null | head -10 || echo "No low-opacity white backgrounds found"`

// turbo
`grep -rn 'text-gray-400\|text-slate-400\|text-neutral-400' app/ 2>/dev/null | head -10 || echo "No low-contrast text found"`

**Rules:**

| Rule                      | Do                                  | Don't                                   |
| ------------------------- | ----------------------------------- | --------------------------------------- |
| **Glass card light mode** | Use `bg-white/80` or higher opacity | Use `bg-white/10` (too transparent)     |
| **Text contrast light**   | Use `#0F172A` (slate-900) for text  | Use `#94A3B8` (slate-400) for body text |
| **Muted text light**      | Use `#475569` (slate-600) minimum   | Use gray-400 or lighter                 |
| **Border visibility**     | Use `border-gray-200` in light mode | Use `border-white/10` (invisible)       |

---

## Step 6: Layout & Spacing Audit

// turbo `grep -rn 'top-0.*left-0\|fixed.*inset-0' app/ 2>/dev/null | head -10`

// turbo
`grep -rn 'max-w-[0-9]\|max-w-sm\|max-w-md\|max-w-lg\|max-w-xl\|max-w-2xl\|max-w-3xl\|max-w-4xl\|max-w-5xl\|max-w-6xl\|max-w-7xl' app/ 2>/dev/null | head -10`

**Rules:**

| Rule                     | Do                                  | Don't                                  |
| ------------------------ | ----------------------------------- | -------------------------------------- |
| **Floating navbar**      | Add `top-4 left-4 right-4` spacing  | Stick navbar to `top-0 left-0 right-0` |
| **Content padding**      | Account for fixed navbar height     | Let content hide behind fixed elements |
| **Consistent max-width** | Use same `max-w-6xl` or `max-w-7xl` | Mix different container widths         |

---

## Step 7: Pre-Delivery Checklist

Run through the full uipro skill checklist:

### Visual Quality

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] Brand logos are correct (verified from Simple Icons)
- [ ] Hover states don't cause layout shift
- [ ] Use theme colors directly (`bg-primary`) not `var()` wrapper

### Interaction

- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear visual feedback
- [ ] Transitions are smooth (150-300ms)
- [ ] Focus states visible for keyboard navigation

### Light/Dark Mode

- [ ] Light mode text has sufficient contrast (4.5:1 minimum)
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both modes
- [ ] Test both modes before delivery

### Layout

- [ ] Floating elements have proper spacing from edges
- [ ] No content hidden behind fixed navbars
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

### Accessibility

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] `prefers-reduced-motion` respected

---

## Step 8: Compile Report

Present findings grouped by category:

| Category               | Severity | What to Fix                                  |
| ---------------------- | -------- | -------------------------------------------- |
| 🔴 Emoji icons         | Critical | Replace with SVG icons from Lucide/Heroicons |
| 🔴 Missing cursors     | Critical | Add `cursor-pointer` to interactive elements |
| 🟠 Low contrast        | High     | Increase text/background contrast ratios     |
| 🟠 Layout shift        | High     | Fix hover states causing element movement    |
| 🟡 Missing transitions | Medium   | Add `transition-colors duration-200`         |
| 🟢 Motion polish       | Nice     | Add micro-animations, page transitions       |

Ask the user for approval before making changes. Apply fixes and re-run the
checklist.
