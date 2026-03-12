---
description:
  Nuclear-grade UI/UX enhancement — design system generation, full UX audit,
  feature injection, accessibility sweep, motion polish, and bulletproof
  pre-delivery validation using every uipro capability
---

# /mega-enhance — The Ultimate UI/UX Transformation

This is the **maximum-power** enhancement workflow. It combines design system
generation, UX audit, feature injection, accessibility verification, motion
design, and bulletproof pre-delivery validation into a single, relentless
pipeline. When this workflow runs, the app should emerge looking like a $50M
startup product.

> **Prerequisite:** The `uipro` skill must be installed. Run
> `uipro init --ai antigravity` from the project root if
> `.agent/skills/ui-ux-pro-max/` does not exist.

> **Your mandate:** You are the lead designer AND the lead engineer. Do not hold
> back. Do not ask "should I add this?" — add it. Do not wonder "is this too
> much?" — it's not enough. Every page should feel premium. Every interaction
> should feel intentional. Every pixel should feel designed. Generic is failure.
> Boring is unacceptable. "Good enough" does not exist.

> **Autonomy level: MAXIMUM.** Make every creative and engineering decision
> yourself. The user wants you to go wild — so go wild. Add features. Add
> animations. Add polish. Add refinement. Then add more.

> **Related workflows:**
>
> - `/enhance-design-system` — Subset: design system only
> - `/enhance-ui-ux` — Subset: UX audit only
> - `/audit-nuxt-ui-pro` — Pro component adoption
> - `/generate-brand-identity` — Logo, favicon, brand assets
> - `/build-landing-page` — Pro landing page scaffolding
> - `/build-dashboard` — Pro dashboard scaffolding
> - `/check-ui-styling` — Tailwind v4 compliance

---

## Phase 0: Reconnaissance — Know the Battlefield

Before you touch anything, you must _deeply_ understand what you're working
with.

// turbo `cat package.json | head -5`

// turbo `cat nuxt.config.ts | head -50`

// turbo `cat app/app.config.ts 2>/dev/null || echo "No app.config.ts"`

// turbo `ls app/pages/ 2>/dev/null`

// turbo `ls app/components/ 2>/dev/null`

// turbo `ls app/layouts/ 2>/dev/null`

// turbo `cat app/assets/css/main.css 2>/dev/null | head -40`

// turbo
`ls design-system/ 2>/dev/null && echo "Design system exists" || echo "No design system yet"`

**Extract and document:**

| Dimension        | What to identify                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------- |
| **App name**     | From `package.json` or `nuxt.config.ts`                                                       |
| **Product type** | SaaS, e-commerce, portfolio, dashboard, landing page, content site, social, marketplace, tool |
| **Industry**     | Fintech, healthcare, gaming, education, beauty, industrial, food, media, dev tools, etc.      |
| **Audience**     | Developers? Consumers? Enterprise? Teens? Professionals?                                      |
| **Style feel**   | Current vibe — minimal, playful, professional, dark, industrial, etc.                         |
| **Page count**   | How many pages exist, which are landing vs. dashboard vs. content                             |
| **Weaknesses**   | What's obviously missing, broken, or ugly                                                     |

---

## Phase 1: Generate Master Design System (uipro --design-system)

Use every relevant keyword to get the richest possible design system:

```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <audience> <style_keywords> premium modern polished" --design-system --persist -p "<App Name>" -f markdown
```

**Critical:** Use `--persist` to save to `design-system/MASTER.md`. This becomes
the source of truth for ALL subsequent work.

### Generate Page-Specific Overrides

For EVERY distinct page type in the app, generate a page-specific override:

```bash
# Landing / marketing pages
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product> landing hero social-proof conversion" --design-system --persist -p "<App Name>" --page "landing"

# Dashboard / admin pages
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product> dashboard analytics data-dense professional" --design-system --persist -p "<App Name>" --page "dashboard"

# Auth pages (login, register)
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product> auth login trust security" --design-system --persist -p "<App Name>" --page "auth"

# Settings / profile pages
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product> settings form professional clean" --design-system --persist -p "<App Name>" --page "settings"

# Content / blog pages
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product> content blog reading typography" --design-system --persist -p "<App Name>" --page "content"

# Pricing pages
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product> pricing comparison conversion trust" --design-system --persist -p "<App Name>" --page "pricing"
```

