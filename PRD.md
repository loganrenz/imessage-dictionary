# Free Dictionary Link Preview

A production-ready dictionary web app optimized for iMessage sharing with rich Open Graph image previews, allowing users to read definitions directly in their message threads without opening the app.

**Experience Qualities**:
1. **Instant** - Open Graph images load immediately in iMessage with caching, no tap required to read definitions
2. **Readable** - Large, high-contrast typography ensures definitions are legible in message preview thumbnails
3. **Shareable** - One-tap copy/share flows make spreading word knowledge effortless

**Complexity Level**: Light Application (multiple features with basic state)
This app combines search, word display, dynamic OG image generation, and lightweight admin capabilities—beyond a single tool but not requiring complex state management or multiple heavy views.

## Essential Features

### Word Search
- **Functionality**: Fast prefix and fuzzy contains search across 200+ seeded dictionary entries
- **Purpose**: Help users quickly find words to share
- **Trigger**: User types in search box on home page or word page
- **Progression**: Type query → See filtered results → Click result → Navigate to word page
- **Success criteria**: Results appear within 100ms; matches both prefix and substring; shows term + first definition snippet

### Word Detail Page
- **Functionality**: Display word with pronunciation hints, parts of speech, definitions, examples, and attribution
- **Trigger**: User navigates to /w/[term] via search, direct link, or random button
- **Progression**: Load page → Render word data → Display copy/share buttons → User shares link
- **Success criteria**: Clean layout; all metadata present; copy button works; OG tags properly set

### Dynamic OG Image Generation
- **Functionality**: Generate 1200x630px Open Graph images containing word + readable definition
- **Purpose**: Enable iMessage users to read definitions without opening the app
- **Trigger**: iMessage (or other social platform) fetches og:image URL at /og/[term].png
- **Progression**: Request received → Lookup word → Render image with typography → Return with cache headers
- **Success criteria**: Image renders in <1s; text is readable on mobile; proper cache headers set; handles missing words gracefully

### Share & Copy UX
- **Functionality**: One-tap copy link to clipboard; iOS-friendly Web Share API integration
- **Purpose**: Reduce friction for sharing word definitions
- **Trigger**: User taps "Copy Link" or "Share" button on word page
- **Progression**: Click button → Copy URL or open share sheet → Confirmation toast appears
- **Success criteria**: Link copies successfully; share sheet opens on iOS; visual confirmation provided

### Lightweight Admin Interface
- **Functionality**: Password-protected admin page for adding/editing dictionary entries
- **Purpose**: Allow content expansion without code deploys
- **Trigger**: Admin navigates to /admin with valid ADMIN_TOKEN
- **Progression**: Enter password → View entry form → Fill fields (term, senses, source, license) → Submit → Entry saved
- **Success criteria**: Entries persist; form validation works; unauthorized users blocked

### Random Word Discovery
- **Functionality**: Show a random word from the dictionary
- **Purpose**: Enable serendipitous discovery and testing
- **Trigger**: User clicks "Random Word" button
- **Progression**: Click → Select random entry → Navigate to word page
- **Success criteria**: Picks from full dataset; no repeats in quick succession

## Edge Case Handling

- **Missing Word**: Show branded "Word not found" OG image + 404-style page with search suggestions
- **Malformed Input**: Sanitize URL parameters; redirect invalid characters; normalize case
- **Empty Search**: Show placeholder state with popular/recent words list
- **Long Definitions**: Truncate OG image text with ellipsis; full text on web page
- **Network Failures**: Toast error messages; retry mechanisms for admin submissions
- **Cache Stale Data**: Use stale-while-revalidate headers to serve fast while updating
- **Admin Auth Failure**: Show generic "access denied" without revealing admin page exists

## Design Direction

The design should evoke **reference book clarity meets modern digital polish**—think Merriam-Webster's trustworthy authority blended with Arc browser's clean aesthetics. Users should feel they're accessing authoritative information delivered with zero friction. The OG images must be **immediately scannable** in an iMessage thread, with bold typography hierarchy that works at thumbnail size.

## Color Selection

A scholarly yet approachable palette grounded in deep navy and warm amber accents:

- **Primary Color**: Deep Navy (oklch(0.28 0.05 250)) - Conveys knowledge, trustworthiness, and depth like classic reference books
- **Secondary Colors**: 
  - Warm Cream (oklch(0.96 0.015 85)) - Paper-like background that's easier on eyes than pure white
  - Slate Gray (oklch(0.45 0.02 250)) - Subdued text for secondary information
