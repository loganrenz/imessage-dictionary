---
description:
  Holistic brand identity workflow — audits the app's purpose, reinvents or
  refines its visual identity, generates all creative assets, and applies
  end-to-end design polish
---

# /generate-brand-identity

Transform a Nuxt 4 app from functional skeleton into a visually stunning,
emotionally resonant product with a unified brand identity. This is not a
checklist — it is a creative brief. Study the app, understand its soul, and
craft something beautiful.

> **Your mandate:** Every decision — color, type, radius, shadow, animation —
> should feel _intentional_, as though a senior brand designer spent a week on
> it. Generic is failure. Boring is unacceptable.

> **Autonomy:** You are the creative director. **Do not ask the user any
> questions.** Analyze the app, make every creative decision yourself, execute
> the full pipeline, and present the finished result. This is _your_ project —
> own it.

## Phase 0: Remove ALL Template Branding

**This phase is non-negotiable.** The template ships with default branding that
screams "I'm a scaffold." Purge it completely before building the new identity.

### 0a. Audit for Template Artifacts

Search the entire `apps/web/` directory for these strings and replace or remove
every occurrence:

| Search For                                    | What It Is                               | Action                           |
| --------------------------------------------- | ---------------------------------------- | -------------------------------- |
| `Nuxt 4`                                      | Template name in text/headings           | Replace with app name            |
| `N4`                                          | Template logo/icon reference             | Delete and replace with app logo |
| `Demo`                                        | Placeholder qualifier                    | Remove or replace                |
| `Template`                                    | Scaffold reference                       | Remove or replace                |
| `nard.uk`                                     | Template domain (in UI text, not config) | Replace with app domain          |
| Generic green `#10b981` or emerald references | Default template accent                  | Will be replaced in Phase 2      |

### 0b. Header/Navbar Decision

The template's default `UHeader` with "Home" and a color mode toggle is lazy
scaffolding. Make a deliberate choice:

- **Remove it entirely** if the app is a single-page tool, utility, calculator,
  or simple app. Most apps don't need a navbar. Removing it is a _design
  decision_, not laziness.
- **Redesign it completely** only if navigation genuinely adds value. If you
  keep it, it must have: the app's own logo, meaningful navigation links (not
  just "Home"), and intentional layout.
- **A navbar with just "Home" and a color toggle is UNACCEPTABLE.** If that's
  all there is, remove it.

### 0c. Landing Page

The template's `apps/web/app/pages/index.vue` is a placeholder. It must be
rebuilt from scratch for the app. Do NOT ship the template landing page.

## Phase 1: Discovery & Creative Direction

Before touching any design file, **immerse yourself** in the project.

1. **Read the codebase.** Scan the app's pages, components, layouts, server
   routes, and `nuxt.config.ts`. Understand what kind of product this is — a
   dashboard? a tool? a directory? a content site?

2. **Identify the audience.** Who will use this? Developers? Consumers?
   Enterprise buyers? Hobbyists? The answer changes everything.

3. **Establish the emotional register.** Every great brand evokes a specific
   feeling. Choose ONE primary mood:

   | Mood                         | Colors                            | Type                                            | Shape                            | Motion              |
   | ---------------------------- | --------------------------------- | ----------------------------------------------- | -------------------------------- | ------------------- |
   | _Trustworthy & professional_ | Deep blues, teals                 | Clean sans (Inter, Plus Jakarta Sans)           | Large radii, generous whitespace | Subtle, composed    |
   | _Playful & energetic_        | Saturated pinks, oranges, violets | Rounded sans (Nunito, Quicksand)                | Pill buttons, bouncy corners     | Springy, delightful |
   | _Luxurious & minimal_        | Muted blacks, golds, creams       | Editorial serif (Fraunces, Playfair)            | Sharp corners, tight leading     | Graceful, slow      |
   | _Bold & technical_           | Neon highlights on dark           | Mono accents (JetBrains Mono, Fira Code)        | Hard edges, dense layouts        | Snappy, precise     |
   | _Warm & approachable_        | Earth tones, terracotta, sage     | Humanist sans (Atkinson Hyperlegible, DM Sans)  | Soft shadows, organic shapes     | Gentle, breathing   |
   | _Clean & modern_             | Neutrals with a single accent pop | Geometric sans (Outfit, Manrope, Space Grotesk) | Medium radius, flat surfaces     | Minimal, functional |