Only generate overrides for page types that actually exist in the app.

---

## Phase 2: Deep Domain Intelligence Extraction

Exhaust every uipro domain to extract maximum design intelligence. Run ALL of
these:

### 2a. Style Deep-Dive

```bash
# Primary style exploration
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<primary_style> premium polished" --domain style -n 5

# Secondary style variants
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "glassmorphism modern gradient depth" --domain style -n 3

# Dark mode specific styles
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "dark mode depth glow neon" --domain style -n 3
```

### 2b. Typography Deep-Dive

```bash
# Primary font pairing exploration
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<audience> <mood> professional" --domain typography -n 5

# Alternative pairings for variety
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "modern geometric clean tech" --domain typography -n 3

# Display/heading font alternatives
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "bold striking headline display" --domain typography -n 3
```

### 2c. Color Palette Deep-Dive

```bash
# Primary palette
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry>" --domain color -n 5

# Accent and secondary palettes
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "accent vibrant contrast highlight" --domain color -n 3
```

### 2d. UX Guidelines — The Full Sweep

```bash
# Animation and motion best practices
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "animation transition micro-animation motion" --domain ux -n 5

# Accessibility fundamentals
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "accessibility contrast keyboard focus screen-reader" --domain ux -n 5

# Loading states, empty states, error handling
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "loading skeleton empty-state error feedback" --domain ux -n 5

# Z-index, layering, modal management
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "z-index stacking modal overlay tooltip popover" --domain ux -n 5

# Form UX
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "form validation input feedback error-handling" --domain ux -n 5

# Navigation patterns
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "navigation breadcrumb sidebar tabs" --domain ux -n 3
```

### 2e. Web Interface Guidelines

```bash
# Semantic HTML and ARIA
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "aria semantic focus keyboard landmark" --domain web -n 5

# Performance UX
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "performance virtualize lazy-load image" --domain web -n 3
```

### 2f. Landing Page Structure (if applicable)

```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "hero social-proof testimonial pricing cta" --domain landing -n 5
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "conversion optimization trust-signals urgency" --domain landing -n 3
```

### 2g. Chart Recommendations (if data-heavy)

```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "dashboard analytics real-time trend" --domain chart -n 5
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "comparison funnel timeline distribution" --domain chart -n 3
```

### 2h. Icon Recommendations

```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product_type> navigation action" --domain icons -n 5
```

### 2i. Stack-Specific Vue/Nuxt Best Practices

```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "layout responsive form animation transition component" --stack vue
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "performance optimization lazy-load virtual-scroll" --stack vue
```

### 2j. Product-Specific Patterns

```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> best-practices" --domain product -n 3
```

---

## Phase 3: Apply Design System to Theme

Take everything from Phase 1 and 2 and apply it with precision:

### 3a. Update `app/assets/css/main.css`

```css
@import url('https://fonts.googleapis.com/css2?family=<Display+Font>:wght@400;500;600;700;800&family=<Body+Font>:wght@300;400;500;600&display=swap');
@import 'tailwindcss';
@import '@nuxt/ui';

@theme {
  /* Typography */
  --font-sans: '<Body Font>', system-ui, sans-serif;
  --font-display: '<Display Font>', system-ui, sans-serif;

  /* Shape Language */
  --radius-card: <value>;
  --radius-button: <value>;

  /* Custom Shadows */
  --shadow-card: <value>;
  --shadow-card-hover: <value>;
  --shadow-glow: <value>;

  /* Custom Animations */
  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-slide-up: slide-up 0.4s ease-out;
  --animate-scale-in: scale-in 0.2s ease-out;
  --animate-float: float 3s ease-in-out infinite;
}

/* Custom Keyframes */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-6px);
  }
}

/* Respect motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 3b. Update `app/app.config.ts`

```ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: '<chosen-primary>',
      neutral: '<chosen-neutral>',
    },
  },
})
```

### 3c. Remove Anti-Patterns

Check against the design system's anti-pattern list and proactively remove:

- Emoji icons → replace with Lucide SVG icons
- Hardcoded hex colors → replace with theme tokens
- Generic Tailwind colors → replace with semantic colors
- `@apply` in scoped styles → inline utilities or CSS variables
- Deprecated Tailwind v3 classes → v4 equivalents

---

## Phase 4: Feature Injection — Go Wild

This is where you earn your keep. **Add real features and enhancements.** Not
someday. NOW.

### 4a. Page Transitions

Add smooth route transitions if not already present:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },
})
```

