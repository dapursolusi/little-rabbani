# UI Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make existing UI surfaces correct and consistent (tokens, dark mode, semantic colors, root metadata) so the bespoke signature-surface work in later plans has a stable base.

**Architecture:** Surgical foundation sweep — collapse the `DESIGN.md` ↔ `globals.css` rem-token drift, rebuild `.dark` mode from a broken teal-on-teal swap to a Stripe-warm-light dark companion, sweep audit items C-2 (raw Tailwind colors → semantic tokens), C-3 (emoji-as-chrome → Hugeicons), C-6 (duplicate `<span>` badges → shared `getStatusBadge`), and H-2 (hardcoded `#FAF5F2` → `bg-brand-canvas`). Foundation-only output intentionally stays at shadcn-median — craft work happens in the signature-surface plans, not here.

**Tech Stack:** Next.js App Router, Tailwind CSS 4 (CSS-first, `globals.css`), shadcn/ui base-nova, hugeicons, Vitest, bun.

## Global Constraints

Copied verbatim from the spec & AGENTS.md. Every task's requirements implicitly include these:

- **Package manager:** bun only — `bun run`, `bunx`. Never npm/pnpm/yarn.
- **No `any` types:** use `unknown` or a proper interface.
- **No `console.log` in production code:** `console.warn`/`console.error` only.
- **No editing `src/components/ui/`:** shadcn base-nova components are auto-generated.
- **Icons:** hugeicons only for all iconography. Warning icon = `Alert02Icon` (established repo idiom, already used in `src/components/ui/sonner.tsx`).
- **Token names** (from `src/app/globals.css`): `--color-brand-canvas: #faf5f2`, `--color-brand-house: #385451`, `--color-brand-primary: #048647`, `--color-brand-accent: #0e9f5a`. Semantic: `--success`, `--warning`, `--destructive`, `--foreground`, `--muted-foreground`, `--muted`, `--border`, `--card`, `--background`, `--ring`.
- **Tailwind classes for tokens:** `bg-muted`, `text-muted-foreground`, `text-foreground`, `border-border` (or bare `border` — base layer sets color), `bg-destructive/10`, `text-destructive`, `bg-success/10`, `text-success`, `bg-brand-canvas`. These resolve to the CSS vars above.
- **Commit format:** `type(scope): description`, lowercase subject (commitlint rejects sentence-case — `docs: ui …` not `docs: UI …`). Never push to `main` directly — branch → PR.
- **Naming:** Components PascalCase, props interfaces `I`-prefixed (`IButtonProps`), types `T`-prefixed.
- **Spacing:** standard Tailwind v4 scale (`1rem = 16px`). The `--space-*` rem tokens in `DESIGN.md` are NOT implemented in code and are removed by this plan.

## Pre-Task Audit Note

The `AUDIT_FULL.md` is partially shipped (verified 2026-07-10). **Verify each item's current state before fixing** — do not trust the audit heading blindly. Specifically: C-5 (native `<select>`) is **already resolved** (zero `<select>`/`<option>` in `src/` as of this plan) and is excluded. C-8 (teacher mobile tab) already shipped. If a task's "fix" target is already correct, skip it and note the skip in the commit — don't manufacture work.

---

## Task 1: Remove the unimplemented `--space-*` token layer from `DESIGN.md`

The doc references `--space-1` … `--space-9` rem tokens that do not exist in `globals.css`, and claims `1rem = 10px` via a `font-size: 62.5%` root trick that is not applied. This drift confuses every agent. Task 1 corrects the doc math; Task 2 cleans up the globals side.

**Files:**

- Modify: `DESIGN.md` (sections 3 "Typography Rules", 5 "Layout Principles > Spacing System")

**Interfaces:**

- Consumes: nothing.
- Produces: a `DESIGN.md` that matches the code's math (`1rem = 16px`, Tailwind scale).

- [ ] **Step 1: Read the two affected sections**

Run: `grep -n "62.5\|1rem = 10px\|--space-" DESIGN.md`
Expected: matches around lines 123 and 437–457.

- [ ] **Step 2: Fix the Typography note (§3, ~line 123)**

Replace the bullet:

```markdown
- **Size tokens use rem, anchored to `1rem = 10px`** on this site (via a `font-size: 62.5%` root trick). So `1.6rem` = 16px, `2.4rem` = 24px, etc. The scale is semantic (textSize-1 through textSize-10), not arbitrary pixel values.
```

with:

```markdown
- **Size tokens use the standard Tailwind v4 scale** (`1rem = 16px`). The app does **not** apply a `font-size: 62.5%` root trick; `DESIGN.md` earlier assumed one and it was never wired into `globals.css`. Use Tailwind spacing utilities (`p-4` = 16px, `gap-6` = 24px, etc.) rather than bespoke `--space-*` rem tokens — the latter are not implemented.
```

- [ ] **Step 3: Replace the Spacing System table (§5, ~lines 435–457)**

Replace the `### Spacing System` block (the `--space-1`…`--space-9` table + the `--outerGutter*` tokens) with:

```markdown
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
```

- [ ] **Step 4: Verify no other `--space-*` references remain**

Run: `grep -n "\-\-space-" DESIGN.md`
Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add DESIGN.md
git commit -m "docs(design): correct rem math, remove unimplemented space tokens"
```

---

## Task 2: Confirm `globals.css` has no orphaned `--space-*` and document the Tailwind-only stance

`globals.css` never defined `--space-*` tokens, so there's nothing to delete — but add a one-line comment so the next agent doesn't re-introduce them. Also fixes the dead root-metadata tell.

**Files:**

- Modify: `src/app/globals.css` (add a comment near the `@theme inline` block)
- Modify: `DESIGN.md` (§1, note the dark-companion rebuild lands in Task 3 — add a forward pointer)

**Interfaces:**

- Consumes: Task 1's corrected §5.
- Produces: `globals.css` with a documented "no custom space tokens" stance.

- [ ] **Step 1: Add a positioning comment to globals.css**

In `src/app/globals.css`, inside the `@theme inline { ... }` block, after the `--radius-4xl` line and before `--shadow-card`, add:

```css
/* Spacing: use the standard Tailwind v4 scale (1rem = 16px).
     Do NOT add bespoke --space-* tokens — DESIGN.md §5 documents the
     Tailwind-only stance. */
```

- [ ] **Step 2: Verify the file still parses**

Run: `bun run lint 2>&1 | tail -20`
Expected: no new errors (CSS lint may be quiet; if linter reports nothing about globals.css, that's the pass).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style(globals): document tailwind-only spacing stance"
```

---

## Task 3: Rebuild `.dark` mode from a broken teal-on-teal swap to a Stripe-warm-light dark companion

The current `.dark` sets `--background: #2b6b5a` (mid-teal page bg) and `--card: #385451` (teal card) — card is invisible against bg, and brand-teal-as-bg is the marketing register, not the dashboard dark register. Rebuild to a neutral desaturated dark background with cards lifted one step lighter and green preserved as accent only.

**Files:**

- Modify: `src/app/globals.css` (the `.dark { ... }` block, lines ~109–146)

**Interfaces:**

- Consumes: the brand token values from `:root`.
- Produces: a `.dark` theme that is legible (cards visibly lifted off bg) and on-register (neutral bg, green accent).

- [ ] **Step 1: Read the current `.dark` block**

Confirm the current values (lines 109–146): `--background: #2b6b5a`, `--card: #385451`, `--popover: #385451`, etc. Note that `--brightness` is not a token here — values are plain hex/oklch.

- [ ] **Step 2: Replace the entire `.dark { ... }` block**

Replace lines 109–146 (the whole `.dark { ... }` rule) with:

```css
.dark {
  /* Stripe-warm-light dark companion: neutral desaturated bg, cards lifted one
     step lighter, brand green preserved as accent only (never the page bg). */
  --background: #1c1f1e;
  --foreground: rgba(255, 255, 255, 0.92);
  --card: #262a28;
  --card-foreground: rgba(255, 255, 255, 0.92);
  --popover: #262a28;
  --popover-foreground: rgba(255, 255, 255, 0.92);
  --primary: #0e9f5a;
  --primary-foreground: #ffffff;
  --secondary: #323735;
  --secondary-foreground: rgba(255, 255, 255, 0.9);
  --muted: #2f3432;
  --muted-foreground: rgba(255, 255, 255, 0.6);
  --accent: #0e9f5a;
  --accent-foreground: #ffffff;
  --success: #8fdfb8;
  --success-foreground: #0e9f5a;
  --warning: #eab308;
  --warning-foreground: #1c1f1e;
  --destructive: #f87171;
  --border: rgba(255, 255, 255, 0.1);
  --input: rgba(255, 255, 255, 0.14);
  --ring: #0e9f5a;
  --chart-1: #0e9f5a;
  --chart-2: #38d39f;
  --chart-3: #fbbf24;
  --chart-4: #60a5fa;
  --chart-5: #f87171;
  --radius: 0.625rem;
  --sidebar: #161918;
  --sidebar-foreground: rgba(255, 255, 255, 0.9);
  --sidebar-primary: #0e9f5a;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: rgba(255, 255, 255, 0.08);
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: rgba(255, 255, 255, 0.1);
  --sidebar-ring: #0e9f5a;
}
```

Key properties of this palette: bg `#1c1f1e` is a near-black warm-neutral; card `#262a28` is one step lighter (visible lift); sidebar `#161918` is one step darker than bg (recessed rail); all greens are accent-only (`--primary`, `--accent`, `--ring`, `--sidebar-primary`); chart palette is brightened for dark-bg legibility.