4. **🚨 UNIQUENESS CHECK — Fleet Brand Registry.** Before choosing colors and
   fonts, review the table below. This is every app in the Narduk fleet. **Your
   choices MUST be distinct.** Do NOT reuse the same primary color + display
   font combo as any existing app. Strongly prefer a primary color not already
   heavily used.

   | App                          | Primary          | Neutral | Display Font        | Body Font         |
   | ---------------------------- | ---------------- | ------- | ------------------- | ----------------- |
   | ai-media-gen                 | `violet`         | `slate` | Outfit              | Inter             |
   | austin-texas-net             | `neutral`        | `stone` | Playfair Display    | Inter             |
   | circuit-breaker-online       | `brand` (custom) | `zinc`  | Outfit              | Inter             |
   | clawdle                      | `indigo`         | `slate` | Fredoka             | Nunito            |
   | control-plane                | `blue`           | `slate` | (default)           | (default)         |
   | drift-map                    | `teal`           | `stone` | Fraunces            | Manrope           |
   | enigma-box                   | `violet`         | `slate` | Space Grotesk       | DM Sans           |
   | favicon-checker              | `cyan`           | `slate` | Space Grotesk       | Inter             |
   | flashcard-pro                | `indigo`         | `slate` | Plus Jakarta Sans   | DM Sans           |
   | imessage-dictionary          | `amber`          | `stone` | Crimson Pro         | Inter             |
   | nagolnagemluapleira          | `emerald`        | `slate` | Space Grotesk       | Inter             |
   | narduk-enterprises-portfolio | `indigo`         | `slate` | Outfit              | Inter             |
   | ogpreview-app                | `emerald`        | `slate` | (default)           | (default)         |
   | old-austin-grouch            | `amber`          | `stone` | Playfair Display    | Inter             |
   | papa-everetts-pizza          | `red`            | `slate` | Playfair Display SC | Karla             |
   | sailing-passage-map          | —                | —       | —                   | —                 |
   | tide-check                   | `cyan`           | `slate` | Outfit              | Inter             |
   | tiny-invoice                 | `teal`           | `stone` | Plus Jakarta Sans   | (default)         |
   | video-grab                   | `cyan`           | `zinc`  | Syne                | Plus Jakarta Sans |

   **Overused — AVOID unless strongly justified:**
   - Colors: `indigo` (3×), `cyan` (3×), `violet` (2×), `emerald` (2×), `teal`
     (2×), `amber` (2×)
   - Display fonts: Outfit (4×), Space Grotesk (3×), Playfair Display (3×), Plus
     Jakarta Sans (2×)
   - Body fonts: Inter (10×)

   **🎨 PRE-BUILT SCHEME CATALOG — Pick one (or use as a starting point). All
   are unique from the fleet above.**

   _Bold & Technical:_

   | #   | Primary   | Neutral   | Display Font        | Body Font     |
   | --- | --------- | --------- | ------------------- | ------------- |
   | 1   | `rose`    | `slate`   | Sora                | Geist         |
   | 2   | `pink`    | `zinc`    | Lexend              | Albert Sans   |
   | 3   | `fuchsia` | `slate`   | Bricolage Grotesque | Work Sans     |
   | 4   | `sky`     | `zinc`    | JetBrains Mono      | Source Sans 3 |
   | 5   | `orange`  | `stone`   | Instrument Sans     | Rubik         |
   | 6   | `lime`    | `neutral` | Onest               | Noto Sans     |
   | 7   | `yellow`  | `zinc`    | Figtree             | Geist         |
   | 8   | `purple`  | `slate`   | Clash Display       | Lato          |
   | 9   | `rose`    | `zinc`    | Unbounded           | Open Sans     |
   | 10  | `sky`     | `slate`   | Share Tech Mono     | Source Sans 3 |

   _Clean & Modern:_

   | #   | Primary   | Neutral   | Display Font        | Body Font     |
   | --- | --------- | --------- | ------------------- | ------------- |
   | 11  | `sky`     | `neutral` | General Sans        | Work Sans     |
   | 12  | `pink`    | `stone`   | Satoshi             | Rubik         |
   | 13  | `orange`  | `zinc`    | Cabinet Grotesk     | Albert Sans   |
   | 14  | `lime`    | `slate`   | Sora                | Geist         |
   | 15  | `rose`    | `neutral` | Figtree             | Noto Sans     |
   | 16  | `fuchsia` | `zinc`    | Instrument Sans     | Lato          |
   | 17  | `yellow`  | `stone`   | Lexend              | Source Sans 3 |
   | 18  | `purple`  | `neutral` | Onest               | Work Sans     |
   | 19  | `sky`     | `stone`   | Bricolage Grotesque | Rubik         |
   | 20  | `orange`  | `neutral` | Clash Display       | Geist         |

   _Warm & Approachable:_

   | #   | Primary  | Neutral   | Display Font   | Body Font             |
   | --- | -------- | --------- | -------------- | --------------------- |
   | 21  | `orange` | `stone`   | Grandstander   | Atkinson Hyperlegible |
   | 22  | `rose`   | `stone`   | Baloo 2        | Karla                 |
   | 23  | `yellow` | `neutral` | Bubblegum Sans | Open Sans             |
   | 24  | `lime`   | `stone`   | Comfortaa      | Rubik                 |
   | 25  | `pink`   | `neutral` | Righteous      | Albert Sans           |
   | 26  | `amber`  | `neutral` | Lilita One     | Noto Sans             |
   | 27  | `orange` | `neutral` | Boogaloo       | Lato                  |
   | 28  | `rose`   | `neutral` | Chewy          | Work Sans             |
   | 29  | `yellow` | `stone`   | Pacifico       | Source Sans 3         |
   | 30  | `lime`   | `neutral` | Titan One      | Rubik                 |

   _Playful & Energetic:_

   | #   | Primary   | Neutral   | Display Font  | Body Font   |
   | --- | --------- | --------- | ------------- | ----------- |
   | 31  | `pink`    | `slate`   | Fredoka One   | Nunito      |
   | 32  | `fuchsia` | `neutral` | Bangers       | Quicksand   |
   | 33  | `orange`  | `slate`   | Bungee        | Rubik       |
   | 34  | `yellow`  | `zinc`    | Poppins       | Nunito      |
   | 35  | `lime`    | `zinc`    | Luckiest Guy  | Open Sans   |
   | 36  | `rose`    | `slate`   | Bowlby One SC | Albert Sans |
   | 37  | `sky`     | `neutral` | Righteous     | Quicksand   |
   | 38  | `purple`  | `zinc`    | Titan One     | Lato        |
   | 39  | `pink`    | `neutral` | Boogaloo      | Work Sans   |
   | 40  | `fuchsia` | `stone`   | Chewy         | Rubik       |

   _Trustworthy & Professional:_

   | #   | Primary  | Neutral   | Display Font        | Body Font     |
   | --- | -------- | --------- | ------------------- | ------------- |
   | 41  | `blue`   | `zinc`    | Sora                | Source Sans 3 |
   | 42  | `sky`    | `gray`    | Lexend              | Noto Sans     |
   | 43  | `teal`   | `zinc`    | Figtree             | Albert Sans   |
   | 44  | `indigo` | `neutral` | General Sans        | Lato          |
   | 45  | `blue`   | `stone`   | Onest               | Open Sans     |
   | 46  | `cyan`   | `neutral` | Instrument Sans     | Work Sans     |
   | 47  | `sky`    | `zinc`    | Satoshi             | Rubik         |
   | 48  | `teal`   | `gray`    | Cabinet Grotesk     | Noto Sans     |
   | 49  | `blue`   | `neutral` | Bricolage Grotesque | Source Sans 3 |
   | 50  | `indigo` | `zinc`    | Clash Display       | Geist         |

   _Luxurious & Minimal:_

   | #   | Primary   | Neutral   | Display Font       | Body Font         |
   | --- | --------- | --------- | ------------------ | ----------------- |
   | 51  | `amber`   | `zinc`    | Cormorant Garamond | EB Garamond       |
   | 52  | `rose`    | `gray`    | Bodoni Moda        | Libre Baskerville |
   | 53  | `neutral` | `zinc`    | DM Serif Display   | DM Sans           |
   | 54  | `stone`   | `neutral` | Instrument Serif   | Source Serif 4    |
   | 55  | `yellow`  | `gray`    | Yeseva One         | Noto Serif        |
   | 56  | `orange`  | `gray`    | Lora               | Cardo             |
   | 57  | `purple`  | `gray`    | Playfair Display   | Libre Baskerville |
   | 58  | `rose`    | `zinc`    | Cormorant          | EB Garamond       |
   | 59  | `amber`   | `gray`    | DM Serif Text      | Source Serif 4    |
   | 60  | `fuchsia` | `gray`    | Bodoni Moda        | Noto Serif        |

   _Dark & Moody:_

   | #   | Primary   | Neutral | Display Font          | Body Font |
   | --- | --------- | ------- | --------------------- | --------- |
   | 61  | `red`     | `zinc`  | Bebas Neue            | Barlow    |
   | 62  | `orange`  | `slate` | Oswald                | Barlow    |
   | 63  | `fuchsia` | `slate` | Rajdhani              | Exo 2     |
   | 64  | `rose`    | `zinc`  | Teko                  | Barlow    |
   | 65  | `purple`  | `zinc`  | Orbitron              | Exo 2     |
   | 66  | `pink`    | `slate` | Big Shoulders Display | Barlow    |
   | 67  | `amber`   | `slate` | Saira                 | Exo 2     |
   | 68  | `lime`    | `zinc`  | Audiowide             | Rajdhani  |
   | 69  | `sky`     | `slate` | Michroma              | Barlow    |
   | 70  | `yellow`  | `slate` | Black Ops One         | Exo 2     |

   _Editorial & Content:_

   | #   | Primary   | Neutral   | Display Font | Body Font         |
   | --- | --------- | --------- | ------------ | ----------------- |
   | 71  | `emerald` | `stone`   | Newsreader   | Literata          |
   | 72  | `sky`     | `stone`   | Lora         | Source Serif 4    |
   | 73  | `rose`    | `stone`   | Spectral     | Spectral          |
   | 74  | `amber`   | `neutral` | Merriweather | Charter           |
   | 75  | `teal`    | `neutral` | Crimson Text | Noto Serif        |
   | 76  | `indigo`  | `stone`   | Bitter       | Libre Baskerville |
   | 77  | `violet`  | `stone`   | Vollkorn     | EB Garamond       |
   | 78  | `blue`    | `stone`   | Domine       | Cardo             |
   | 79  | `orange`  | `stone`   | Zilla Slab   | Source Serif 4    |
   | 80  | `pink`    | `stone`   | Arvo         | Noto Serif        |

   _Geometric & Futuristic:_

   | #   | Primary   | Neutral | Display Font | Body Font |
   | --- | --------- | ------- | ------------ | --------- |
   | 81  | `cyan`    | `gray`  | Montserrat   | Hind      |
   | 82  | `lime`    | `slate` | Exo 2        | Barlow    |
   | 83  | `fuchsia` | `zinc`  | Rajdhani     | Jost      |
   | 84  | `sky`     | `zinc`  | Urbanist     | Questrial |
   | 85  | `purple`  | `slate` | Saira        | Hind      |
   | 86  | `rose`    | `zinc`  | Chakra Petch | Jost      |
   | 87  | `yellow`  | `slate` | Michroma     | Questrial |
   | 88  | `orange`  | `zinc`  | Orbitron     | Barlow    |
   | 89  | `pink`    | `zinc`  | Audiowide    | Jost      |
   | 90  | `lime`    | `zinc`  | Share Tech   | Hind      |

   _Humanist & Friendly:_

   | #   | Primary   | Neutral   | Display Font | Body Font |
   | --- | --------- | --------- | ------------ | --------- |
   | 91  | `emerald` | `neutral` | Nunito       | Mulish    |
   | 92  | `sky`     | `neutral` | Varela Round | Cabin     |
   | 93  | `orange`  | `neutral` | Baloo 2      | Mulish    |
   | 94  | `pink`    | `neutral` | Comfortaa    | Cabin     |
   | 95  | `lime`    | `stone`   | Quicksand    | Mulish    |
   | 96  | `yellow`  | `neutral` | Sniglet      | Cabin     |
   | 97  | `rose`    | `stone`   | Fredoka      | Mulish    |
   | 98  | `fuchsia` | `neutral` | Grandstander | Cabin     |
   | 99  | `purple`  | `stone`   | Boogaloo     | Mulish    |
   | 100 | `amber`   | `neutral` | Chewy        | Cabin     |

