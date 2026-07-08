# Design System for Little Rabbani

> **IMPORTANT:** This DESIGN.md is the single source of truth for ALL UI work in this project. It must be referenced in `AGENTS.md` and consulted before any component, page, or visual change. Built on shadcn/ui (base-nova preset), Tailwind CSS 4 (CSS-first config), and hugeicons.

## 1. Visual Theme & Atmosphere

Little Rabbani's design system is a **warm, nurturing preschool LMS** wearing the green of its dotted background pattern across every surface. The canvas alternates between a warm cream (`#FAF5F2`) and a warm off-white (`#F0EBE6`) — colors that reference the calm, inviting surfaces of an early-childhood environment — while the signature **Little Rabbani Green** (`#048647`) anchors the brand moment on hero bands, CTAs, and dashboard surfaces. The greens come in four calibrated shades (Brand, Bright, Dark Teal, Mid Teal) each mapped to a specific surface role, and amber gold (`#EAB308`) appears as the status/badge accent — used sparingly for achievement ceremony, never as a general accent.

Typography carries most of the brand voice. The open-source **Inter** typeface (loaded via `next/font` in this Next.js project) sits across nearly every surface with a tight `-0.16px` letter-spacing — it reads confident and friendly rather than fashion-magazine severe. What's unusual: the marketing page switches to a warm serif (`"Lora", "Iowan Old Style", Georgia`) for specific headline moments, subtly echoing the nostalgic feel of a preschool chalkboard. And decorative touches use a handwritten script (`"Caveat", "Comic Sans MS", cursive`) for child-name personalizations — referencing the hand-written name tags on classroom cubbies. Three typefaces, three contexts — the system is disciplined about when each appears.

The surfaces breathe through rounded geometry. Every button is a 50px full-pill. Cards take a 12px rounded-rectangle. The "WhatsApp" floating button — a 56px circular contact button in WhatsApp Green (`#25D366`) — is the product's signature depth move: it floats bottom-right with a layered shadow stack (`0 0 6px rgba(0,0,0,0.24)` base + `0 8px 12px rgba(0,0,0,0.14)` ambient) and compresses via `scale(0.95)` on press. Elevations are otherwise restrained — card shadows stay at a whispered `0.14/0.24` alpha, the dashboard sidebar gets a quiet three-layer shadow stack. The whole system feels like clean classroom signage: legible, warm, and never shouting.

**Key Characteristics:**

- Four-tier green brand system (Brand / Bright / Dark Teal / Mid Teal) each mapped to a distinct surface role — not a single "brand green"
- Amber Gold reserved for achievement/status ceremony moments only; never a general-purpose accent
- Warm cream canvas (`#FAF5F2` / `#F0EBE6`) instead of cold white — references the calm preschool environment
- Open-source typeface (Inter, via `next/font`) with tight `-0.16px` letter-spacing as the universal voice
- Context-specific type switches: serif (Lora) for marketing headline moments, script (Caveat) for child-name decorative touches
- Full-pill buttons (`50px` radius) universal, `scale(0.95)` active press the signature micro-interaction
- Floating "WhatsApp" circular contact button (`56px`, WhatsApp Green `#25D366` fill, layered shadow stack) — the product's signature elevation element, matching littlerabbani.com
- Decorative blobs (Soft Gold `#FDE68A` and Sky Blue `#7DD3FC`) used as playful background accents — never on functional surfaces
- 12px card radius + whisper-soft shadows keep content cards flat-plus-hint-of-lift
- Rem-based spacing scale anchored at 1.6rem (~16px) = `--space-3`, stepping to 6.4rem (~64px)

**Color-block page rhythm:** Cream hero → White content sections → Dark Teal (`#385451`) feature band with white text → Cream utility zone → Dark Teal (`#385451`) footer with gold / white text — a deep-teal bookend around the bright body.

## 2. Color Palette & Roles

**Source extracted from:** littlerabbani.com (connected background, text-heading color, decorative blobs, marketing typefaces).

### Primary

- **Little Rabbani Green** (`#048647`): The primary brand green — extracted from littlerabbani.com's dotted background pattern (`rgba(4, 134, 71)`). Used on h1 headings, primary section headers, and as the main brand signal wherever a single dominant color is needed.
- **Bright Green** (`#0E9F5A`): A slightly brighter, more luminous green. The primary filled-CTA color ("Save changes", "Mark complete", "Send report") and the fill of active dashboard CTAs. Slightly brighter than brand green to ensure button contrast on the cream canvas.
- **Dark Teal Green** (`#385451`): The deep near-ink brand teal — extracted from littlerabbani.com's heading text color. Dashboard sidebar surface, feature-band backgrounds, footer surface, and deep-status dark surfaces.
- **Mid Teal** (`#2B6B5A`): A secondary mid-dark teal used sparingly on decorative accents and dark-gradient moments.
- **Soft Mint** (`#D1F0E0`): A pale mint wash used for valid-field tint, success state backgrounds, and light green utility surfaces.

### Secondary & Accent