- **Accent Color**: Amber (oklch(0.72 0.15 75)) - Warm highlight for interactive elements and emphasis
- **Foreground/Background Pairings**:
  - Primary Navy (oklch(0.28 0.05 250)): White text (oklch(1 0 0)) - Ratio 11.2:1 ✓
  - Accent Amber (oklch(0.72 0.15 75)): Dark Navy (oklch(0.25 0.05 250)) - Ratio 5.8:1 ✓
  - Warm Cream (oklch(0.96 0.015 85)): Dark Navy (oklch(0.28 0.05 250)) - Ratio 10.5:1 ✓
  - Muted Slate (oklch(0.82 0.01 250)): Dark text (oklch(0.35 0.02 250)) - Ratio 4.6:1 ✓

## Font Selection

Typography should balance **editorial authority with digital readability**, optimized for both web and OG image rendering:

- **Primary Font**: Crimson Pro (serif) - Editorial quality with excellent screen rendering; conveys scholarly authority
- **Secondary Font**: Inter Variable (sans-serif) - Clean UI elements and labels; pairs beautifully with Crimson Pro
- **Monospace**: JetBrains Mono - For pronunciation guides and word forms

**Typographic Hierarchy**:
- H1 (Word Title): Crimson Pro Bold/48px/tight letter-spacing (-0.02em) - Desktop; 36px mobile
- H2 (Part of Speech): Inter Medium/14px/uppercase/wide spacing (0.08em)
- Body (Definition): Crimson Pro Regular/20px/line-height 1.6
- Caption (Attribution): Inter Regular/12px/line-height 1.4
- OG Image Word: Crimson Pro Bold/96px/tight letter-spacing
- OG Image Part of Speech: Inter Semibold/28px/uppercase
- OG Image Definition: Crimson Pro Bold/52px/line-height 1.3/max 2 lines (highly readable for iMessage previews)

## Animations

Animations should feel like **pages turning and text being revealed**—purposeful, editorial, never distracting from content:

- **Page Transitions**: Subtle 200ms fade-in with slight vertical slide (8px) for new word pages
- **Search Results**: Staggered fade-in with 30ms delay between items (max 5 items animated)
- **Copy Success**: Button scales to 0.95 for 100ms, then back; toast slides from bottom
- **Share Button**: Gentle 300ms hover scale to 1.03 with subtle shadow increase
- **OG Image Load**: Skeleton shimmer while metadata fetches
- **Random Word**: Soft blur-out (150ms) → navigate → blur-in (200ms) for magical discovery feel

## Component Selection

**Components**:
- **Search**: Shadcn `Command` component for fast keyboard-driven search with live filtering
- **Word Cards**: Custom component built on Shadcn `Card` with hover states
- **Input Fields**: Shadcn `Input` with `Label` for admin forms
- **Buttons**: Shadcn `Button` variants (primary for share, secondary for copy, ghost for navigation)
- **Toast Notifications**: Sonner for copy confirmations and error messages
- **Dialog**: Shadcn `Dialog` for admin login modal
- **Textarea**: Shadcn `Textarea` for definition editing in admin
- **Scroll Area**: Shadcn `ScrollArea` for long definition lists

**Customizations**:
- **OG Image Renderer**: Custom component using @vercel/og or similar for Edge runtime rendering
- **Word Display**: Custom semantic component with microdata/schema.org markup
- **Attribution Footer**: Custom component with license badge styling
- **Search Highlighter**: Custom text highlighter to emphasize matched characters

**States**:
- **Buttons**: 
  - Default: Solid background with subtle shadow
  - Hover: Shadow deepens, slight scale (1.02)
  - Active: Scale down (0.98), shadow contracts
  - Disabled: 50% opacity, no hover effects
- **Inputs**: 
  - Default: Border in muted color
  - Focus: Amber ring (2px), border color intensifies
  - Error: Destructive border + icon, shake animation
- **Cards**: 
  - Default: Subtle border, cream background
  - Hover: Slight elevation increase, amber border hint
  - Selected: Amber left border (4px), slightly darker background

**Icon Selection**:
- MagnifyingGlass - Search input
- Shuffle - Random word button
- Copy - Copy link action
- Share - iOS share sheet
- BookOpen - Home/logo mark
- PencilSimple - Admin edit mode
- Check - Success confirmations

**Spacing**:
- Container padding: 6 (24px mobile), 12 (48px tablet+)
- Card padding: 6 (24px)
- Stack gap (vertical): 4 (16px) for related items, 8 (32px) for sections
- Inline gap (horizontal): 3 (12px) for button groups
- Section margins: 12 (48px) between major page sections

**Mobile**:
- Search command dialog goes fullscreen on <768px
- Word title scales from 48px to 36px
- Attribution footer stacks vertically
- Copy/Share buttons stack on mobile, side-by-side on tablet+
- Admin form switches from 2-column to 1-column layout
- OG image text sizing optimized for thumbnail legibility (tested at 375px width)