5. **Lock in a creative direction.** Decide on:
   - **Primary Color** — a Nuxt UI / Tailwind color name. **Must not duplicate**
     an overused color unless the display font creates a clearly different look.
   - **Neutral Color** — the complementary gray scale (`slate`, `zinc`, `stone`,
     `neutral`, `gray`).
   - **Display Font** — for headings. Must be from Google Fonts. **Must not
     duplicate** an overused display font unless the primary color creates a
     clearly different look.
   - **Body Font** — for text. Must be from Google Fonts. Prioritize
     readability. **Avoid Inter** (used by 10+ apps) — pick something that gives
     the app its own voice.
   - **Shape Language** — border radius scale, shadow intensity, spacing rhythm.
   - **Visual Tone** — glassmorphism vs. flat, light vs. dark mode bias,
     illustration vs. photography, dense vs. airy.
   - **Signature Motif** — one distinctive visual element: a gradient direction,
     a unique border treatment, an accent pattern, a branded empty-state
     illustration style.

**Proceed immediately.** Do not wait for approval — trust your analysis and move
to Phase 2.

## Phase 2: Configure Theme & Typography

### 2a. Set Nuxt UI Colors

Create or update `apps/web/app/app.config.ts`:

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

### 2b. Set Tailwind v4 Theme Overrides

