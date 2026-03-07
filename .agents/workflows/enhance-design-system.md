---
description:
  Generate and persist a complete design system using the uipro skill — styles,
  palettes, typography, effects, and anti-patterns
---

# Enhance Design System

This workflow uses the `ui-ux-pro-max` skill (installed via `uipro` CLI) to
generate a comprehensive, project-specific design system. The design system
provides curated styles, color palettes, typography, effects, and anti-patterns
tailored to your app's domain.

> **Prerequisite:** The `uipro` skill must be installed. Run
> `uipro init --ai antigravity` from the project root if
> `.agent/skills/ui-ux-pro-max/` does not exist.

> **Related workflows:**
>
> - `/audit-nuxt-ui-pro` — Nuxt UI Pro component adoption audit
> - `/enhance-ui-ux` — UX enhancement & polish using uipro skill
> - `/generate-brand-identity` — Full brand identity workflow (logo, colors,
>   fonts)

---

## Step 1: Analyze the App

Before generating, understand what you're designing for.

// turbo `cat nuxt.config.ts | head -30`

// turbo
`cat app/app.config.ts 2>/dev/null | head -30 || echo "No app.config.ts found"`

// turbo `ls app/pages/ 2>/dev/null`

Identify:

- **App name** — from `nuxt.config.ts` or `package.json`
- **Product type** — SaaS, e-commerce, portfolio, dashboard, landing page,
  content site, etc.
- **Industry** — fintech, healthcare, gaming, education, beauty, etc.
- **Style keywords** — minimal, playful, professional, elegant, dark mode,
  industrial, etc.
- **Current theme** — check `app/assets/css/main.css` for existing `@theme`
  tokens

---

## Step 2: Generate Design System

Run the design system generator with project-specific keywords:

```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <style_keywords>" --design-system -p "<App Name>"
```

**Examples:**

```bash
# SaaS dashboard
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "saas dashboard analytics professional" --design-system -p "Loadtest"

# E-commerce storefront
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "ecommerce industrial catalog professional" --design-system -p "Circuit Breakers"

# Content/blog site
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "content blog local news community" --design-system -p "Austin Texas Net"

# Trading app
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "fintech trading stocks gamification dark" --design-system -p "Stonx"
```

The output includes:

1. **Recommended pattern** — layout and interaction model
2. **Style** — visual treatment (glassmorphism, neumorphism, minimalism, etc.)
3. **Color palette** — primary, secondary, accent colors with hex codes
4. **Typography** — font pairings from Google Fonts
5. **Effects** — shadows, gradients, animations
6. **Anti-patterns** — what to avoid for this type of app

---

## Step 3: Persist Design System

To save for future sessions and page-specific overrides:

```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "<App Name>"
```

This creates:

- `design-system/MASTER.md` — Global source of truth
- `design-system/pages/` — Folder for page-specific overrides

**For page-specific overrides:**

```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "<App Name>" --page "dashboard"
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "<App Name>" --page "landing"
```

---

## Step 4: Supplement with Domain Searches

Get deeper recommendations for specific design concerns:

```bash
# Typography alternatives
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "elegant modern professional" --domain typography

# Color palette options
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "saas professional" --domain color

# Style exploration
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "glassmorphism dark gradient" --domain style

# Chart recommendations (for data-heavy apps)
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "real-time dashboard analytics" --domain chart

# Landing page structure
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "hero social-proof pricing" --domain landing
```

---

## Step 5: Get Stack-Specific Guidelines

For Vue/Nuxt implementation best practices:

```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "layout responsive form animation" --stack vue
```

Available stacks: `html-tailwind`, `react`, `nextjs`, `vue`, `svelte`,
`swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`

---

## Step 6: Apply to Theme

Take the generated design system and apply it to the app:

1. **Colors** → Update `app/assets/css/main.css` `@theme` block with recommended
   palette
2. **Typography** → Update `@theme` font families, ensure `@nuxt/fonts` loads
   them
3. **Effects** → Add recommended shadows, gradients, and animations to the theme
4. **Anti-patterns** → Remove any flagged patterns from existing code

Cross-reference with `/generate-brand-identity` for full logo, favicon, and OG
image generation.

---

## Domain Search Quick Reference

| Domain       | Use For                        | Example Keywords                                |
| ------------ | ------------------------------ | ----------------------------------------------- |
| `product`    | Product type recommendations   | SaaS, e-commerce, portfolio, healthcare         |
| `style`      | UI styles, effects             | glassmorphism, minimalism, dark mode, brutalism |
| `typography` | Font pairings (Google Fonts)   | elegant, playful, professional, modern          |
| `color`      | Color palettes by product type | saas, ecommerce, healthcare, fintech            |
| `landing`    | Page structure, CTA strategies | hero, testimonial, pricing, social-proof        |
| `chart`      | Chart types, library recs      | trend, comparison, timeline, funnel             |
| `ux`         | Best practices, anti-patterns  | animation, accessibility, z-index, loading      |
| `web`        | Web interface guidelines       | aria, focus, keyboard, semantic                 |
| `prompt`     | AI prompts, CSS keywords       | (style name)                                    |
