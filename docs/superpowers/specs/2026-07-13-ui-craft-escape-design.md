# UI Craft Escape — Design

> **Date:** 2026-07-13
> **Status:** Approved (all 5 sections). Pre-implementation.
> **Register north star:** Stripe (warm light) — daily-use admin dashboard craft.
> **Strategy:** B — Foundation + bespoke signature surfaces.

## Problem statement

The UI reads as "default shadcn competent," not crafted. Diagnosed root cause is
**not** a lack of rules or skills (the project has more than enough of both). Four
root causes, none of which are solved by stacking more UI skills:

1. **Category mismatch.** The reference set (lap.ninja, godly, awwwards) is
   marketing/portfolio sites. This product is a daily-use admin dashboard — a
   different building type with a different excellence bar. A flat green dashboard
   does not become an awwwards site by force.
2. **`DESIGN.md` describes a product that doesn't exist.** ~70% of the doc is
   marketing surfaces (hero 40/60, decorative blobs, achievement tiles, cookie
   consent, parent-portal, lesson-detail stage selector) — none of which are in the
   actual app. The doc was themed against littlerabbani.com (a marketing site) and
   applied to an admin tool.
3. **shadcn↔awwwards is an opposing-optimization trap.** shadcn/base-nova optimizes
   for "competent, consistent, never wrong." Awwwards optimizes for "distinctive,
   memorable." base-nova primitives resist the latter; AGENTS forbids editing
   `src/components/ui/`. Every added rule steers toward more-consistent median
   output (A = correctness/compliance) while the frustration is about craft
   (B = desirability). A-skills cannot reach B.
4. **No point of view; no motion.** Crafted dashboards win on signature grid
   rhythm, focal hierarchy, intentional motion, restraint. Current system has pill
   buttons + `scale(0.95)` + `0.2s ease` — the minimum for "not broken," which reads
   as "forgettable." `DESIGN.md` bans gradients and caps elevation, removing the
   tools high-craft design uses.

Plus two concrete drifts:

- `DESIGN.md` assumes `1rem = 10px` (root trick). `globals.css` has no
  `font-size: 62.5%`, and the `--space-*` tokens the doc references are not
  implemented at all. The doc describes a token layer that was never wired into code.
- `.dark` mode is a broken blind color-swap (teal-on-teal: `--background: #2b6b5a`,
  `--card: #385451` — card invisible against bg).

**Decision:** Re-anchor to dashboard craft (Stripe register) + Strategy B
(foundation + bespoke surfaces). Forks chosen by the operator:

- Re-anchor to dashboard craft (not marketing/awwwards).
- Stripe (warm light) register.
- Strategy B — foundation + bespoke signature surfaces.

---

## Section 1 — Foundation fixes (prerequisite)

Makes existing surfaces correct and consistent so the bespoke work in Section 2 has
a stable base. **Foundation-only output stays at shadcn-median — expected and
correct for the ~30 non-signature pages.**

### 1.1 Collapse the doc/code gap

Stop assuming `1rem = 10px`. Correct `DESIGN.md` to standard `1rem = 16px`
(matches Tailwind v4 defaults and actual `globals.css`). Either implement the
`--space-*` tokens in `globals.css` **or** delete them from the doc and standardize
on Tailwind's spacing scale.

**Decision: delete the bespoke `--space-*` layer.** Tailwind v4's scale is already
correct; the custom layer is aspirational cruft that confuses every agent.
Fewer parallel systems.

### 1.2 Fix `.dark` mode

Currently a broken teal-on-teal blind swap. Rebuild to a Stripe-warm-light _dark
companion_: neutral desaturated background (not brand-teal-as-bg), cards lifted one
step lighter, green preserved as accent only. Dark mode is opt-in polish; it must
not look broken.

### 1.3 Foundation hygiene (audit subset)

The 4 high-leverage sweeps with immediate visual impact:

| Audit item | Defect                                                                                                                        | Fix                                                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **C-2**    | Raw `text-zinc-500` ×119, `text-zinc-900` ×61, `border-zinc-200` ×58, status greens/ambers/reds (~600 occurrences, ~50 files) | Semantic tokens (`text-foreground`, `text-muted-foreground`, `bg-muted`, `border-border`, `bg-destructive/10`, `bg-success/10`). Highest visual-impact item. |
| **C-5**    | Native `<select>` in `kid-form.tsx:130-145`                                                                                   | shadcn `Select` (pattern exists 60 lines below in same file).                                                                                                |
| **C-6**    | Raw `<span>` badges in `monthly/page.tsx:49-55`, `quarterly/page.tsx:12-34`                                                   | shadcn `Badge` / shared `getStatusBadge`.                                                                                                                    |
| **C-3**    | Emoji as chrome (`✓ ⚠️ 🔒 ✗`, 15+ locations)                                                                                  | Hugeicons. (Mood emojis as _data content_ are acceptable; as chrome they are not.)                                                                           |
| **H-2**    | `bg-[#FAF5F2]` hardcoded in 2 layouts                                                                                         | `bg-brand-canvas`.                                                                                                                                           |