Create or update `apps/web/app/assets/css/brand.css` (imported by `main.css`):

```css
@theme {
  --font-sans: '<Body Font>', system-ui, sans-serif;
  --font-display: '<Display Font>', system-ui, sans-serif;

  /* Shape language — tune these to the brand personality */
  --radius-card: 1.5rem; /* larger = friendlier, smaller = professional */
  --radius-button: 9999px; /* pill for playful; 0.5rem for professional */
  --radius-badge: 9999px;
  --radius-input: 0.75rem;

  /* Elevation system */
  --shadow-card: 0 1px 3px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.06);
  --shadow-elevated: 0 10px 25px rgb(0 0 0 / 0.1), 0 4px 10px rgb(0 0 0 / 0.06);
  --shadow-overlay: 0 25px 50px rgb(0 0 0 / 0.15);

  /* Motion — override only if the brand calls for different timing */
  /* --transition-fast: 150ms ease;    */
  /* --transition-base: 200ms ease;    */
  /* --transition-slow: 300ms ease;    */
  /* --transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1); */
}
```

Then import it in `apps/web/app/assets/css/main.css`:

```css
@import 'tailwindcss';
@import '@nuxt/ui';
@import './brand.css';
```

> _Note: `@nuxt/fonts` auto-resolves Google Fonts referenced in CSS — no need to
> add `<link>` tags._