```css
/* In main.css */
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.layout-enter-active,
.layout-leave-active {
  transition: opacity 0.3s ease;
}
.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}
```

### 4b. Scroll-Triggered Animations

Create a reusable `useScrollReveal` composable:

```ts
// app/composables/useScrollReveal.ts
export function useScrollReveal() {
  onMounted(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    )
    document
      .querySelectorAll('.reveal-on-scroll')
      .forEach((el) => observer.observe(el))
  })
}
```

### 4c. Toast Notifications for All Mutations

Verify every create/update/delete action shows toast feedback:

// turbo
`grep -rn 'useToast\|toast\.' app/ 2>/dev/null | grep -v 'node_modules' | wc -l`

// turbo
`grep -rn '\$fetch.*method.*POST\|\$fetch.*method.*PUT\|\$fetch.*method.*DELETE\|useFetch.*method.*POST' app/ 2>/dev/null | wc -l`

Compare mutation count vs toast count. **Every mutation needs toast feedback.**

### 4d. Loading States — Every Data-Driven Page

// turbo `grep -rnl 'USkeleton' app/ 2>/dev/null | wc -l`

// turbo
`grep -rnl 'useFetch\|useAsyncData\|$fetch' app/pages/ app/components/ 2>/dev/null | wc -l`

Every page/component that fetches data MUST have:

- `USkeleton` placeholders during loading (not spinners, not blank space)
- `UEmpty` component when data is empty
- `UAlert` for error states

### 4e. Empty States — No Blank Pages, Ever

// turbo `grep -rnl 'UEmpty' app/ 2>/dev/null | wc -l`

If any list, table, or search result page can have zero items, it MUST have a
beautiful empty state with:

- A relevant icon
- A clear message
- A call-to-action button where applicable

### 4f. Keyboard Navigation & Shortcuts

Add `UDashboardSearch` or CommandPalette if not present (Cmd+K / Ctrl+K):

// turbo
`grep -rn 'DashboardSearch\|CommandPalette\|defineShortcuts\|useKeyboard' app/ 2>/dev/null | head -10`

Consider adding keyboard shortcuts for common actions using `defineShortcuts()`.

### 4g. Color Mode Toggle

// turbo
`grep -rn 'ColorModeButton\|ColorModeSelect' app/ 2>/dev/null | head -5`

If missing, add `<UColorModeButton />` to the header/navbar. **Every app needs a
color mode toggle.**

### 4h. Breadcrumbs for Deep Navigation

// turbo `grep -rn 'UBreadcrumb\|Breadcrumb' app/ 2>/dev/null | head -5`

Add breadcrumbs to any page more than 1 level deep.

### 4i. Scroll-to-Top

For long content pages, add a smooth scroll-to-top button that appears after
scrolling down.

### 4j. Image Optimization

// turbo
`grep -rn '<img ' app/ 2>/dev/null | grep -v 'NuxtImg\|nuxt-img' | head -10`

Replace all `<img>` tags with `<NuxtImg>` for automatic optimization, lazy
loading, and responsive sizing.

---

## Phase 5: Pro Component Adoption Audit

Verify the app uses Nuxt UI Pro primitives instead of reinventing layout:

### 5a. Landing Pages

// turbo
`grep -rnl 'PageHero\|PageSection\|PageFeature\|PageCTA\|PageGrid\|PageColumns' app/ 2>/dev/null || echo "No Pro landing components"`

If landing pages exist but use raw `<div>` layouts, **refactor to Pro
components**.

### 5b. Dashboard Pages

// turbo
`grep -rnl 'DashboardGroup\|DashboardSidebar\|DashboardPanel\|DashboardNavbar\|DashboardToolbar' app/ 2>/dev/null || echo "No Pro dashboard components"`

### 5c. Layout Components

