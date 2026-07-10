# 007 — UI Consolidation: Audit Fixes + DESIGN.md Token Adoption

> Status: ready-for-agent
> Consumes: `AUDIT_FULL.md` (verified-state note), ADR 0006, `DESIGN.md`, `CONTEXT.md` § Design & UI
> Scope: foundations-first, ~7 live critical defects + DESIGN.md token adoption across the LMS dashboard surfaces

## Problem Statement

Teachers and the owner use a preschool LMS whose surfaces are visually inconsistent and partly broken. Raw hardcoded Tailwind colors (`text-zinc-500`, `border-zinc-200`, `bg-green-100`, `bg-red-50`) are used in ~600 places instead of the semantic theme tokens that already exist — so the app can't be themed, dark mode is impossible, and screens drift from the documented Little Rabbani brand. Structural UI affordances use emoji (lock, checkmark, warning) that render inconsistently across devices and are inaccessible. A data-conflict resolution button labelled "Simpan Keduanya" (keep both) silently sends server values instead of the teacher's local values — so choosing to keep local edits actually discards them, with no error surfaced. A guardian picker on the kid form uses a native `<select>` where every other field on the same form uses the styled component. The few shared components that were built to deduplicate this work (empty states, pagination, search inputs, status badges) have zero importers — dead code — while every page reimplements them inline. Several list screens (monthly/quarterly report pickers, teacher session picker, daily-report kid list) render hundreds of rows at once with no search or pagination.

The design system that should govern all of this exists in `DESIGN.md`, but most of it was extracted from the marketing site; only the token layer (cream canvas, four-tier green, 50px pill buttons, `scale(0.95)` active, Hugeicons) applies to the back-office dashboard, and that layer is largely defined in `globals.css` but not adopted.

## Solution