### 2c. Color Mode Configuration

**Institutional default: Light mode.** Set in `nuxt.config.ts`:

```ts
colorMode: {
  preference: 'light',
}
```

Dark mode must still be polished — not just Tailwind's default inversion. Verify
backgrounds have depth, text contrast meets WCAG, and colored elements remain
vibrant without being harsh.

### 2d. OG Image Branding

The layer includes OG image templates in `app/components/OgImage/`. If the app
has a custom visual identity, update the OG image template to reflect it:

- Use the brand's primary color as the background or accent
- Include the app logo/icon
- Use the brand's display font for the title text
- Ensure the OG image looks good when shared on Twitter, LinkedIn, and iMessage

If the default layer OG template is sufficient with the new color scheme, leave
it as-is.

## Phase 3: Generate Visual Assets

Use the `generate_image` tool to create **bespoke, high-fidelity imagery** — not
clipart, not stock, not placeholder.

### 3a. Logo / App Icon

Generate a distinctive logo that embodies the brand:

```
Prompt formula: "A [style] app icon for [APP NAME]. [Describe the concept/metaphor].
[Color description using brand palette]. Minimal, clean design.
No text. No device frame. Square aspect ratio, suitable for a favicon at 16x16 and app icon at 180x180."
```

**Logo quality checks:**