// turbo
`grep -rnl 'UHeader\|UFooter\|UMain\|UContainer' app/ 2>/dev/null || echo "No Pro layout components"`

### 5d. UApp Wrapper

// turbo
`grep -c 'UApp' app/app.vue 2>/dev/null || echo "UApp not found in app.vue — CRITICAL"`

`app.vue` MUST wrap everything in `<UApp>` for toast, modal, and color mode
support.

---

## Phase 6: Bulletproof Visual Audit

### 6a. Icon Audit — Zero Emojis

// turbo
`grep -rn '🎨\|🚀\|⚙️\|📊\|💡\|🔥\|✨\|🎯\|📈\|🔒\|📱\|🌟\|💪\|🎉\|❌\|✅\|⚠️\|🔑\|📋\|🏆' app/pages/ app/components/ 2>/dev/null | head -20 || echo "No emoji icons (good)"`

**Zero tolerance.** Replace every emoji used as a UI icon with Lucide SVG
equivalents:

- 🚀 → `i-lucide-rocket`
- ⚙️ → `i-lucide-settings`
- 📊 → `i-lucide-bar-chart-3`
- 💡 → `i-lucide-lightbulb`
- 🔒 → `i-lucide-lock`
- ✅ → `i-lucide-check-circle`
- ❌ → `i-lucide-x-circle`
- ⚠️ → `i-lucide-alert-triangle`

### 6b. Cursor & Interaction Audit

// turbo
`grep -rn 'cursor-pointer' app/pages/ app/components/ 2>/dev/null | wc -l`

// turbo
`grep -rn '@click\|v-on:click\|NuxtLink\|to=' app/pages/ app/components/ 2>/dev/null | wc -l`

**Rule:** Every clickable element MUST have `cursor-pointer`. Compare counts and
fix the gap.

### 6c. Hover State Audit

Every interactive element needs visual hover feedback:

| Element    | Expected Hover Effect                                   |
| ---------- | ------------------------------------------------------- |
| Buttons    | Color/opacity change (Nuxt UI handles this)             |
| Cards      | Lift (`hover:shadow-lg`), subtle scale or border change |
| Links      | Color change, underline                                 |
| Nav items  | Background highlight                                    |
| Table rows | Background highlight                                    |

**Avoid:** Scale transforms that cause layout shift. Use color/opacity/shadow
transitions only. **Require:** `transition-colors duration-200` or
`transition-all duration-200` on all interactive elements.

### 6d. Light Mode Contrast Audit

// turbo
`grep -rn 'bg-white/10\|bg-white/20\|bg-white/30' app/ 2>/dev/null | head -10 || echo "No low-opacity whites"`

// turbo
`grep -rn 'text-gray-400\|text-slate-400\|text-neutral-400' app/ 2>/dev/null | head -10 || echo "No low-contrast text"`