- [ ] **Step 3: Typecheck + lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS (CSS var changes don't affect types).

- [ ] **Step 4: Visually verify in the app (manual)**

The implementer should run `bun run dev`, open the app, toggle `.dark` (the app sets dark via a class on `<html>` — if there's a theme toggle, use it; otherwise DevTools → add `class="dark"` to `<html>`). Confirm: cards visibly lift off the background; no teal-on-teal; green appears only on primary actions/accents. If the app has no dark-mode toggle and no production dark path, this is still a correctness fix for future dark surfaces — note in the commit if unverified live.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "fix(dark): rebuild dark theme as neutral desaturated companion"
```

---

## Task 4: Sweep raw Tailwind colors → semantic tokens (audit C-2)

Hardcoded `text-zinc-*`, `bg-zinc-50`, `border-zinc-*`, `bg-red-500`, `bg-green-500`, `bg-blue-600`, `text-amber-700`, etc. instead of semantic tokens. Highest-visual-impact item and the one that makes dark mode + consistency feel off. This task is a mechanical, repo-wide sweep with a mapping table — no per-file bespoke decisions.

**Files:**

- Modify: all `src/**/*.{tsx,ts}` that match the patterns below (verified ~5 files have residual raw colors as of this plan; the sweep is safe to run repo-wide because it only replaces exact matches).

**Interfaces:**

- Consumes: the semantic token classes from Global Constraints.
- Produces: a codebase where colors route through CSS vars (so dark mode + future themes work).

- [ ] **Step 1: Re-measure current scope (audit is partially shipped)**

Run:

```bash
grep -rEn "text-zinc-[0-9]|bg-zinc-[0-9]|border-zinc-[0-9]" src/ | wc -l
grep -rl "text-zinc-[0-9]\|bg-zinc-[0-9]\|border-zinc-[0-9]" src/
```

Record the file list. Proceed to Step 2 only on files that actually match. If zero matches: skip to Step 6, note the skip.

- [ ] **Step 2: Sweeep zinc → semantic (per-file, exact replacements)**

For each file from Step 1, apply these exact string replacements (use the editor's replace-all per file). Mapping:

| Raw               | Semantic                |
| ----------------- | ----------------------- |
| `text-zinc-900`   | `text-foreground`       |
| `text-zinc-700`   | `text-foreground`       |
| `text-zinc-600`   | `text-muted-foreground` |
| `text-zinc-500`   | `text-muted-foreground` |
| `text-zinc-400`   | `text-muted-foreground` |
| `bg-zinc-50`      | `bg-muted`              |
| `bg-zinc-100`     | `bg-muted`              |
| `border-zinc-200` | `border-border`         |
| `border-zinc-300` | `border-border`         |

Apply per-file with the Edit tool (`replace_all: true` per pattern). Do not invented replacements that aren't in the table.

- [ ] **Step 3: Sweep status colors in `offline-indicator.tsx`**

In `src/components/sections/offline-indicator.tsx`, replace the raw status backgrounds:

| Raw            | Semantic         |
| -------------- | ---------------- |
| `bg-green-500` | `bg-success`     |
| `bg-red-500`   | `bg-destructive` |
| `bg-blue-600`  | `bg-primary`     |

(Use `bg-success`/`bg-destructive`/`bg-primary` — these are the filled-status roles; the white text on them stays correct since `--success-foreground`/`--destructive` contrast is handled by the token. If a `text-white` on `bg-primary` looks off in dark mode, leave it — that's a polish refinement for the signature-surface plans, out of foundation scope.)

- [ ] **Step 4: Sweep the remaining amber/red/green status tints**

Run:

```bash
grep -rEn "bg-red-50|text-red-[0-9]|bg-green-100|text-green-[0-9]|bg-amber-50|text-amber-[0-9]|border-amber-" src/
```

For each match, apply:

| Raw                | Semantic            |
| ------------------ | ------------------- |
| `bg-red-50`        | `bg-destructive/10` |
| `text-red-700`     | `text-destructive`  |
| `text-red-800`     | `text-destructive`  |
| `bg-green-100`     | `bg-success/10`     |
| `text-green-700`   | `text-success`      |
| `bg-amber-50`      | `bg-warning/10`     |
| `border-amber-200` | `border-warning/30` |
| `text-amber-700`   | `text-warning`      |

- [ ] **Step 5: Verify the sweep is clean + lint**

Run:

```bash
grep -rEn "text-zinc-[0-9]|bg-zinc-[0-9]|border-zinc-[0-9]|bg-red-[0-9]|bg-green-[0-9]|bg-blue-[0-9]|text-red-[0-9]|text-green-[0-9]|text-amber-[0-9]|bg-amber-50|border-amber-" src/ | wc -l
```

Expected: `0`.

Run: `bun run typecheck && bun run lint`
Expected: PASS.

- [ ] **Step 6: Commit (or note the skip)**

If sweeps applied:

```bash
git add -A src/
git commit -m "refactor(ui): sweep raw tailwind colors to semantic tokens (C-2)"
```

If Step 1 found zero matches, skip the commit and record in `HANDOFFS.md` under this session: "C-2 already resolved — verified zero raw Tailwind colors in `src/`."

---

## Task 5: Replace emoji-as-chrome with Hugeicons (audit C-3, residual)

Audit C-3 named emoji-as-chrome (`✓ ⚠️ 🔒 ✗`, mood glyphs). As of this plan, capture-roster's chrome emojis are already gone and the mood emojis (where they remain as _data content_) are acceptable. The verified residual is `⚠️` in `offline-indicator.tsx:110`. Verify scope, then fix only what remains.

**Files:**

- Modify: `src/components/sections/offline-indicator.tsx` (and any other file matching the verify step)

**Interfaces:**

- Consumes: `Alert02Icon` from `hugeicons` (already used in `src/components/ui/sonner.tsx`).
- Produces: no emoji used as UI chrome.

- [ ] **Step 1: Re-measure emoji-as-chrome scope**

Run:

```bash
grep -rEn "⚠️|🔒|✓|✗" src/components src/app | grep -v node_modules
```

Record matches. Acceptable to leave: mood glyphs (`😢😟😐😊😄`) where they display a child's captured mood as _data content_ (per audit). Replace: any of `⚠️🔒✓✗` used as _chrome_ (status, lock, checkmark, close).

- [ ] **Step 2: Fix `offline-indicator.tsx` ⚠️**

In `src/components/sections/offline-indicator.tsx`, first verify the import surface — check the top of the file for an existing hugeicons import. Add to the imports (if not present):

```tsx
import { Alert02Icon } from 'hugeicons';

import { HugeiconsIcon } from '@/components/ui/hugeicons-icon';
```

(Verify the exact `HugeiconsIcon` wrapper path — run `grep -rn "hugeicons-icon" src/components/ui/ | head -1` and use that path. If the repo imports icons differently, match the existing idiom from `src/components/ui/sonner.tsx`.)

Then replace the warning toast block (around line 110):

```tsx
<div className="sticky top-0 z-50 bg-destructive px-4 py-1.5 text-center text-xs font-medium text-white">
  ⚠️ {quotaMessage}
</div>
```

with:

```tsx
<div className="sticky top-0 z-50 bg-destructive px-4 py-1.5 text-center text-xs font-medium text-white">
  <HugeiconsIcon icon={Alert02Icon} className="h-3.5 w-3.5 inline-block" />{' '}
  {quotaMessage}
</div>
```

(Note: `bg-red-500` → `bg-destructive` is folded in here since this block is in the C-2 sweep's scope; if Task 4 already changed it, the only edit is the icon line.)

- [ ] **Step 3: Fix any other chrome-emoji the verify step found**

For each remaining `⚠️🔒✓✗`-as-chrome hit from Step 1, apply the same pattern: `Alert02Icon` for warnings, `Lock02Icon` for locks, `Tick02Icon` for checkmarks, `Cancel01Icon` for close. Verify each icon name exists by checking the hugeicons package: `grep -rn "Alert02Icon\|Lock02Icon\|Tick02Icon\|Cancel01Icon" node_modules/hugeicons/dist/ 2>/dev/null | head` — if a name isn't found, pick the closest `*Icon` already imported elsewhere in `src/` (`grep -rn "Icon' from 'hugeicons" src/`).

- [ ] **Step 4: Verify no chrome-emoji remains + lint**

Run:

```bash
grep -rEn "⚠️|🔒" src/components src/app
```

Expected: no matches for `⚠️` or `🔒` (check `✓✗` only where they're chrome, not textual content).

Run: `bun run typecheck && bun run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/offline-indicator.tsx
git commit -m "refactor(ui): replace emoji chrome with hugeicons (C-3)"
```

---

## Task 6: Deduplicate report status badges → shared `getStatusBadge` (audit C-6)

Two report index pages define local `getStatusBadge()` returning raw `<span>` badges instead of the shared `<Badge>`-based component at `src/components/shared/get-status-badge.tsx` (which is already correct and uses semantic tokens). The audit (C-6) names `monthly/page.tsx:49-55` and `quarterly/page.tsx:12-34`. The shared component is already there and already uses `--success`/`--warning`/`Badge`. This task wires the duplicates to the shared one and deletes the local copies.

**Files:**

- Modify: `src/app/dashboard/owner/reports/monthly/page.tsx`
- Modify: `src/app/dashboard/owner/reports/quarterly/page.tsx`
- Test: `tests/components/get-status-badge.test.ts` (new)

**Interfaces:**

- Consumes: `getStatusBadge(status: string)` from `@/components/shared/get-status-badge`.
- Produces: a single source of truth for the status→badge mapping, covered by a unit test.

- [ ] **Step 1: Verify the shared component's behavior with a failing test**

Create `tests/components/get-status-badge.test.ts`:

```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getStatusBadge } from '@/components/shared/get-status-badge';

describe('getStatusBadge', () => {
  it('renders the Indonesian label for a known status', () => {
    render(getStatusBadge('sent'));
    expect(screen.getByText('Terkirim')).toBeDefined();
  });

  it('renders the raw status string for an unknown status', () => {
    render(getStatusBadge('unexpected'));
    expect(screen.getByText('unexpected')).toBeDefined();
  });

  it('renders Final for the final status', () => {
    render(getStatusBadge('final'));
    expect(screen.getByText('Final')).toBeDefined();
  });

  it('renders Perlu Diperbarui for the stale status', () => {
    render(getStatusBadge('stale'));
    expect(screen.getByText('Perlu Diperbarui')).toBeDefined();
  });
});
```

Run: `bun run test -- tests/components/get-status-badge.test.ts`
Expected: PASS (the shared component already implements this correctly — this test locks the contract so the dedup in Steps 2–3 can't regress it).

- [ ] **Step 2: Wire `monthly/page.tsx` to the shared helper**

In `src/app/dashboard/owner/reports/monthly/page.tsx`:

- Add the import: `import { getStatusBadge } from '@/components/shared/get-status-badge';`
- Delete the local `getStatusBadge` function (the audit's local definition at ~lines 49–55 — a function returning a raw `<span>`).
- Replace any local call site that referenced the local function with the imported one (the call signature is identical: `getStatusBadge(status)`).

Verify before/after the call sites render identically (the shared version returns a `<Badge>` instead of a `<span>`, which is the intended upgrade — visual diff is expected and correct).

- [ ] **Step 3: Wire `quarterly/page.tsx` to the shared helper**

In `src/app/dashboard/owner/reports/quarterly/page.tsx`:

- Same as Step 2: add the import, delete the local `getStatusBadge` (audit's ~lines 12–34), rely on the shared one.

- [ ] **Step 4: Verify no local `getStatusBadge` definitions remain**

Run:

```bash
grep -rn "function getStatusBadge\|const getStatusBadge" src/app/
```

Expected: no matches (only the shared export in `src/components/shared/get-status-badge.tsx` should define it).

- [ ] **Step 5: Run the test + typecheck + lint**

Run: `bun run test -- tests/components/get-status-badge.test.ts && bun run typecheck && bun run lint`
Expected: PASS on all.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/owner/reports/monthly/page.tsx src/app/dashboard/owner/reports/quarterly/page.tsx tests/components/get-status-badge.test.ts
git commit -m "refactor(reports): dedupe status badges to shared helper (C-6)"
```

---

## Task 7: Replace hardcoded `#FAF5F2` with `bg-brand-canvas` (audit H-2) + set real root metadata

Two layout files hardcode `bg-[#FAF5F2]` instead of the `bg-brand-canvas` token. And the root layout exports dead template metadata (`'Create Next App'`) instead of `baseMetadata`. Bundle the metadata fix here because it's a one-liner in the same file family and the same "foundation correctness" register.

**Files:**

- Modify: `src/app/dashboard/teacher/layout.tsx` (the `bg-[#FAF5F2]`)
- Modify: `src/app/dashboard/owner/layout.tsx` (the `bg-[#FAF5F2]`)
- Modify: `src/app/layout.tsx` (metadata)
- Modify: `src/lib/metadata.ts` (placeholder app name/description → real)

**Interfaces:**

- Consumes: `baseMetadata` from `@/lib/metadata`, `bg-brand-canvas` token.
- Produces: correct root `<title>`/metadata + token-based layout backgrounds.

- [ ] **Step 1: Find every hardcoded canvas hex**

Run:

```bash
grep -rn "FAF5F2\|faf5f2" src/
```

Record the matches (audit names `teacher/layout.tsx:11` and `owner/layout.tsx:24`).

- [ ] **Step 2: Replace each with the token**

For each match from Step 1, replace `bg-[#FAF5F2]` with `bg-brand-canvas` (case-insensitive on the hex — handle `#FAF5F2` and `#faf5f2`). Use the Edit tool per file.

- [ ] **Step 3: Set real app name/description in `metadata.ts`**

In `src/lib/metadata.ts`, replace:

```ts
const APP_NAME = 'Your App Name';
const APP_DESCRIPTION = 'Your app description here';
```

with:

```ts
const APP_NAME = 'Little Rabbani';
const APP_DESCRIPTION =
  'Preschool learning management — capture, reports, and roster for teachers and owners.';
```

- [ ] **Step 4: Wire `baseMetadata` into the root layout**

In `src/app/layout.tsx`:

- Add the import: `import { baseMetadata } from '@/lib/metadata';`
- Replace the local `metadata` export:

```tsx
export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};
```

with:

```tsx
export const metadata: Metadata = baseMetadata;
```

- [ ] **Step 5: Verify no hardcoded canvas hex remains + typecheck + lint**

Run:

```bash
grep -rn "FAF5F2\|faf5f2" src/
```

Expected: no matches.

Run: `bun run typecheck && bun run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/teacher/layout.tsx src/app/dashboard/owner/layout.tsx src/app/layout.tsx src/lib/metadata.ts
git commit -m "fix(foundation): brand-canvas token + real root metadata (H-2)"
```

---

## Task 8: Foundation verification + HANDOFFS.md

Final gate: confirm the foundation is internally consistent and record state for the next session (which starts the signature-surface plans).

**Files:**

- Modify: `HANDOFFS.md` (overwrite per AGENTS protocol)

**Interfaces:**

- Consumes: Tasks 1–7.
- Produces: a verified foundation baseline + a handoff pointing to the next plan (signature surface: owner dashboard).

- [ ] **Step 1: Full verification suite**

Run:

```bash
bun run typecheck && bun run lint && bun run test
```

Expected: all PASS. If `bun run test` includes the existing `tests/` suite plus the new `get-status-badge.test.ts`, all green.

- [ ] **Step 2: Confirm the audit sweep is complete**

Run:

```bash
echo "=== raw colors (expect 0) ==="
grep -rEn "text-zinc-[0-9]|bg-zinc-[0-9]|border-zinc-[0-9]|bg-red-[0-9]|bg-green-[0-9]|bg-blue-[0-9]" src/ | wc -l
echo "=== chrome emoji (expect 0 for ⚠️🔒) ==="
grep -rEn "⚠️|🔒" src/components src/app | wc -l
echo "=== local getStatusBadge defs (expect 0) ==="
grep -rn "function getStatusBadge\|const getStatusBadge" src/app/ | wc -l
echo "=== hardcoded canvas hex (expect 0) ==="
grep -rn "FAF5F2\|faf5f2" src/ | wc -l
echo "=== native select (expect 0) ==="
grep -rn "<select\|<option" src/ | wc -l
```

Expected: all `0`.

- [ ] **Step 3: Write HANDOFFS.md**

Overwrite `HANDOFFS.md`;

```markdown
## [Session — 2026-07-13] — UI foundation sweep (Strategy B, §1)

- **What changed:** `DESIGN.md` rem-math + `--space-*` removal (Task 1); `globals.css` spacing-stance comment (Task 2); `.dark` rebuilt as neutral desaturated companion (Task 3); raw Tailwind colors → semantic tokens repo-wide (Task 4, C-2); emoji-as-chrome → Hugeicons (Task 5, C-3); report status badges deduped to shared helper + test (Task 6, C-6); `#FAF5F2` → `bg-brand-canvas` + real root metadata (Task 7, H-2).
- **State:** shipped.
- **Verification:** `bun run typecheck`, `bun run lint`, `bun run test` — all PASS. Audit sweep counts all 0 (raw colors, chrome emoji, local getStatusBadge defs, hardcoded canvas hex, native select).
- **Next steps:**
  1. Signature-surface plan: owner dashboard (`owner/page.tsx`) — spec §2.1, reference-driven (Stripe dashboard), focal hierarchy + staggered-entrance motion + reduced-motion.
  2. Then teacher capture flow (§2.2), then reports timeline (§2.3).
  3. Doc sync (§4) interleaves per surface.
- **Blockers:** none.
- **Notes:** C-5 (native `<select>`) and C-8 (teacher mobile tab) were already resolved before this session — verified, no work needed. `scale(0.95)` button-press dial deferred to live observation per §3.6.
```

- [ ] **Step 4: Commit + (optionally) open PR**

```bash
git add HANDOFFS.md
git commit -m "docs(handoff): foundation shipped, next is owner dashboard signature surface"
```

If the implementer has been working on a branch (recommended per AGENTS trunk-based flow), open a PR:

```bash
gh pr create --title "feat(ui): foundation — tokens, dark mode, audit sweep" --body "Strategy B §1. See docs/superpowers/plans/2026-07-13-ui-foundation.md."
```

---

## Self-Review

**1. Spec coverage** (spec §1 foundation items):

- §1.1 doc/code rem gap → Task 1 (doc) + Task 2 (globals comment). ✓
- §1.2 `.dark` rebuild → Task 3. ✓
- §1.3 audit sweeps: C-2 → Task 4; C-5 → excluded (already resolved, documented in Pre-Task Note + Task 8 handoff); C-6 → Task 6; C-3 → Task 5; H-2 → Task 7. ✓
- §1.4 root metadata → Task 7. ✓
- §1.5 out-of-scope items (C-1, C-4, C-7, no motion/density/signature/rewrite) — none have tasks, correct. ✓

**2. Placeholder scan:** no TBD/TODO/"add error handling"/"similar to Task N". Every code step shows actual code. The verify-then-fix structure for C-2/C-3 (Step 1 = re-measure) is explicit, not placeholder text. ✓

**3. Type consistency:** `getStatusBadge(status: string)` signature identical in the shared component (Task 6 Step 1 test) and the call sites (Steps 2–3). `baseMetadata` import path `@/lib/metadata` matches the actual file. Token names (`bg-brand-canvas`, `text-muted-foreground`, etc.) match `globals.css`. ✓

**4. Audit-trust gap:** the plan's Pre-Task Note + the verify-first Step 1 of Tasks 4/5 + the exclusion of C-5 address the fact that the audit is partially shipped. ✓