- ✅ Recognizable at 16×16 (favicon size) — test this mentally
- ✅ Beautiful at 180×180 (apple-touch-icon)
- ✅ Works on both light and dark backgrounds
- ✅ Uses brand colors, not generic
- ✅ Has a clear concept/metaphor related to the app's function
- ❌ No text in the logo (unreadable at favicon sizes)
- ❌ No gradients with too many colors (muddy at small sizes)
- ❌ No excessive detail (lost at small sizes)

Save to `apps/web/public/favicon.svg`. If generating a PNG, convert or save as
the highest quality source.

### 3b. Hero / Atmospheric Background (if applicable)

Generate an atmospheric background for the landing page, login screen, or hero
section:

```
Prompt formula: "Abstract [mood] background for a [app type] application.
[Brand palette colors], subtle [texture/gradient/geometric pattern].
Widescreen 16:9, cinematic. No text, no UI elements, no device frames."
```

Save to `apps/web/public/images/hero-bg.webp`.

### 3c. Empty State Illustrations (if applicable)

If the app has states where there's no data (empty lists, first-time use, search
with no results), generate branded illustrations:

```
Prompt formula: "Minimal [mood] illustration for an empty state in a [app type] app.
Concept: [what the empty state represents — 'no items yet', 'search returned nothing'].
[Brand colors], clean vector style, transparent-friendly. Square. No text."
```

Save to `apps/web/public/images/empty-*.webp`.

## Phase 4: Generate Favicons & Web Manifest

Run the favicon generator using the logo from Phase 3:

```bash
pnpm generate:favicons -- \
  --target=apps/web/public \
  --name="<Display Name>" \
  --short-name="<Short Name>" \
  --color="<primary-hex>" \
  --bg="<background-hex>"
```

This produces:

| Asset                  | Size    |
| ---------------------- | ------- |
| `apple-touch-icon.png` | 180×180 |
| `favicon-32x32.png`    | 32×32   |
| `favicon-16x16.png`    | 16×16   |
| `favicon.ico`          | 32×32   |
| `site.webmanifest`     | JSON    |

### Update Schema.org (if needed)

Verify `schemaOrg.identity.logo` in `nuxt.config.ts` points to the favicon:

```ts
schemaOrg: {
  identity: {
    logo: '/favicon.svg',
  }
}
```

## Phase 5: Holistic Design Polish

This is where the brand comes alive. Don't just configure — **design**.

### 5a. Page Building with Nuxt UI Pro Components

Use Nuxt UI v4's page-building primitives — never hand-roll what the framework
provides:

**Landing Pages:** | Component | Use For | |---|---| | `UPageHero` | Hero
section with title, description, actions | | `UPageSection` | Content blocks
with heading + body | | `UPageFeature` | Feature showcases with icon + text | |
`UPageCTA` | Call-to-action blocks | | `UPageGrid` / `UPageColumns` | Responsive
layouts |

**App Shell:** | Component | Use For | |---|---| | `UHeader` | Navigation bar
(only if needed — see Phase 0b) | | `UFooter` / `UFooterColumns` | Footer with
links | | `UMain` | Main content area | | `UContainer` | Width constraint |

**Dashboard / Admin:** | Component | Use For | |---|---| | `UDashboardGroup` |
Dashboard layout wrapper | | `UDashboardSidebar` | Side navigation | |
`UDashboardPanel` | Content panel | | `UDashboardNavbar` | Dashboard top bar |

**Content:** | Component | Use For | |---|---| | `UBlogPosts` / `UBlogPost` |
Article listings | | `UAuthForm` | Login/register flows | | `UPricingPlans` /
`UPricingTable` | Pricing grids |

### 5b. Surface Treatment

Apply the brand's visual language to key surfaces:

- **Page backgrounds:** Set the stage in `layouts/default.vue`. Consider: subtle
  gradient washes, pattern overlays, or atmospheric color. Avoid flat white —
  light mode should still feel designed.
- **Cards:** Every `UCard` and container should use the brand's radius and
  shadow tokens. Don't mix sharp and rounded — be consistent.
- **Glass effects:** Use `backdrop-blur-md bg-white/80 dark:bg-neutral-900/80`
  for floating panels if the brand calls for depth. Don't use glassmorphism
  randomly — it should feel intentional.
- **Borders:** Prefer `border-default` (semantic token) over
  `border-neutral-200`. In dark mode, borders should be subtle but visible.

### 5c. Motion & Micro-animation

An interface that moves with purpose feels premium:

- **Page transitions:** Vue `<Transition>` with fade + slight translate-y on
  route changes
- **Reveal animations:** Staggered fade-in-up on lists and grids using `v-for`
  with delayed `transition-delay`
- **Hover states:** Every interactive element should respond — cards lift,
  buttons depress, links color-shift
- **Loading states:** Use `USkeleton` loaders that match the layout shape.
  Progress bars that animate smoothly
- **Restraint principle:** If you notice the animation instead of the content,
  it's too much. Remove it

### 5d. Typography Hierarchy

Verify the type system creates clear visual hierarchy:

- `h1` → Display font, bold, large (text-4xl lg:text-5xl), commanding
- `h2` → Display font, semibold, medium (text-2xl lg:text-3xl)
- `h3` → Body font, semibold (text-xl)
- Body → Body font, normal weight, comfortable line-height (leading-relaxed)
- Captions/metadata → Body font, smaller, use `text-muted` or `text-dimmed`
  semantic tokens
- **Check:** Line heights, letter spacing, and font weights across both light
  and dark modes

### 5e. Accessibility Check

Good design is accessible design:

- **Contrast:** All text meets WCAG AA — body text ≥ 4.5:1, large text ≥ 3:1
- **Focus:** Interactive elements must have visible focus rings (Nuxt UI handles
  this, but verify custom components)
- **Touch targets:** Buttons and links ≥ 44×44px on mobile
- **Motion:** Respect `prefers-reduced-motion` — wrap CSS animations in
  `@media (prefers-reduced-motion: no-preference)`
- **Color alone:** Don't convey meaning through color alone — always pair with
  text, icons, or patterns