### 1.4 Root metadata

Swap `title: 'Create Next App'` (`src/app/layout.tsx:21`) → `baseMetadata`.
1 line. Visible tell in browser tab. (AGENTS rule.)

### 1.5 Out of scope for foundation

- No motion, no density redesign, no signature surfaces, no `DESIGN.md` rewrite.
- C-1 (pagination) — already shipped per `AUDIT_FULL.md` verified note (only 4
  residual pickers remain; folded into Section 2.3 reports timeline instead of
  foundation).
- C-4 (orphaned shared components) — decided separately, not foundation.
- C-7 (conflict-resolution button bug) — that's a _bug_, not design; separate fix.
- C-8 (teacher mobile tab covering content) — already shipped.

---

## Section 2 — Signature surfaces (where craft lives)

Dashboard craft is concentrated in the few screens people stare at daily. **3
bespoke surfaces, not 5** — a fourth/fifth dilute per-surface attention back toward
median, which is the ceiling being escaped. The ~30 remaining pages stay
shadcn-competent.

### 2.1 Owner dashboard (`owner/page.tsx`) — "the home"

Daily landing; owners scan for what needs attention.

- **Focal hierarchy**, not a uniform card grid: one primary "today's attention"
  surface (classes needing capture, unresolved conflicts, pending reports) sized
  larger than everything else; a quiet stat strip beneath; an activity timeline.
- **Deliberately asymmetric density**: one dominant focal point, then graduated
  secondary weight. This is the single move that separates crafted dashboards from
  default-shadcn (which renders every tile equal weight → reads as "generic admin").

### 2.2 Teacher capture flow (`teacher/*`) — "the job"

The on-the-floor daily task; the product's actual job-to-be-done. Opens 5×/day.

- **Capture instrument, not a table**: large tap targets; mood/presence/appetite
  as fast inline controls; sticky confirm-and-send; progress state ("12/18
  captured").
- **Signature motion**: completing a kid animates the roster cursor forward.
- Earns the most investment of the three.

### 2.3 Reports timeline (`owner/reports/*`) — "the read"

Owner reviews daily/monthly/quarterly. Connects three currently-fragmented screens
(daily/monthly/quarterly pickers, all flagged in the audit) into one coherent
surface.

- **Timeline/period navigator** as the primary metaphor (not three disconnected
  pickers) with a clean data-viz layer for the metrics.
- Subsumes audit's residual C-1 picker offenders (monthly report picker, quarterly
  report picker, daily-report kid list).

### What "bespoke" means (all three)

- **Focal hierarchy** — one dominant element, graduated weight below. Not
  equal-weight tiles.
- **Typographic discipline** — size carries hierarchy (display/page/body/mono-meta),
  restrained weights.
- **One signature motion each** — not five. Highest-ROI craft investment.
- **Restraint** — shadcn handles buttons/inputs/dialogs _inside_ these surfaces.
  Composing primitives at a higher altitude, not re-skinning them.

### Out of scope

- No bespoke treatment of kid/guardian/activity/session CRUD pages (correct
  altitude = shadcn consistent).
- No marketing surfaces (`DESIGN.md`'s hero/achievement/parent-portal specs describe
  unbuilt product — out entirely).

---

## Section 3 — Motion system

The part `DESIGN.md` currently caps into oblivion (`0.2s ease` everywhere + shadow/
gradient bans). Motion is the differentiator AI-median output never does well.

### 3.1 Shared grammar (all surfaces, including CRUD)

- **Easing tokens** (replace universal `ease`):
  - `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` — entrances, snappy decel.
  - `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)` — state transitions.
  - `--ease-spring: cubic-bezier(0.32, 2.32, 0.61, 0.27)` — overshoot (already in
    codebase for checked inputs; reused).
- **Duration tokens**: `120ms` (feedback), `180ms` (standard), `280ms` (enter/exit).
  No single `0.2s` for everything.
- **Hover** = color/border shift only, no scale. **Press** = `scale(0.95)` (stated
  signature). **Focus ring** = instant.
- **Enter/exit** (pages, dialogs, toasts): slight y-translate (8px) + fade, 280ms
  ease-out. "Content is placed, not dropped in."

### 3.2 Three signature motions (one per surface)

- **Owner dashboard — staggered focal entrance (on mount, one-time):** "today's
  attention" focal → stat strip → timeline, each trailing by 60ms. Arrival _order_
  communicates hierarchy. No ambient/idle motion after.