| Rule                      | Do                             | Don't                         |
| ------------------------- | ------------------------------ | ----------------------------- |
| Glass cards in light mode | `bg-white/80` or higher        | `bg-white/10` (invisible)     |
| Body text light mode      | `text-slate-900` (#0F172A)     | `text-slate-400` (#94A3B8)    |
| Muted text light mode     | `text-slate-600` minimum       | `text-gray-400` or lighter    |
| Borders light mode        | `border-gray-200`              | `border-white/10` (invisible) |
| Dark mode backgrounds     | `bg-neutral-900/95` with depth | Flat `#000000`                |

### 6e. Layout & Spacing Audit

// turbo `grep -rn 'top-0.*left-0\|fixed.*inset-0' app/ 2>/dev/null | head -10`

// turbo `grep -rn 'max-w-' app/pages/ app/layouts/ 2>/dev/null | head -10`

| Rule                    | Do                                         | Don't                                  |
| ----------------------- | ------------------------------------------ | -------------------------------------- |
| Fixed navbars           | `top-4 left-4 right-4` floating            | `top-0 left-0 right-0` edge-stuck      |
| Content below fixed nav | Account for navbar height with padding-top | Let content hide behind fixed elements |
| Container widths        | Consistent `max-w-6xl` or `max-w-7xl`      | Mixed max-widths across pages          |

### 6f. Responsive Verification

Every page must work at these breakpoints:

- **375px** — iPhone SE (smallest common)
- **768px** — iPad portrait
- **1024px** — iPad landscape / laptop
- **1440px** — Desktop

// turbo `grep -rn 'sm:\|md:\|lg:\|xl:' app/pages/ 2>/dev/null | wc -l`

Flag any page with zero responsive breakpoint usage.

### 6g. Horizontal Scroll Check

// turbo
`grep -rn 'overflow-x-auto\|overflow-x-hidden\|overflow-x-scroll' app/ 2>/dev/null | head -10`

Ensure no unintended horizontal scroll on mobile. Tables should use
`overflow-x-auto` wrappers.

---

## Phase 7: Accessibility Sweep

### 7a. Image Alt Text

// turbo
`grep -rn '<img\|<NuxtImg\|NuxtPicture' app/ 2>/dev/null | grep -v 'alt=' | head -10 || echo "All images have alt text (good)"`

Every image MUST have descriptive `alt` text. Decorative images use `alt=""`.

### 7b. Form Labels

// turbo
`grep -rn '<input\|<textarea\|<select\|UInput\|UTextarea\|USelect' app/ 2>/dev/null | head -20`

Every form input needs an associated `<label>` or `aria-label`.

### 7c. Color-Only Indicators

Ensure color is never the ONLY way to communicate information. Add icons, text,
or patterns alongside color coding.

### 7d. Focus Visibility

// turbo
`grep -rn 'focus:ring\|focus-visible\|focus:outline' app/ 2>/dev/null | head -10`

Keyboard focus must be visible on all interactive elements. Nuxt UI handles this
for its components, but verify custom elements.

### 7e. Heading Hierarchy

// turbo `grep -rn '<h1\|<h2\|<h3\|<h4' app/pages/ 2>/dev/null | head -20`

- Exactly ONE `<h1>` per page
- No skipped levels (h1→h3 without h2)
- Correct semantic hierarchy

### 7f. Reduced Motion

Verify `prefers-reduced-motion` is respected (should be covered by the CSS added
in Phase 3).

---

## Phase 8: Motion & Micro-Animation Polish

### The Motion Manifesto

An interface that moves with purpose feels alive and premium. Motion should:

- **Guide attention** — draw the eye to what changed
- **Provide feedback** — confirm user actions immediately
- **Create continuity** — smooth transitions between states
- **Feel natural** — ease-out for elements entering, ease-in for elements
  leaving
- **Never distract** — if you notice the animation before the content, it's too
  much

### What to Add

| Where               | Animation                   | Implementation                                      |
| ------------------- | --------------------------- | --------------------------------------------------- |
| Page transitions    | Fade + slight Y-translate   | `nuxt.config.ts` pageTransition                     |
| Section reveals     | Fade-up on scroll into view | `useScrollReveal` composable                        |
| Card hover          | Shadow lift + subtle border | `hover:shadow-lg transition-shadow duration-200`    |
| Button interactions | Scale down on press         | `active:scale-95 transition-transform duration-100` |
| Loading data        | Skeleton shimmer            | `USkeleton` with animation                          |
| Counters & stats    | Count-up animation          | Custom `useCountUp` composable                      |
| Toast notifications | Slide in from top-right     | Nuxt UI built-in                                    |
| Modal/dialog enter  | Scale + fade                | Nuxt UI built-in                                    |
| Sidebar collapse    | Width transition            | Nuxt UI Pro built-in                                |
| Tab switching       | Cross-fade                  | `transition-opacity duration-150`                   |
| Dropdown menus      | Scale from origin point     | Nuxt UI built-in                                    |
| Progress indicators | Smooth width transition     | `transition-all duration-300`                       |

### What to Never Do

- ❌ Animations longer than 500ms (feels sluggish)
- ❌ Scale transforms on hover that shift surrounding layout
- ❌ Bouncy spring physics on critical UI elements
- ❌ Auto-playing animations that can't be paused
- ❌ Parallax effects that cause motion sickness
- ❌ Blocking animations that delay user interaction

---

## Phase 9: Dark Mode Deep-Dive

Don't just flip colors — _design_ for dark mode.

// turbo
`grep -rn "preference.*light\|preference.*dark\|colorMode" nuxt.config.ts app/app.config.ts 2>/dev/null | head -5`

### Dark Mode Design Rules

| Element        | Light Mode        | Dark Mode                                         |
| -------------- | ----------------- | ------------------------------------------------- |
| Background     | `bg-white`        | `bg-neutral-950` or `bg-neutral-900` (NOT `#000`) |
| Surface        | `bg-gray-50`      | `bg-neutral-900/80`                               |
| Cards          | `bg-white shadow` | `bg-neutral-800/80 border border-neutral-700/50`  |
| Text primary   | `text-slate-900`  | `text-neutral-100`                                |
| Text secondary | `text-slate-600`  | `text-neutral-400`                                |
| Borders        | `border-gray-200` | `border-neutral-700/50`                           |
| Accents        | Full saturation   | Slightly reduced saturation for eye comfort       |

**Test both modes.** Toggle back and forth. Every element should look
_intentional_ in both modes.

---

## Phase 10: SEO & Meta Verification

// turbo
`grep -rn 'useSeo\|useHead\|useSeoMeta' app/pages/ 2>/dev/null | head -10`

// turbo
`grep -rn 'useSchemaOrg\|defineWebPage\|defineOrganization' app/ 2>/dev/null | head -10`

Every page needs:

- `useSeo()` or `useSeoMeta()` with rich title and description
- Schema.org structured data where applicable
- OG image (custom or generated)
- Correct heading hierarchy (`<h1>` per page)
- Semantic HTML (`<main>`, `<nav>`, `<article>`, `<section>`, `<aside>`)

---

## Phase 11: Pre-Delivery Mega Checklist

Run through EVERY item. Zero tolerance for failures.

### Visual Quality (⛔ = Blocking)

- [ ] ⛔ No emojis used as UI icons (use Lucide SVGs)
- [ ] ⛔ All icons from consistent set (Lucide)
- [ ] ⛔ Brand logos verified (from Simple Icons or official source)
- [ ] ⛔ Hover states don't cause layout shift
- [ ] ⛔ Theme colors used directly (`bg-primary`) not `var()` wrappers
- [ ] Custom shadows and gradients applied per design system
- [ ] Typography hierarchy is clear and consistent

### Interaction (⛔ = Blocking)

- [ ] ⛔ All clickable elements have `cursor-pointer`
- [ ] ⛔ All interactive elements have hover feedback
- [ ] ⛔ Transitions are smooth (150-300ms)
- [ ] ⛔ Focus states visible for keyboard navigation
- [ ] Toast feedback for all mutations
- [ ] Empty states for all data-driven lists
- [ ] Skeleton loaders for all async data

### Light/Dark Mode (⛔ = Blocking)

- [ ] ⛔ Light mode text contrast ≥ 4.5:1 (WCAG AA)
- [ ] ⛔ Glass/transparent elements visible in light mode
- [ ] ⛔ Borders visible in both modes
- [ ] ⛔ Both modes tested and intentional
- [ ] Color mode toggle accessible to users

### Layout (⛔ = Blocking)

- [ ] ⛔ No content hidden behind fixed navbars
- [ ] ⛔ Responsive at 375px, 768px, 1024px, 1440px
- [ ] ⛔ No horizontal scroll on mobile
- [ ] ⛔ UApp wrapper present in app.vue
- [ ] Floating elements have proper edge spacing
- [ ] Consistent container max-widths

### Accessibility

- [ ] ⛔ All images have alt text
- [ ] ⛔ Form inputs have labels or aria-labels
- [ ] ⛔ Color is not the only indicator
- [ ] ⛔ `prefers-reduced-motion` respected
- [ ] Single `<h1>` per page, no skipped levels
- [ ] Semantic HTML used (`<main>`, `<nav>`, `<article>`)
- [ ] Keyboard navigation works for all interactive elements

### Motion & Polish

- [ ] Page transitions configured
- [ ] Scroll-triggered reveal animations on landing pages
- [ ] Micro-interactions on hover/click
- [ ] Skeleton loaders with shimmer animation
- [ ] No animations longer than 500ms

### SEO & Meta

- [ ] Every page has `useSeo()` or equivalent
- [ ] Schema.org data where applicable
- [ ] OG images present
- [ ] Correct heading hierarchy

### Pro Component Adoption

- [ ] Landing pages use `UPageHero`, `UPageSection`, `UPageCTA`, etc.
- [ ] Dashboard pages use `UDashboardGroup`, `UDashboardSidebar`, etc.
- [ ] Layout uses `UHeader`, `UFooter`, `UMain`
- [ ] `UDashboardSearch` or CommandPalette for Cmd+K

---

## Phase 12: Compile Report & Apply Fixes

### Report Format

Present ALL findings in a severity-grouped table:

| Severity    | Category                | Count | Action                             |
| ----------- | ----------------------- | ----- | ---------------------------------- |
| ⛔ Critical | Emoji icons             | N     | Replace with Lucide SVGs           |
| ⛔ Critical | Missing cursor-pointer  | N     | Add to all interactive elements    |
| ⛔ Critical | UApp wrapper missing    | 1     | Wrap app.vue content               |
| 🔴 High     | Low contrast text       | N     | Increase to minimum ratios         |
| 🔴 High     | Missing loading states  | N     | Add USkeleton placeholders         |
| 🔴 High     | No empty state handling | N     | Add UEmpty components              |
| 🟠 Medium   | Missing transitions     | N     | Add transition-colors duration-200 |
| 🟠 Medium   | No page transitions     | 1     | Configure in nuxt.config.ts        |
| 🟡 Low      | No scroll reveal anims  | N     | Add useScrollReveal                |
| 🟢 Polish   | Additional micro-anims  | N     | Add hover/click feedback           |

### Execution Order

**DO NOT ask for permission.** Apply all fixes immediately in this order:

1. ⛔ Critical fixes (blocking issues)
2. 🔴 High severity (major UX gaps)
3. 🟠 Medium severity (noticeable improvements)
4. 🟡 Low severity (nice-to-haves)
5. 🟢 Polish (the cherry on top)

Then re-run the checklist to verify zero remaining issues.

---

## Quick Reference: All uipro CLI Commands

| Command                     | Purpose                           | When to Use                          |
| --------------------------- | --------------------------------- | ------------------------------------ |
| `--design-system`           | Generate full design system       | Always first                         |
| `--design-system --persist` | Save to `design-system/MASTER.md` | Always — persistence is free         |
| `--page "dashboard"`        | Page-specific override            | Per distinct page type               |
| `--domain style`            | Style exploration                 | Deep-diving into visual treatment    |
| `--domain typography`       | Font pairing search               | Finding the perfect type combination |
| `--domain color`            | Color palette search              | Expanding palette options            |
| `--domain ux`               | UX guidelines                     | Animation, accessibility, patterns   |
| `--domain web`              | Web interface standards           | ARIA, semantics, keyboard nav        |
| `--domain landing`          | Landing page structure            | Hero, CTA, social proof strategies   |
| `--domain chart`            | Chart recommendations             | Data-heavy dashboards                |
| `--domain icons`            | Icon recommendations              | UI icon selection                    |
| `--domain product`          | Product-type patterns             | Industry-specific recommendations    |
| `--domain prompt`           | AI prompt keywords                | CSS and style generation prompts     |
| `--domain react`            | React performance                 | React-specific optimization          |
| `--stack vue`               | Vue/Nuxt best practices           | Implementation guidance              |
| `--stack html-tailwind`     | Tailwind best practices           | CSS implementation                   |
| `-n 5`                      | Increase results to 5             | When you want more options           |
| `-f markdown`               | Markdown output format            | When persisting or documenting       |
| `--json`                    | JSON output                       | Programmatic processing              |

---

## Philosophy: What Makes This Workflow Different

1. **Exhaustive, not selective.** Every uipro domain gets queried. Every page
   type gets an override. Every audit check gets run.
2. **Additive, not just corrective.** Don't just fix problems — add features the
   user didn't ask for but will love.
3. **Opinionated, not neutral.** Make strong design decisions. Pick the perfect
   font, not "a font." Choose the exact right animation timing, not "some
   animation."
4. **Zero tolerance.** The checklist is pass/fail. Every ⛔ item must be
   resolved before delivery.
5. **Show, don't ask.** Apply changes, take screenshots, present the result.
   Don't ask "should I add page transitions?" — add them and show the result.
