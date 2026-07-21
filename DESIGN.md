# Design System for Little Rabbani

> **IMPORTANT:** This DESIGN.md is the single source of truth for ALL UI work in this project. It must be referenced in `AGENTS.md` and consulted before any component, page, or visual change. Built on shadcn/ui (base-nova preset), Tailwind CSS 4 (CSS-first config), and hugeicons.

## 1. Visual Theme & Atmosphere

Warm, nurturing preschool LMS. Cream canvas (`#FAF5F2` / `#F0EBE6`), four-tier greens (Brand/Bright/Dark Teal/Mid Teal), Amber Gold (`#EAB308`) reserved for achievement ceremony. Inter typeface everywhere (`-0.16px` tracking). Marketing pages switch to Lora serif for headlines; Caveat script for child-name decorations. 50px full-pill buttons, `scale(0.95)` active press. WhatsApp floating button (`#25D366`, 56px) with layered shadow stack — signature elevation element.

**Key Characteristics:**

- Four-tier greens mapped to distinct surface roles, Amber Gold = achievement-only
- Cream canvas (`#FAF5F2` / `#F0EBE6`), never pure white
- Inter as universal voice, Lora for marketing headlines, Caveat for child-name decorations
- 50px full-pill buttons, `scale(0.95)` active press, WhatsApp floating button (`#25D366`)
- Decorative blobs (`#FDE68A` / `#7DD3FC`) on marketing surfaces only — never functional
- 12px card radius, whisper-soft layered shadows
- Standard Tailwind v4 spacing — no custom `--space-*` tokens

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
- **Size tokens use the standard Tailwind v4 scale** (`1rem = 16px`). The app does **not** apply a `font-size: 62.5%` root trick; `DESIGN.md` earlier assumed one and it was never wired into `globals.css`. Use Tailwind spacing utilities (`p-4` = 16px, `gap-6` = 24px, etc.) rather than bespoke `--space-*` rem tokens — the latter are not implemented.
- **Context-specific typeface swaps** — serif (Lora) on the marketing page, script (Caveat) on certificate/profile decorations — are deliberate and localized. Never mix them with the primary sans within the same surface.
- **Body text never goes pure black** — it sits at `#1a1a2e` to match the warm-neutral canvas temperature.

### Note on Font Substitutes

- **Inter** is the primary typeface, loaded via `next/font/google` in this project's root layout. No swap needed — this project uses Inter directly as the SoDoSans substitute.
- **Lora** (marketing serif) is available on Google Fonts — load via `next/font/google` only on marketing pages where it is used, to avoid bloating dashboard bundles.
- **Caveat** (decorative script) is available on Google Fonts — load lazily only on certificate/profile surfaces where the hand-written touch is needed.

## 4. Component Stylings

### Buttons

**Shared baseline:** 50px radius (full pill), `7px 16px` padding, Inter, `scale(0.95)` active state, `all 0.2s ease` transition. Listed below as variant-specific overrides only.

| Variant                 | BG               | Text      | Border                 | Font                   | Use                                  |
| ----------------------- | ---------------- | --------- | ---------------------- | ---------------------- | ------------------------------------ |
| Primary Filled          | `#0E9F5A`        | `#fff`    | `1px solid #0E9F5A`    | 16px / 600 / `-0.01em` | "Save / Mark complete / Send report" |
| Primary Outlined        | transparent      | `#0E9F5A` | `1px solid #0E9F5A`    | —                      | "Cancel / View details"              |
| Black Filled            | `#000`           | `#fff`    | `1px solid #000`       | 14px / 600             | Login strips, conversion moments     |
| Dark Outlined           | transparent      | `#1a1a2e` | `1px solid #1a1a2e`    | 14px / 600             | "Back to dashboard"                  |
| Green-on-Green Inverted | `#fff`           | `#0E9F5A` | `1px solid #fff`       | —                      | White button on dark teal bands      |
| Outlined on Dark        | transparent      | `#fff`    | `1px solid #fff`       | —                      | Secondary CTA on dark-teal bands     |
| Consent Agree           | `rgb(14,159,90)` | `#fff`    | none                   | 14px / 400             | Cookie-consent agree action          |
| Feedback Tab            | `#0E9F5A`        | `#fff`    | `12px 12px 0 0` radius | 14px / 400             | Fixed bottom-right "Report an issue" |

**WhatsApp floating button:**

- `#25D366` bg, white WhatsApp glyph, 56px/40px, 50% radius
- Fixed bottom-right, `-0.8rem` touch offset
- Shadow stack: `0 0 6px rgba(0,0,0,0.24)` + `0 8px 12px rgba(0,0,0,0.14)`
- Active: ambient shadow → `0 8px 12px rgba(0,0,0,0)` with `scale(0.95)`
- Signature elevation element, matches littlerabbani.com

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

The app uses the **standard Tailwind v4 spacing scale** (`1rem = 16px`). There is no custom `--space-*` token layer. Use Tailwind utilities directly.

| Tailwind | Pixels | Typical Use                                   |
| -------- | ------ | --------------------------------------------- |
| `gap-1`  | 4px    | Tightest inline spacing                       |
| `gap-2`  | 8px    | Small gap, button vertical padding            |
| `gap-4`  | 16px   | Default — card padding, outer gutter (mobile) |
| `gap-6`  | 24px   | Section inner spacing, outer gutter (tablet)  |
| `gap-8`  | 32px   | Major between-section spacing                 |
| `gap-10` | 40px   | Large gaps, outer gutter (desktop)            |
| `gap-12` | 48px   | Section-to-section spacing                    |

**Outer gutter scale:** mobile `px-4` (16px) → tablet `px-6` (24px) → desktop `px-10` (40px).

**Universal rhythm constant:** `gap-4` (16px) is the default outer gutter, card padding baseline, and body text size — the system's most frequent spacing unit.

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

**Shadow philosophy:** 2–3 low-alpha layered shadows per element, never one heavy shadow. WhatsApp button is the most elevated element on any page.

### Decorative Depth

- **No gradient system** — surfaces are solid color-block
- **Color-block banding** carries perceived depth (dark-teal bands read as "recessed feature zones" between cream/white body sections)
- **Decorative blobs** (Soft Gold `#FDE68A`, Sky Blue `#7DD3FC`) at low opacity behind marketing sections add playful depth without structural gradients

## 7. Rules

- Canvas: Cream (`#FAF5F2`) or Warm Off-White (`#F0EBE6`), never pure white
- Green roles: Little Rabbani Green for headings, Bright Green for CTAs, Dark Teal for sidebar/bands/footer
- Tracking: `-0.01em` / `-0.16px` on Inter throughout
- Buttons: 50px full-pill, `scale(0.95)` active state, always
- Amber Gold: achievement/status ceremony only
- Typefaces: Inter for UI, Lora for marketing headlines, Caveat for certificate decorations
- Shadows: 2–3 low-alpha layered, never single heavy shadow
- WhatsApp button: persistent floating contact on every surface
- Icons: hugeicons for all chrome, emoji only for data content (mood glyphs)
- shadcn/base-nova primitives, theme via tokens — never edit `src/components/ui/`

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

## 9. Known Gaps

- Decorative blob positioning — qualitative, place by eye on marketing sections
- Per-component animation timings — only a few documented (`--duration: 0.4s`, `--iconTransition: all ease-out 0.2s`, `--expanderDuration: 300ms`)
- Form error-state full styling — not exhaustively specified
- Certificate-page components — add when certificate feature is built
- Parent-portal specs — extend when parent portal is built
- Achievement tier color gradients (Bronze/Silver/Gold) — qualitative, exact stops not tokenized