- **Teacher capture — roster cursor advance:** submitting a kid's capture slides the
  active-cursor highlight to the next incomplete entry (spring, slight overshoot)
  and dims/completes the prior row. Requires JS orchestration (stateful). Makes
  capture feel like a _flow_, not a _form_.
- **Reports timeline — period scrub:** switching daily/monthly/quarterly cross-fades
  the data layer with a directional x-translate matching scrub direction (left =
  older). Reads as "moving through time," not "reloading."

### 3.3 What motion explicitly avoids

- No hover-scale on cards/buttons (the #1 AI-median tell).
- No ambient/idle motion on static admin content (no parallax, breathing, floating
  — that's the marketing register, wrong building type).
- No staggered entrances on the ~30 CRUD pages — they render instantly.
- No shimmer-skeletons beyond a static placeholder.

### 3.4 Reduced motion

All signature + entrance motion roots in `@media (prefers-reduced-motion: reduce)`
→ durations 0, no transforms, instant state changes. **Non-negotiable.**

### 3.5 Implementation altitude

`tw-animate-css` is already imported in `globals.css` — CSS animations cover
entrance/exit/cross-fade/status transitions with no new dep. The roster-cursor
advance (the one stateful motion) is a small `useEffect` + transition — no
framer-motion.

### 3.6 Craft dial (decision after seeing it live)

`scale(0.95)` press is iOS-scaled but web-large — at the heavy end for desktop
buttons. **If it feels squishy once installed, dial to `0.97`; keep `0.95` for the
WhatsApp button** (its tactile signature). Operator's call after seeing it live.
Default stays `0.95` until observed otherwise.

---

## Section 4 — Doc sync + craft retention

The structural fix that makes craft _retainable_. The burn was "write more rules →
still median." Rules don't produce craft. These are _verification scaffolds_,
different in kind.

### 4.1 Re-scope `DESIGN.md` to the actual product

- **Delete** the marketing/landing specs (hero 40/60, decorative blobs, cookie
  consent, parent-portal partnership card, achievement tiles, lesson-detail stage
  selector). They describe unbuilt product — keeping them is what made the doc read
  as fiction and steer agents wrong. Moved to `# Marketing surfaces (out of scope —
build per-project when the marketing page exists)`.
- **Add** the dashboard primitives the product actually has: roster table, capture
  instrument, report timeline/period navigator, stat strip, breadcrumb nav. Doc
  what exists; stop doc-ing aspiration.
- **Correct** the `1rem=10px` decoupling to standard `1rem=16px` (Section 1.1) and
  remove the unimplemented `--space-*` tokens (Tailwind scale).
- **Re-anchor** the visual register to Stripe-warm-light explicitly, with the three
  signature surfaces + motion grammar from Sections 2-3 as named, referenced
  sections.

### 4.2 Correct the dark-mode spec

`DESIGN.md` doesn't document `.dark` at all despite `globals.css` having one. Add
the dark companion spec from Section 1.2 so a future agent building a dark surface
has guidance instead of inventing one.

### 4.3 Craft retention — three concrete anchors

- **Reference-image grounding.** Each signature surface gets 1-2 reference images
  (Stripe dashboard, Linear capture-interaction analogs) stored under
  `docs/design-refs/` and named in `DESIGN.md`. Future work compares against
  _pixels_, not prose. "Does this read as Stripe or as default-shadcn?" is a
  question that has an answer.
- **Verification checklist for signature surfaces.** A 6-item craft gate:
  1. Focal hierarchy present (one dominant element, graduated weight)?
  2. One signature motion?
  3. Reduced-motion covered?
  4. No hover-scale tell?
  5. Type carries hierarchy (not relying on color/weight alone)?
  6. ≤1 primary action visible?

  The existing `/webapp-preflight` audit stays for the CRUD/shadcn layer; this is a
  separate, smaller gate for the 3 bespoke surfaces only.

- **One canonical implementation per signature surface.** When the dashboard's
  focal hierarchy is built well once, it becomes the template in `DESIGN.md` with a
  pointer to the file. Subsequent surfaces copy _the implementation_, not the doc's
  description of it. The exemplar IS the spec.

### 4.4 What this section is not

- Not a full `DESIGN.md` rewrite (that was Approach C, rejected — rules without
  pixels). Surgical removal of fiction + addition of what exists + the three
  retention anchors.
- Not adding rules governing every component. shadcn governs primitives;
  `DESIGN.md` governs tokens + the 3 signature surfaces + motion. Full scope of
  what's specced.
- Not a "living style guide" infra project. No Storybook, no zeroheight. Markdown +
  reference images + the in-repo exemplar files.

---

## Section 5 — Execution model

The difference between Approach B landing at "AI-median with a motion system
bolted on" vs. genuinely crafted.

### 5.1 Ordering — foundation before bespoke, always

1. **Foundation** (Section 1) ships first and merges. Bespoke surfaces need corrected
   tokens, dark mode, and semantic colors as their base. Lands fast (1-2 sessions):
   well-scoped, audit-identified sweeps.
2. **Signature surfaces** ship one at a time, owner dashboard → capture flow →
   reports timeline. Each gets its full craft pass — entrance, hierarchy, motion,
   reduced-motion — done before the next starts. Folding all three into one pass is
   what regresses to median.
3. **Doc sync** (Section 4) interleaves: the re-scope lands with foundation;
   reference images + exemplar + checklist land with each surface's completion. Doc
   _follows_ implementation, not precedes it — the exemplar IS the spec.

### 5.2 Sequencing within each signature surface — reference-driven

For each of the three, the loop is: (a) pin 1-2 reference images → (b) implement
against them → (c) compare the result to the reference side-by-side → (d) iterate
until it reads as the reference register, not default-shadcn. Step (c) is the craft
gate — without it, the implementation regresses to median by default, every time.

### 5.3 Visual companion

Accepted by the operator (2026-07-13). Server running at
`http://localhost:53808/?key=…` (session dir
`.superpowers/brainstorm/19936-1783915826/`). `.superpowers/` added to `.gitignore`.

Used **only** for Section 2's signature-surface comparison work (step 5.2c) — the
genuinely visual "does this read as Stripe or default-shadcn?" question. Conceptual
decisions stay in terminal. Per-question decision: browser for visual comparison,
terminal for text.

### 5.4 Tests / verification

- **Foundation:** `bun run typecheck` + `bun run lint`. Visual spot-check (mechanical
  shifts).
- **Signature surfaces:** typecheck/lint + the 6-item craft checklist (4.3) +
  reduced-motion verified in DevTools. No new unit tests for visual treatment
  (tests don't verify craft), but the roster-cursor motion's stateful logic gets a
  minimal runnable check (assert-style `demo()`/`__main__` self-check) per ponytail
  protocol.
- **All PRs:** trunk-based flow (branch → PR → CI) per AGENTS. No direct-to-main.

### 5.5 Scope guardrails

- **CRUD pages:** zero bespoke motion, shadcn-consistent only. If tempted to
  "improve" a kid/guardian/activity form — that's scope creep, stop.
- **No new deps.** `tw-animate-css` (present) covers motion; framer-motion only if a
  signature motion genuinely can't be CSS'd — flagged for operator approval if
  reached.
- **Marketing surfaces:** out entirely. If an agent later builds the marketing page,
  that's a separate session with its own register + doc.

### 5.6 What "done" looks like

Foundation merged (tokens correct, dark mode not broken, audit subset swept). Three
signature surfaces each: reference-grounded, craft-checklist-passing,
reduced-motion-covered, motion installed, exemplar filed in `DESIGN.md`. Doc
re-scoped with retention anchors. CRUD layer shadcn-consistent and _left alone_.

---

## Decision log

- **D-001: Register** — Stripe (warm light). Tradeoff: lowest friction with existing
  cream + green tokens; foregoes Linear's density/dark power-user feel, which fought
  the warm brand.
- **D-002: Strategy** — B (foundation + bespoke). Tradeoff: rejects both
  foundation-only (stays median) and doc-rewrite-first (rules without pixels, the
  prior burn). Foundation is prerequisite, not optional.
- **D-003: shadcn boundary** — shadcn governs primitives (incl. all CRUD); bespoke
  craft applied only to 3 signature surfaces. Tradeoff: keeps the "competent/never
  wrong" value where it wins (forms/tables) and concentrates craft investment where
  daily-use tools actually win (the few stared-at screens).
- **D-004: Motion system** — CSS-first via `tw-animate-css`, one stateful motion
  (roster cursor) via `useEffect`. Tradeoff: no framer-motion unless a signature
  motion genuinely can't be CSS'd; keeps dep list clean per AGENTS.
- **D-005: `DESIGN.md`** — surgical re-scope, not rewrite. Tradeoff: rejects the
  "more rules" loop; verification scaffolds (ref images, checklist, exemplar) are
  different in kind from rules.
- **D-006: `--space-*` tokens** — delete bespoke layer, standardize on Tailwind v4
  scale. Tradeoff: fewer parallel systems; loses semantic spacing names but removes
  the doc/code drift that confused every agent.
- **D-007: Visual companion** — accepted, scoped to signature-surface comparison
  only. Tradeoff: token cost at the comparison step; pain gated to the one place a
  visual question genuinely needs a visual answer.