- **Amber Gold** (`#EAB308`): The status/achievement accent — used as `text-yellow-500` across littlerabbani.com. Badge fills, achievement stars, premium-tier callouts, and "featured" indicators. Reserved for status ceremony; never a general-purpose brand color.
- **Soft Gold** (`#FDE68A`): A softer gold (from littlerabbani.com's `rgba(253, 230, 138)` decorative blobs) for background washes on gold-tier sections and decorative accents.
- **Cream Gold** (`#FDF8E8`): A cream-gold page-surface wash used under achievement sections and premium surfaces — ties the gold accent back into the warm neutral system.

### Surface & Background

- **White** (`#ffffff`): Primary card and modal surface. Also card fill on dashboard tiles.
- **Neutral Cool** (`#f9f9f9`): Subtle cool-gray surface used on dropdown menus, form-card wraps, and quiet utility containers.
- **Cream** (`#FAF5F2`): The warm cream **primary page canvas** — extracted from littlerabbani.com. Used for hero bands, utility zones, and the default app body background.
- **Warm Off-White** (`#F0EBE6`): A slightly warmer/darker cream for zone separators, soft page-section washes, and sidebar null states.
- **Black** (`#000000`): Deep ink reserved for the highest-contrast login/CTA strips.

### Neutrals & Text

- **Text Black** (`#1a1a2e`): Primary heading and body text color on light surfaces. A warm near-black ink that reads softer than pure black — maps from the Starbucks `rgba(0, 0, 0, 0.87)` reference but pinned to a solid hex for dashboard readability.
- **Text Black Soft** (`rgba(26, 26, 46, 0.58)`): Secondary/metadata text on light surfaces — captions, helper text, table secondary cells.
- **Text White** (`rgba(255, 255, 255, 1)`): Primary heading/body text on dark-teal surfaces.
- **Text White Soft** (`rgba(255, 255, 255, 0.70)`): Secondary text on dark-teal surfaces — footer link descriptions, sidebar secondary labels.
- **Dashboard Teal** (`#385451`): A dedicated muted teal used on dashboard text blocks that need to signal "this is a brand surface" without using full Little Rabbani Green. Shares the same hex as Dark Teal Green but referenced by role when applied to text.

### Semantic & Accent

- **WhatsApp Green** (`#25D366`): Used exclusively for the floating WhatsApp contact button and any WhatsApp-branded contact affordance. Never substituted for brand green.
- **Sky Blue** (`#7DD3FC`): Decorative blob accent only (from littlerabbani.com's `rgba(125, 211, 252)`). Never a functional UI color.
- **Red** (`#c82014`): Error and destructive state (form invalid, destructive actions).
- **Yellow** (`#fbbc05`): Warning state.
- **Soft Mint** (`#D1F0E0` at 33% opacity = `hsl(140 58% 86% / 33%)`): Form valid-field tint background.
- **Red Tint** (`hsl(4 82% 43% / 5%)`): Invalid-field tint on forms.

### Black / White Alpha Ladders

Two parallel translucent scales for overlay and secondary-text use:

- `rgba(0,0,0,0.06)` through `rgba(0,0,0,0.90)` in 10% steps — for dark overlays on light surfaces
- `rgba(255,255,255,0.10)` through `rgba(255,255,255,0.90)` in 10% steps — for light overlays on dark surfaces

### Gradient System

No structural gradient tokens. Surface hierarchy is solid-color-block throughout — the system relies on its five-tier cream/green surface palette and playful decorative blobs (Soft Gold, Sky Blue) rather than gradients.

## 3. Typography Rules

### Font Family

- **Primary:** `Inter, "Helvetica Neue", Helvetica, Arial, sans-serif` — open-source typeface loaded via `next/font/google` in this Next.js project (already configured). Used across nearly every surface.
- **Loading Fallback:** `system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif` — what users see before Inter loads.
- **Marketing Serif:** `"Lora", "Iowan Old Style", Georgia, serif` — used on specific marketing-page headline moments for a warm editorial feel. Available on Google Fonts.
- **Decorative Script:** `"Caveat", "Comic Sans MS", cursive` — used exclusively for decorative child-name touches on certificate and profile surfaces, referencing hand-written classroom name tags. Available on Google Fonts.

No OpenType stylistic sets explicitly activated at `:root`.

### Hierarchy

| Role                | Size           | Weight  | Line Height     | Letter Spacing | Notes                                        |
| ------------------- | -------------- | ------- | --------------- | -------------- | -------------------------------------------- |
| Display (text-10)   | 5.0rem / 80px  | 400–600 | 1.2             | -0.16px        | Largest marketing/hero display               |
| Jumbo (text-9)      | 3.6rem / 58px  | 400–600 | 1.2             | -0.16px        | Secondary hero headings                      |
| Hero Large (text-8) | 2.8rem / 45px  | 400–600 | 1.2–1.5         | -0.16px        | Landing section headlines                    |
| H1                  | 24px           | 600     | 36px            | -0.16px        | Little Rabbani Green primary heading         |
| H2                  | 24px           | 400     | 36px            | -0.16px        | Regular-weight section title in Text Black   |
| Body Large          | 19px           | 400–600 | 33.25px (~1.75) | -0.16px        | Hero intro copy, feature-band body           |
| Body (text-3)       | 1.6rem / 16px  | 400     | 1.5 (24px)      | -0.01em        | Default body copy                            |
| Small (text-2)      | 1.4rem / ~14px | 400–600 | 1.5             | -0.01em        | Button label, metadata, form labels          |
| Micro (text-1)      | 1.3rem / ~13px | 400     | 1.5             | -0.01em        | Active float-label state, caption micro-copy |
| Button Label        | 14–16px        | 400–600 | 1.2             | -0.01em        | All pill-button labels                       |

**Letter-spacing tokens:**

- `letterSpacingNormal`: `-0.01em` (default — tight, characteristic)
- `letterSpacingLoose`: `0.1em` (emphasized caps)
- `letterSpacingLooser`: `0.15em` (uppercase-style labels, extreme emphasis)

**Line-height tokens:**

- `lineHeightNormal`: `1.5` (body)
- `lineHeightCompact`: `1.2` (display/buttons)

### Principles

- **Tight negative tracking (`-0.01em`)** is applied almost universally — the entire product reads slightly compressed, which gives Inter its confident presence without feeling squeezed.
- **Weight shifts carry hierarchy, not size shifts.** H1 and H2 share the same 24px/36px size; only weight (600 vs 400) and color (Little Rabbani Green vs Text Black) separate them.
- **Size tokens use rem, anchored to `1rem = 10px`** on this site (via a `font-size: 62.5%` root trick). So `1.6rem` = 16px, `2.4rem` = 24px, etc. The scale is semantic (textSize-1 through textSize-10), not arbitrary pixel values.
- **Context-specific typeface swaps** — serif (Lora) on the marketing page, script (Caveat) on certificate/profile decorations — are deliberate and localized. Never mix them with the primary sans within the same surface.
- **Body text never goes pure black** — it sits at `#1a1a2e` to match the warm-neutral canvas temperature.

### Note on Font Substitutes

- **Inter** is the primary typeface, loaded via `next/font/google` in this project's root layout. No swap needed — this project uses Inter directly as the SoDoSans substitute.
- **Lora** (marketing serif) is available on Google Fonts — load via `next/font/google` only on marketing pages where it is used, to avoid bloating dashboard bundles.
- **Caveat** (decorative script) is available on Google Fonts — load lazily only on certificate/profile surfaces where the hand-written touch is needed.

## 4. Component Stylings

### Buttons

**1. Primary Filled — "Save changes / Mark complete / Send report"**

- Background: `#0E9F5A` (Bright Green)
- Text: `#ffffff`
- Border: `1px solid #0E9F5A`
- Radius: `50px` (full pill)
- Padding: `7px 16px`
- Font: Inter, 16px, weight 600, letter-spacing `-0.01em`
- Active state: `transform: scale(0.95)` via `--buttonActiveScale`
- Transition: `all 0.2s ease`

**2. Primary Outlined — "Cancel / View details"**

- Background: transparent
- Text: `#0E9F5A` (Bright Green)
- Border: `1px solid #0E9F5A`
- Same radius/padding/active/transition as Primary Filled

**3. Black Filled — "Sign in / Continue"**

- Background: `#000000`
- Text: `#ffffff`
- Border: `1px solid #000000`
- Radius: `50px`, Padding: `7px 16px`
- Font: 14px, weight 600
- Used on high-contrast login strips and conversion moments

**4. Dark Outlined — "Back to dashboard"**

- Background: transparent
- Text: `#1a1a2e` (Text Black)
- Border: `1px solid #1a1a2e`
- Radius: `50px`, Padding: `7px 16px`
- Font: 14px, weight 600

**5. Green-on-Green Inverted — "Get started"**

- Background: `#ffffff`
- Text: `#0E9F5A`
- Border: `1px solid #ffffff`
- Used when the surface behind the button is the dark teal band — white button with green text instead of a filled green pill on teal bg

**6. Outlined on Dark — "Learn more / View docs"**

- Background: transparent
- Text: `#ffffff`
- Border: `1px solid #ffffff`
- Used on dark-teal feature bands for secondary action paired with a white filled CTA

**7. Consent Agree (dark-teal variant)**

- Background: `rgb(14, 159, 90)` (Bright Green, consent-specific variant)
- Text: `#ffffff`
- No border, `50px` radius, `7px 16px` padding, 14px / weight 400
- Reserved for the cookie-consent/banner Agree action

**8. WhatsApp — Floating Circular Contact Button**

- Background: `#25D366` (WhatsApp Green) — matches littlerabbani.com
- Icon: `#ffffff` (WhatsApp glyph)
- Size: `5.6rem / 56px` (standard), `4rem / 40px` (mini variant)
- Radius: `50%` (full circle)
- Fixed bottom-right, `-0.8rem` touch offset for extra tap comfort
- Shadow stack: base `0 0 6px rgba(0,0,0,0.24)` + ambient `0 8px 12px rgba(0,0,0,0.14)`
- Active state: ambient shadow fades to `0 8px 12px rgba(0,0,0,0)` with `scale(0.95)`
- This is the product's signature elevation element — it floats over every scrolled surface, matching the main website's floating WhatsApp button

**9. Full-width Feedback Tab — "Report an issue / Contact support"**

- Background: `#0E9F5A` (Bright Green)
- Text: `#ffffff`
- Radius: `12px 12px 0px 0px` (top-rounded only)
- Padding: `8px 16px`
- Font: 14px, weight 400
- Positioned fixed bottom-right-inside, attached to the viewport edge (offset from the WhatsApp button so they do not overlap)

### Cards & Containers

**Content Card (default dashboard tile)**

- Background: `#ffffff` (`--cardBackgroundColor`)
- Radius: `12px` (`--cardBorderRadius`)
- Shadow: `0px 0px .5px 0px rgba(0,0,0,0.14), 0px 1px 1px 0px rgba(0,0,0,0.24)` (`--cardBoxShadow`)
- Used for: dashboard stat tiles, lesson cards, student roster rows, attendance summary panels

**Achievement / Badge Tile**

- Background: Soft Gold `#FDE68A` wash or illustrated icon fills the card tile
- Radius: `12px`
- Shadow: lighter than default card — these are treated like physical reward coins laid on the canvas
- Labeled by category above the card grid (Student of the Week, Reading Stars, Helpful Friend, etc.)

**Status Cards (progress summary signature)**

- Three-column grid: Bronze / Silver / Gold-tier progress — each a Dark Teal (`#385451`) panel with:
  - Colored gradient/color header ring
  - Numbered "Level" badge
  - Status title in large Inter weight 600
  - Stars / benefits list in white/translucent-white text
  - Bottom "As you earn more stars…" progression caption

**Partnership / Parent Card (parent-portal signature)**

- Background: `#FDF8E8` (Cream Gold) warm-cream surface
- Content: parent/guardian avatars centered, with descriptive text below
- Radius and shadow follow default card spec

**Dropdown Menu (Account dropdown, sidebar)**

- Background: `#f9f9f9` (Neutral Cool)
- Menu items at `24px / weight 400` in Text Black
- No border — just background surface shift against white nav

**Modal**

- Padding: `2.4rem` (`--modalPadding`)
- Top padding: `8.8rem` (`--modalTopPadding`) — leaves room for close button / header
- Combined vertical padding: `11.2rem`
- Radius inherits from card spec (`12px`)

### Inputs & Forms

**Floating Label Input**

- Label floats above the input border when focused/filled
- Desktop label font size: `1.9rem` default, animates to `1.4rem` when active
- Mobile label font size: `1.6rem` default, animates to `1.3rem` active
- Label horizontal offset: `12px` from left
- Active label translate: up to `-12px` with `-50%` Y translation
- Field padding: `12px`
- Form horizontal padding: `1.6rem`
- Validation: valid-field gets `rgba(soft-mint, 0.33)` tint; invalid-field gets `rgba(red, 0.05)` tint
- Transition: `0.3s option-label-marker-expansion cubic-bezier(0.32, 2.32, 0.61, 0.27)` on checked-input

**Option Icon (checkbox/radio)**

- Padding: `3px` inner
- Uses the checked-input cubic-bezier animation above (a slightly "springy" 2.32 overshoot curve)

### Navigation

**Dashboard Sidebar (role-aware nav)**

- Fixed position with progressive widths: collapsed `64px` → expanded `240px`
- Background: Dark Teal Green (`#385451`)
- Shadow stack: `0 1px 3px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)` — three-layer soft lift on the rail edge
- Top: Little Rabbani wordmark/logo, offsetting by `24px` from top edge
- Primary nav items inline in Inter weight 400–600, role-filtered: Admin · Teacher · Parent · Student
- Active item: Bright Green `#0E9F5A` left-rail accent + Soft Mint `#D1F0E0` background tint
- Bottom: user profile chip with avatar + role badge

**Top Bar (contextual header)**

- Height: `64px` desktop / `56px` mobile
- Contains: page title (Inter 18/600), breadcrumb trail, role switcher, notifications bell, account menu
- Background: White `#ffffff` with bottom border hairline `1px solid rgba(0,0,0,0.06)`

**Mobile Nav**

- Collapses the sidebar to a bottom-tab bar (4 primary destinations) below tablet breakpoint
- WhatsApp floating button persists at bottom-right regardless of nav state

### Image Treatment

- **Marketing hero photography**: Children/classroom photos (with guardian consent) occupy ~40vw of a split-hero layout; text occupies the other 60vw (`--headerCrateProportion: 40vw` / `--contentCrateProportion: 60vw`)
- **Achievement illustrations**: Each badge tile is a distinct illustrated icon (hand-drawn watercolor-painted feel) as the entire surface. Never generic generated graphics.
- **Student avatars**: Circular thumbnails with Soft Mint `#D1F0E0` ring for unread/active state
- **Decorative blobs**: Soft Gold `#FDE68A` and Sky Blue `#7DD3FC` semi-transparent circles positioned absolute behind marketing sections — playful preschool feel, never on functional surfaces
- **Image fade-in**: `opacity 0.3s ease-in` transition on image load (`--imageFadeTransition`).

### Feature Band (dark-teal hero strip)

Full-width `#385451` (Dark Teal Green) band with:

- Left: white headline + subhead + CTA row
- Right: classroom/lesson photography or illustration
- Split ratio ~40/60 or 50/50 depending on section
- White text throughout with `rgba(255,255,255,0.70)` for secondary copy
- CTAs follow Green-on-Green Inverted (white filled) + Outlined on Dark (white outline) pairing

### Expander / Accordion

- Duration: `300ms` (`--expanderDuration`)
- Timing curve: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` — a measured ease-out
- Used for FAQ sections, lesson-plan accordions, and settings panels

### Cookie Consent Module

Dark-teal modal card at top of page with "Agree" (green-filled) and "Manage preferences" (outlined) buttons. Appears on first visit; dismissible.

### Dashboard Detail Components (LMS signature cluster)

A repeating component cluster used on lesson/student detail pages (e.g., `/lessons/[id]` for a lesson detail, `/students/[id]` for a student profile). These extend the component inventory without changing tokens.

**Lesson Section Selector**

- Horizontal row of 4 stage-icon buttons (Introduction / Activity / Practice / Wrap-up)
- Each item: stage silhouette icon (hugeicons) on top, stage name below (16/700 in Little Rabbani Green), duration caption (13/400 in Text Black Soft)
- Active state: a green circular ring outline (`2px solid #0E9F5A`) around the selected stage icon
- Inactive: no ring, same typography
- Full-width row, equal spacing
- Radius of container: `12px` or flat; individual icons are `50%` circular
- Padding: `16px 24px` internal

**Select / Filter (outlined rectangle)**

- Background: `#ffffff`
- Border: `1px solid #d6dbde` (Input Border)
- Radius: `4px`
- Full-width in its column
- Floating label above top border: "Class" / "Subject" / "Teacher" — 13/700 in Text Black, uppercase, `0.325px` letter-spacing
- Value displayed centered (e.g., "Caterpillar", "Numeracy", "Ms. Aisha"): 16/400 Text Black
- Chevron-down icon right side in Text Black Soft
- Focus: border shifts to Bright Green (`#0E9F5A`)

**Numeric Stepper (attendance count)**

- Embedded inside an attendance row when a quantity is required (e.g., present count)
- `−` minus button + count number + `+` plus button, all inline right of the label
- Buttons: circular `32×32px` with `1px solid #d6dbde` border, neutral gray icon
- Count number: 16/700 Text Black centered

**Customize / Configure Button**

- Background: `#ffffff`
- Text: `#0E9F5A` (Bright Green)
- Border: `1.5px solid #0E9F5A`
- Radius: `50px` (full pill)
- Padding: `14px 40px` (generously larger than default pills — this is a secondary primary action)
- Label: "Configure" with a gold sparkle ✨ icon inset left
- Used for: entering the lesson-customization flow after class/subject selection

**Save / Submit Button (LMS)**

- Background: `#0E9F5A` (Bright Green)
- Text: `#ffffff`
- Radius: `50px`
- Padding: `14px 32px`
- Pinned top-right of detail card and/or aligned right within the action band
- Same scale(0.95) active behavior as other primary CTAs

**Achievement Cost Pill — "5★ badge"**

- Background: transparent
- Border: `1px solid #EAB308` (Amber Gold)
- Text: `#EAB308` (Amber Gold)
- Radius: `50px` (full pill)
- Padding: `4px 12px`
- Content: "5★ badge" where `★` is a small filled star glyph — indicates the stars required to earn this achievement
- Font: Inter 13/700 with `0.5px` letter-spacing
- Used only on achievements that are star-gated

**Lesson Description Band**

- Full-width dark-teal band (`#385451` Dark Teal Green)
- Contains top-to-bottom:
  1. Achievement Cost Pill (gold) if applicable
  2. Lesson description body copy in white (16/400/1.5)
  3. Lesson meta inline summary ("3 activities, 15 min, Numeracy") with info-icon tooltip — 14/700 white
  4. "Full lesson plan & materials" outlined-white-on-teal pill button
- Padding: `32px` vertical
- Appears beneath the primary lesson header band

**Lesson Plan / Materials Table**

- Two-column layout on the lesson detail page
- Left column: "Materials" header + list or "No materials for this lesson" placeholder text block with an explanatory paragraph in Text Black Soft 14/400
- Right column: "Objectives" header + label/value rows
- Each row: objective label (Inter 14/400) on the left, status (e.g., "In progress", "Complete", "Not started") on the right, separated by a `1px solid #e7e7e7` hairline below
- Footnote for assessment markers in 13/400 Text Black Soft at the bottom
- Reusable pattern for lesson-progress tables

**Class / Teacher Selector**

- Appears on dark-teal feature band above the lesson-section row
- Full-width rounded rectangle with transparent-white interior
- Text: "For lesson availability, choose a class" in white, 14/400
- Right side: chevron-down affordance + hugeicons classroom SVG icon in white outline
- Radius: `4px`
- Height: ~48px

**LMS Breadcrumb**

- "Dashboard / Lessons / Numeracy — Caterpillar" trail above the page title
- Separator: `/` slash character in Text Black Soft
- Current page is unlinked, prior pages are underlined bright-green links
- Font: 14/400 Inter
- Appears on all detail pages

**Back Chevron Link (detail sub-pages)**

- "← Back" text link above section headings on the materials page
- Text in Bright Green (`#0E9F5A`) 14/700 Inter
- Left chevron `<` in the same green
- Alternative to full breadcrumb on deep sub-pages

## 5. Layout Principles

### Spacing System

Rem-based semantic scale (anchored `1rem = 10px`):

| Token       | Rem      | Pixels | Typical Use                                   |
| ----------- | -------- | ------ | --------------------------------------------- |
| `--space-1` | `0.4rem` | 4px    | Tightest inline padding                       |
| `--space-2` | `0.8rem` | 8px    | Small gap, button vertical padding            |
| `--space-3` | `1.6rem` | 16px   | Default — card padding, outer gutter xs       |
| `--space-4` | `2.4rem` | 24px   | Section inner spacing, outer gutter md        |
| `--space-5` | `3.2rem` | 32px   | Major between-section spacing                 |
| `--space-6` | `4rem`   | 40px   | Large gaps, outer gutter lg, header crate     |
| `--space-7` | `4.8rem` | 48px   | Section-to-section spacing                    |
| `--space-8` | `5.6rem` | 56px   | Very large breathing — WhatsApp button height |
| `--space-9` | `6.4rem` | 64px   | Widest section padding                        |

**Gutter tokens:**

- `--outerGutter: 1.6rem` (16px, default / mobile)
- `--outerGutterMedium: 2.4rem` (24px, tablet)
- `--outerGutterLarge: 4.0rem` (40px, desktop)

**Universal rhythm constant:** `1.6rem` (16px) appears across every page as the default outer gutter, card padding baseline, and text size 3 body — the system's most frequent spacing unit.

### Grid & Container

- Column width scale: `--columnWidthSmall: 343px` / `Medium: 500px` / `Large: 720px` / `XLarge: 1440px`
- Achievement grid uses a 3-5-up responsive grid of `~343px` tiles
- Dashboard status section: 3-up dark-teal panels at `lg+` breakpoints
- Marketing hero: asymmetric split 40% (image) / 60% (content) via `--headerCrateProportion` / `--contentCrateProportion`

### Whitespace Philosophy

Whitespace carries the feeling of "plenty of space in the classroom." Section padding leans generous (40–64px). Content blocks are separated by whitespace rather than dividers. The cream canvas (`#FAF5F2`) is itself a visual breath between white cards and dark-teal feature bands.

### Border Radius Scale

| Value           | Use                                                         |
| --------------- | ----------------------------------------------------------- |
| `12px`          | Cards, modals, dashboard tiles (`--cardBorderRadius`)       |
| `12px 12px 0 0` | Full-width feedback tab (top-rounded only)                  |
| `50px`          | All buttons — full-pill radius (`--buttonBorderRadius`)     |
| `50%`           | Circular icons, WhatsApp floating button, avatar thumbnails |
| `4px`           | Inputs, outlined selectors                                  |

## 6. Depth & Elevation

| Level             | Treatment                                                                         | Use                                                              |
| ----------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Card              | `0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)`                          | Default dashboard cards — a whisper-soft dual-shadow             |
| Sidebar           | `0 1px 3px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)` | Triple-layer soft lift on the fixed sidebar rail                 |
| WhatsApp Base     | `0 0 6px rgba(0,0,0,0.24)`                                                        | Base halo around the floating circular contact button            |
| WhatsApp Ambient  | `0 8px 12px rgba(0,0,0,0.14)`                                                     | Stacked directional ambient — floats the WhatsApp button forward |
| Achievement Tile  | Light drop shadow around illustrated icon                                         | Physical-coin feel for achievement tiles                         |
| Popover / Tooltip | `drop-shadow(0 4px 1px rgba(0,0,0,0.11)) drop-shadow(0 0 2px rgba(0,0,0,0.24))`   | Stacked SVG drop shadows for popover visuals                     |

**Shadow philosophy:** Whisper-soft, layered over solid — the system never reaches for a single heavy drop shadow. Instead, it stacks 2–3 low-alpha shadows with different offsets to simulate real-world ambient + direct lighting. The WhatsApp button is the most elevated element on any page.

### Decorative Depth

- **No gradient system** — surfaces are solid color-block
- **Color-block banding** carries perceived depth (dark-teal bands read as "recessed feature zones" between cream/white body sections)
- **Decorative blobs** (Soft Gold `#FDE68A`, Sky Blue `#7DD3FC`) at low opacity behind marketing sections add playful depth without structural gradients

## 7. Do's and Don'ts

### Do

- Use Cream (`#FAF5F2`) or Warm Off-White (`#F0EBE6`) as page canvas instead of pure white — the warm cream is the signature
- Map the green tiers to their intended surface role — Little Rabbani Green for headings, Bright Green for CTAs, Dark Teal for sidebar/footer/bands, Mid Teal for decorative
- Keep tracking tight at `-0.01em` / `-0.16px` on Inter across the whole system
- Use 50px full-pill radius on every button without exception
- Apply `transform: scale(0.95)` as the universal button active state
- Reserve Amber Gold for achievement/status ceremony moments only
- Use Inter for nearly everything; switch to Lora only for marketing editorial headlines; reserve Caveat script for certificate/profile name decorations
- Layer 2–3 low-alpha shadows instead of one heavier drop shadow for elevation
- Use the WhatsApp circular button as the persistent floating contact entry on every surface (matches littlerabbani.com)
- Let the cream canvas breathe between content cards — use whitespace, not dividers
- Use shadcn/ui (base-nova) as the primitive component foundation, then theme with the tokens in this doc
- Use hugeicons for all iconography

### Don't

- Don't use pure white as the page canvas — the warm cream temperature is load-bearing
- Don't pick "one brand green" — the four-green system is intentional; using only `#048647` everywhere flattens the brand
- Don't use Amber Gold as a general-purpose accent — it's an achievement/status signal only
- Don't substitute WhatsApp Green (`#25D366`) for brand green — it is reserved exclusively for the WhatsApp contact affordance
- Don't use Sky Blue (`#7DD3FC`) or Soft Gold (`#FDE68A`) on functional surfaces — decorative blobs only
- Don't square the corners on buttons — the 50px pill is universal
- Don't introduce gradient fills on functional surfaces — the system is color-block throughout (decorative blobs are the only exception, behind marketing sections)
- Don't weight-contrast h1 and h2 by size — the hierarchy comes from weight + color (600 Little Rabbani Green vs 400 Text Black)
- Don't use pure black for body text — `#1a1a2e` matches the warm canvas
- Don't skip the `scale(0.95)` active feedback on buttons — it's a signature micro-interaction
- Don't stack single heavy shadows; always layer 2–3 low-alpha ones
- Don't introduce serifs or scripts into the main dashboard flow — they belong to marketing and certificate contexts respectively
- Don't edit `src/components/ui/` shadcn base-nova components directly — they are auto-generated

## 8. Responsive Behavior

### Breakpoints

| Name    | Width       | Key Changes                                                                                                           |
| ------- | ----------- | --------------------------------------------------------------------------------------------------------------------- |
| xs      | < 480px     | Sidebar collapses to bottom-tab bar; single-column layouts; pill buttons full-width                                   |
| Mobile  | 480–767px   | Achievement grid 2-up; card padding tightens                                                                          |
| Tablet  | 768–1023px  | Collapsible sidebar rail (icons only) + expand-on-hover; achievement grid 3-up; marketing hero split begins to appear |
| Desktop | 1024–1439px | Full fixed sidebar; achievement grid 4-up; full asymmetric hero 40/60                                                 |
| XLarge  | 1440px+     | Content caps at `--columnWidthXLarge`; achievement grid 5-up; extra cream margin                                      |

### Touch Targets

- Pill buttons at `7px 16px` padding measure ~32px tall — below 44px WCAG AAA minimum for touch-only surfaces. On mobile, button padding may be visually expanded to meet the minimum.
- WhatsApp floating circular button at `56px` is well above minimum.
- WhatsApp button uses `--whatsappTouchOffset: calc(-1 * .8rem)` to extend tap area 8px beyond visual edge.
- Form float-label inputs grow their label font size on mobile (1.6rem base vs 1.9rem desktop) — easier to tap and read at arm's-length.

### Collapsing Strategy

- **Sidebar state scales**: collapsed icons (64px) → expanded rail (240px) → mobile bottom-tab bar, rather than a single value
- **Marketing hero split collapses**: 40/60 asymmetric split → stacked (image top, content below) at mobile
- **Achievement grid**: 5-up → 4-up → 3-up → 2-up → 1-up across breakpoints with adjusted card widths
- **Feature bands**: Stay full-width but text + imagery stack vertically on mobile
- **Outer gutter scales**: 16px → 24px → 40px as viewport grows
- **Dashboard 3-column status panels**: Stack to single column on mobile
- **Data tables**: Collapse non-essential columns (e.g., secondary metadata) into an expandable row detail at mobile

### Image Behavior

- Marketing classroom photography crops tighter vertically on mobile; content becomes the visual anchor
- Achievement illustrations preserve aspect ratio; card grid reflows
- `opacity 0.3s ease-in` fade-in transition on image load (prevents jarring pop-in)
- Student avatars scale proportionally; never stretches

## 9. Agent Prompt Guide

### Quick Color Reference

- Primary CTA: "Bright Green (`#0E9F5A`)"
- Primary CTA text: "White (`#ffffff`)"
- Brand heading: "Little Rabbani Green (`#048647`)"
- Sidebar / feature band / footer: "Dark Teal Green (`#385451`)"
- Page canvas: "Cream (`#FAF5F2`)"
- Card canvas: "White (`#ffffff`)"
- Heading text on light: "Text Black (`#1a1a2e`)"
- Body text on light: "Text Black Soft (`rgba(26,26,46,0.58)`)"
- Body text on dark-teal: "Text White Soft (`rgba(255,255,255,0.70)`)"
- Achievement accent: "Amber Gold (`#EAB308`)"
- Achievement text: "Dashboard Teal (`#385451`)"
- Destructive: "Red (`#c82014`)"
- Floating contact: "WhatsApp Green (`#25D366`)"
- Decorative blobs: "Soft Gold (`#FDE68A`) / Sky Blue (`#7DD3FC`)"
- Valid-field tint: "Soft Mint (`#D1F0E0`)"

### Example Component Prompts

1. "Create a primary Little Rabbani CTA pill button with Bright Green (`#0E9F5A`) background, white text 'Save changes', Inter font at 16px weight 600 with `-0.01em` letter-spacing, `50px` border-radius (full pill), `7px 16px` padding. Apply `transform: scale(0.95)` as the active state with a `0.2s ease` transition."

2. "Design a content card with White (`#ffffff`) background at `12px` border-radius, layered shadow `0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)`. Pad contents `16–24px` (`--space-3` to `--space-4`). Place on a Cream (`#FAF5F2`) page canvas with `16px` gap to siblings."

3. "Build the WhatsApp floating circular contact button — `56px` diameter, WhatsApp Green (`#25D366`) fill, white WhatsApp glyph icon centered. Layered shadow: `0 0 6px rgba(0,0,0,0.24)` + `0 8px 12px rgba(0,0,0,0.14)`. Fixed position bottom-right with `-0.8rem` touch offset. Active state collapses the ambient shadow to `0 8px 12px rgba(0,0,0,0)` with `scale(0.95)`. This matches littlerabbani.com's floating WhatsApp button."

4. "Build a dark-teal feature band — full-width section with Dark Teal Green (`#385451`) background. Left column: white Inter h2 at 24px weight 600, followed by a Text White Soft (`rgba(255,255,255,0.70)`) body paragraph and a CTA row with two buttons (White-filled with Bright Green text for primary, Outlined-on-Dark white border for secondary). Right column: classroom photography. Split ratio 40/60, stacked vertically below `768px`."

5. "Create an achievement status card — Dark Teal Green (`#385451`) panel with `12px` border-radius, colored gradient top stripe (Bronze/Silver/Gold tier). Title in Inter 24px weight 600 in white. Benefits list as white bullets with `rgba(255,255,255,0.70)` secondary captions. Bottom progression text in Text White Soft. Stack 3 panels in a grid at `lg+`, single column on mobile."

6. "Design an achievement tile — card radius matches `12px`, fills with an illustrated icon (hand-drawn watercolor-painted feel) as the entire surface. Subtle drop shadow makes it feel like a physical reward coin on the cream canvas. Group under a category label ('Student of the Week', 'Reading Stars', 'Helpful Friend') in Inter 24px weight 400 above the grid."

7. "Create a Little Rabbani lesson-detail header — Dark Teal Green (`#385451`) band with breadcrumb 'Dashboard / Lessons / Numeracy — Caterpillar' in 14/400 white above the lesson title in Inter 32/700 uppercase white. Lesson icon centered below title. Below icon: a 4-up stage selector row — each stage-icon button shows a hugeicons stage silhouette, stage name ('Introduction' / 'Activity' / 'Practice' / 'Wrap-up') in 16/700 white, and duration in 13/400 Text White Soft. Selected stage wraps the icon in a `2px solid #0E9F5A` circular ring."

8. "Build a Little Rabbani lesson configure flow — under the stage selector, 3 stacked outlined-rectangle input rows (white bg, `1px solid #d6dbde` border, `4px` radius). Each has a floating label ('Class', 'Subject', 'Teacher') above the top border in 13/700 Text Black uppercase. Value centered (e.g., 'Caterpillar', 'Numeracy', 'Ms. Aisha'). Right side: chevron-down in Text Black Soft. For the materials row, embed a numeric stepper (`−` `1` `+` with circular `32px` outlined buttons). Below all three fields: outlined green 'Configure' pill with gold sparkle icon, `50px` radius, `14px 40px` padding. Pair with a Bright Green filled 'Save Lesson' pill in the same row."

9. "Design a Little Rabbani lesson description band — full-width Dark Teal Green (`#385451`) below lesson header. Top: a gold-outlined '5★ badge' Achievement Cost Pill (`50px` radius, `4px 12px` padding, Amber Gold `#EAB308` border and text). Below: lesson description in white 16/400/1.5. Lesson meta inline summary in white 14/700 ('3 activities, 15 min, Numeracy') with info-icon tooltip. Outlined-white-on-teal pill button 'Full lesson plan & materials'. 32px vertical padding."

10. "Create a Little Rabbani lesson progress table — two-column layout inside a White card. Left column: 'Materials' header (24/400 Text Black), followed by material list or 'No materials for this lesson' placeholder paragraph in 14/400 Text Black Soft. Right column: 'Objectives' header, then label/value rows (objective name left, status right — 'In progress' / 'Complete' / 'Not started') separated by `1px solid #e7e7e7` hairlines. Typography: labels in 14/400 Text Black, values in 14/700 Text Black right-aligned. Footnote asterisk markers in 13/400 Text Black Soft at the bottom."

### Iteration Guide

When refining existing screens generated with this design system:

1. Focus on ONE component at a time
2. Reference specific color names and hex codes from this document
3. Use natural language descriptions ("warm cream canvas," "four-tier green system") alongside exact values
4. Preserve the 50px pill + `scale(0.95)` active state universally
5. Check that greens are mapped to their correct role (Bright Green for CTA, Little Rabbani Green for heading, Dark Teal for sidebar/band/footer)
6. Don't introduce gradients on functional surfaces — the system is color-block (decorative blobs behind marketing sections are the only exception)
7. Keep Inter tracking at `-0.01em` / `-0.16px` across the board
8. Use shadcn/ui (base-nova) primitives as the foundation, themed with these tokens
9. Use hugeicons for all iconography — never inline raw SVGs for standard UI icons

### Known Gaps

- Decorative blob positioning (Soft Gold `#FDE68A` / Sky Blue `#7DD3FC`) on marketing sections is qualitative — exact coordinates per section are not tokenized; place by eye behind sections where "playful preschool" feel is needed
- Specific per-component animation timings beyond the few documented (`--duration: 0.4s`, `--iconTransition: all ease-out 0.2s`, `--expanderDuration: 300ms`) are not captured for every interactive surface
- Form error-state full styling (red border weight, icon placement) is visible on the tint token but not exhaustively specified
- Certificate-page specific components (child-name script card, star-grid award) are referenced but not covered by this extraction — add when certificate feature is built
- Parent-portal specific mockup specs are hinted at by the Partnership Card but not fully documented — extend when parent portal is built
- Achievement tier color gradients (Bronze/Silver/Gold header rings) are qualitative — exact stops not tokenized