A single foundations-first consolidation pass that treats the audit defects and the DESIGN.md token adoption as one effort (because the audit's highest-impact item — raw colors — is exactly the prerequisite the design theme needs). Execute in four dependency-ordered tracks, bugs first, then token foundation, then the color sweep (which folds in the dead-code-component adoption, emoji→icon, and Button-icon fixes per file so each file is touched once), then the remaining unpaginated list screens. Net-new marketing-only features from DESIGN.md are deferred.

The destination: every dashboard surface uses semantic tokens and the brand color roles; all buttons are 50px pills with the signature active press; all structural icons are Hugeicons; shared components are adopted site-wide; the few genuinely broken list pages paginate and search; the conflict-resolution button does what it says.

## User Stories

### Conflict & capture (Track 1 — bugs)

1. As a teacher, when a capture conflict is detected and I choose "Simpan Keduanya", I want my local mood, appetite, and presence values to be saved (not the server's), so that my edits aren't silently discarded.
2. As a teacher, when a conflict save is in progress, I want the button to show a loading state, so that I don't tap it twice.
3. As a teacher, when a conflict save succeeds or fails, I want a toast, so that I know the outcome rather than guessing from a silent screen.
4. As an owner adding a kid, when I pick the guardian, I want the same styled select component used by the rest of the form, so that the field looks and behaves consistently.

### Token & theme foundation (Track 2)

5. As an owner, I want status indicators (good/amber/warn/error) rendered through semantic tokens, so that the colors are consistent across every screen and themed together.
6. As an owner, I want every button to use the brand's 50px pill shape with the press scale, so that the dashboard feels like the Little Rabbani product, not a default shadcn install.
7. As a future maintainer, I want success/warning tokens defined alongside the existing destructive token, so that status colors have a named home rather than scattered raw values.
8. As a future maintainer, I want the brand customization to live in the token layer (not edited primitive files), so that shadcn base-nova components can be regenerated without losing brand styling.

### Color sweep & icon compliance (Track 3)

9. As an owner, I want text colors to use foreground/muted tokens, so that on any surface the text contrast is correct and themeable.
10. As an owner, I want borders to use the border token, so that hairlines are consistent and themeable.
11. As a teacher, I want the locked-tab indicator, checkmarks, and warnings to be crisp SVG icons, so that they render the same on every device and are legible at every size.
12. As a teacher, I want a recorded child mood to display as the mood emoji (data I captured), so that the human-readable mood stays warm — while UI chrome uses icons.
13. As an owner, I want button icons sized by the button's variant, not by a hardcoded class, so that an icon in a small button is small and in a large button is large.
14. As an owner, I want leading/trailing button icons to get the correct padding, so that icon buttons aren't cramped or off-center.
15. As an owner, I want empty list states to use one shared EmptyState component, so that every "no results" screen is consistent.
16. As an owner, I want status badges to use the shared getStatusBadge, so that the same status renders the same color everywhere (not four divergent copies).

### Remaining list pagination (Track 4)

17. As an owner generating monthly reports, I want to search and paginate the kid×month grid (up to 180 items), so that I can find a kid without scrolling an unbounded list.
18. As an owner generating quarterly reports, I want the same search + pagination, so that I'm not re-scanning the same shape of unbounded list per term.
19. As a teacher starting capture, I want to search/filter the session picker, so that I can find today's session in a card grid.
20. As an owner reviewing daily reports, I want the kid list paginated with a status filter, so that 30+ expandable rows don't render as one wall.
21. As an owner, I want these list pages to adopt the shared Pagination + SearchInput components (not inline duplicates), so that the pattern is maintained in one place.

## Implementation Decisions

### Architecture & sequencing

- Four dependency-ordered tracks, bugs front-loaded, foundations before their consumers. The color sweep (Track 3) is gated on the token foundation (Track 2) and folds in the per-file fixes (C-4 adoption, C-3 emoji, C-9 button icons) so each file is touched once.
- DESIGN.md is honored at the token/adoption layer only. Marketing-only elements (feature bands, decorative blobs, Lora/Caveat typefaces, hero photography split) are deferred — they belong to the marketing site, not the LMS. The floating WhatsApp button already exists and is an existing decision, not new work.

### Track 1 — bugs (local, unblock users)

- **C-7 conflict resolution:** the `IConflictData` interface gains a `localFields` member mirroring `serverFields` (mood, appetite, presence). It is populated wherever the conflict object is constructed. The "Simpan Keduanya" handler submits the _local_ field values (not server) while continuing to merge server + local notes (append-only, unchanged). The silent `catch {}` is removed; success/failure produce a toast (sonner) and a loading spinner guards the button during save. The nonsense presence-derivation from `localNotes.length > 0` is deleted.
- **C-5 native select:** the guardian picker in the kid form is rewritten to the shadcn `Select` + `SelectTrigger` + `SelectContent` + `SelectItem` pattern already used by the status and term pickers in the same file.

### Track 2 — token foundation

- `globals.css` `:root` and `.dark` gain `--success`, `--success-foreground`, `--warning`, `--warning-foreground`. Success maps from the brand-mint family with `--color-brand-accent` foreground; warning maps from `--color-brand-gold`. They are exposed to Tailwind via `@theme inline` so `bg-success/10`, `text-success`, `bg-warning/10`, `text-warning` are usable — the documented contract in `CONTEXT.md`.
- A global Button pill override (via `@layer` in `globals.css`, not by editing `src/components/ui/button.tsx` — which AGENTS.md forbids) makes the shadcn Button default `rounded-full`, honoring DESIGN.md's universal 50px pill. The existing `active:scale-95` and `has-data-[icon*]` padding variants in the Button already exist and are untouched.
- No new npm packages. No `src/components/ui/` edits.

### Track 3 — C-2 color sweep + fold-ins

- A raw-color → semantic-token mapping is captured first (the contract in `CONTEXT.md` § Design & UI): zinc-900→foreground, zinc-500/600→muted-foreground, border-zinc→border, bg-zinc-50→muted, green status→success/10 + success, red→destructive/10 + destructive, amber→warning/10 + warning. Applied file-by-file across ~50 files / ~600 sites.
- Per file, as it is visited, fold in:
  - **C-4 adoption:** replace inline empty-state, pagination, search-input, and status-badge duplicates with the shared `EmptyState`/`Pagination`/`SearchInput`/`getStatusBadge` (rescuing four orphaned components).
  - **C-3 emoji:** structural emoji (lock, checkmark, warning, cancel, back-arrow) → Hugeicons. Mood emoji displayed as recorded child data stays — only chrome changes.
  - **C-9 button icons:** remove hardcoded `h-4 w-4` (overrides the Button's `size-4` variant system) and add `data-icon="inline-start"` / `data-icon="inline-end"` so the Button's `has-data-[icon*]` padding selectors fire.

### Track 4 — remaining list pagination (C-1 remainder)

- Add server-side pagination + search (page size 30–50) only to the genuinely-unpaginated screens: monthly report picker, quarterly report picker, teacher session picker, daily-report kid list. These adopt the shared `Pagination` + `SearchInput`.
- The owner kid/guardian/activity list pages already paginate inline (shipped in the prior `shadcn-compliance` commit) and are left untouched — no refactoring of working legacy code (AGENTS.md).

### Resolved decisions carried from grilling (ADR 0006)

- Objective: both audit + DESIGN.md, dashboard-bounded.
- C-2 sweep execution: single exhaustive pass + per-file fold-ins (one touch per file).
- Status tokens: add `--success`/`--warning` (no repurposing of decorative brand-mint/gold as functional).
- Button radius: global CSS pill override (no `ui/` edit).
- C-7 test seam: extract the keep-local payload logic into a pure helper in `src/lib/capture-offline.ts` and test at the lib layer (highest existing seam) — see Testing Decisions.
- Verification: typecheck+lint per step, build after the full sweep, one C-7 regression test, visual sample.

### Scope corrections (run from verified scope, not the stale audit)

- C-8 (teacher tab bar covering content) already shipped — removed.
- C-1 owner list pages already paginated inline — leaves only the report pickers + teacher/daily lists.
- Raw `<button>` violations (20, per `docs/shadcn-violations-audit.md`) all already fixed.
- Live critical set is 7, not 9.

## Testing Decisions

### What makes a good test here

Test external behavior at the highest existing seam, not implementation details. This codebase's established seam is **`tests/lib/*.test.ts` — pure-function Vitest against `src/lib/*`** (capture, dcr, offline-queue, offline-sync-reconnect, schedule, reports). There is exactly one component test (`tests/components/dashboard-shells.test.ts`) and one E2E (`e2e/homepage.spec.ts`); component/E2E seams exist but are sparsely used.

### C-7 regression test (the one non-trivial logic change)

The bug lives in a React handler, but the codebase doesn't test components. The seam gap is closed the right way: **extract the keep-local-values payload decision into a pure helper** in `src/lib/capture-offline.ts` (something like `buildKeepLocalPayload(conflict): { kidId, sessionId, mood, appetite, presence, version, notes }`), then assert in `tests/lib/` (pattern of `offline-queue.test.ts` / `offline-sync-reconnect.test.ts`) that:

- given a conflict with local + server field values, `buildKeepLocalPayload` returns the **local** mood/appetite/presence;
- notes are the append-only merge of server + local notes (unchanged behavior preserved);
- presence is the local presence value (not derived from `localNotes.length`).

The component handler becomes a thin caller of this helper. One runnable check at the lib seam; the logic can't silently regress to "sends server values" again.

### What does NOT get a test

- The C-2 color sweep is mechanical class token replacement; per-site tests would be pre-hardening the happy path. Verified by `bun typecheck`, `bun lint`, and `bun build` (catches broken class/token references), plus a visual sample of a few pages in dev.
- C-5 (native select → shadcn Select), C-9 (data-icon / icon class removal), and Track 2 tokens are verified by typecheck + lint + build, not unit tests.
- Track 4 pagination is verified by build + manual flow against the report picker; no new E2E (would be disproportionate to a foundations pass).

### Execution

`bun run typecheck` + `bun run lint` after each foundation step; `bun run build` after the full sweep; the C-7 regression test runs in the normal `bun run test` suite.

## Out of Scope

- DESIGN.md marketing-only elements: feature bands, hero photography split, cookie consent module, decorative blobs, Lora/Caveat typeface loading. These belong to the marketing site, not the LMS dashboard.
- Migrating the three working owner list pages (kid/guardian/activity) off their inline pagination onto the shared component — they work; AGENTS.md forbids refactoring working legacy code unless told.
- Dark mode implementation beyond the token foundation (adding `--success`/`--warning` is in scope; shipping and visually verifying a full dark theme is a separate effort).
- Achievement/status card cluster, certificate-page components, parent-portal components — DESIGN.md "Known Gaps", built when those features are built.
- The Medium/Low audit items (space-y→gap, redundant hover on non-interactive badges, duplicated SessionForm/SessionEditForm, teacher-schedule polling, etc.) — tracked in `AUDIT_FULL.md` but not in this spec's foundations pass.
- Any new npm package or data-layer change.
- Full E2E coverage of the report pagination flow (a single homepage E2E exists; expanding to per-feature E2E is disproportionate here).

## Further Notes

- **Seam gap surfaced:** the codebase tests `lib/` but not components, yet several audit defects (C-7, C-4) have their real complexity in component handlers. Track 1 resolves the one logic-bearing case (C-7) by extraction; the rest are mechanical/typechecked. A future `/improve-codebase-architecture` pass could propose a component-test seam, but that is out of scope here and would be pre-hardening for this pass.
- **Two prior audit docs** (`docs/frontend-audit-report.md`, `docs/shadcn-violations-audit.md`, both 2026-07-08) are line-level detail sources for the items below the `AUDIT_FULL.md` synthesis. They remain valid references; `AUDIT_FULL.md`'s verified-state note reconciles their overcounts.
- **Tracker setup gate:** this spec's publish-to-tracker step (as a GitHub Issue with `ready-for-agent`) depends on `/setup-matt-pocock-skills` configuring the tracker and triage labels — the repo currently has only a `duplicate` label. Until that runs, the spec lives here in `docs/specs/007-ui-consolidation.md` (matching the in-repo `001`–`006` convention).
- **Handoff to tickets:** once published, `/to-tickets` should split this into tracer-bullet tickets with declared blocking edges. Suggested split mirrors the four tracks: T1 (bugs, no blockers), T2 (token foundation, no blockers), T3 (color sweep, **blocked-by** T2), T4 (remaining pagination, **blocked-by** T3 on the shared-component adoption it reuses). Each `/implement` then runs in a fresh context against one ticket.