### 5f. Responsive & Mobile Polish

Check the design at four widths (use browser DevTools or mentally simulate):

- **Mobile** (375px) — does everything fit? Is text readable? Are touch targets
  large enough?
- **Tablet** (768px) — does the grid adapt gracefully? No orphaned single
  columns?
- **Desktop** (1280px) — is the content well-centered? Not too wide?
- **Ultra-wide** (1920px+) — is `UContainer` constraining the max-width? No
  floating content?

### 5g. Dark Mode Audit

Switch to dark mode and verify:

- Backgrounds have depth (use `bg-neutral-950` or `bg-neutral-900`, NOT flat
  `#000`)
- Text contrast meets WCAG standards
- Borders are subtle but visible (`border-default` works automatically)
- Colored elements (badges, buttons, links) remain vibrant without being harsh
- Images and illustrations still look good (consider providing dark-mode
  variants)
- Glass effects and shadows adapt correctly

## Phase 6: Visual Verification

1. Start the dev server: `pnpm run dev`
2. Open the app in a browser — **take screenshots** for the user.
3. **Light mode checks:**
   - [ ] Favicon appears in browser tab
   - [ ] Apple Touch Icon loads (`/apple-touch-icon.png` → 200 OK)
   - [ ] Typography renders with the chosen fonts (no FOUT/FOIT)
   - [ ] Primary color is visible in buttons, links, and accents
   - [ ] No template branding remains (no "N4", no "Nuxt 4", no "Demo")
   - [ ] Landing page looks like a real product, not a scaffold
   - [ ] Cards, containers, and surfaces use consistent radius and shadow
4. **Dark mode checks:**
   - [ ] Toggle to dark mode — verify all surfaces, text, and colors adapt
   - [ ] No white flashes or missing dark-mode styles
5. **Mobile check:**
   - [ ] Resize to 375px width — verify layout, type size, and touch targets
6. Present the finished result to the user with screenshots and a brief summary
   of:
   - The creative direction you chose and _why_
   - The color/type/shape decisions
   - Any notable design details

## Anti-Patterns (DO NOT Do These)

| ❌ Anti-Pattern                                          | ✅ What to Do Instead                                   |
| -------------------------------------------------------- | ------------------------------------------------------- |
| Ship with the template's green N4 icon                   | Generate a distinctive app-specific logo                |
| Use generic `emerald` as the primary color               | Choose a color that fits the brand's emotional register |
| Leave the navbar as "Home" + color toggle                | Remove the navbar or redesign it with real content      |
| Use placeholder text ("Lorem ipsum", "Description here") | Write real, app-appropriate copy                        |
| Skip dark mode testing                                   | Test and polish both modes                              |
| Add animations to everything                             | Animate with purpose — less is more                     |
| Use raw Tailwind color utilities (`text-neutral-500`)    | Use semantic tokens (`text-muted`, `text-dimmed`)       |
| Hand-roll components that Nuxt UI provides               | Use `UPageHero`, `UPageSection`, `UCard`, etc.          |
| Use `bg-white` / `bg-black`                              | Use `bg-default` or surface tokens                      |
| Ship without a favicon                                   | Always run `pnpm generate:favicons`                     |

## Prerequisites

- `sharp` must be installed: `pnpm add -wD sharp` (already in
  `onlyBuiltDependencies`)

## Quick Reference: Favicon Generator Options

| Option         | Default                           | Description                     |
| -------------- | --------------------------------- | ------------------------------- |
| `--target`     | `layers/narduk-nuxt-layer/public` | Output directory                |
| `--source`     | `<target>/favicon.svg`            | Source SVG path                 |
| `--name`       | `Nuxt 4 App`                      | Full name in webmanifest        |
| `--short-name` | First 12 chars of `--name`        | Short name in webmanifest       |
| `--color`      | `#10b981`                         | Theme color in webmanifest      |
| `--bg`         | `#0B1120`                         | Background color in webmanifest |
