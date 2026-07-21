# UI Consolidation — Foundations-First, Audit + Design.md Aligned

Two overlapping debts: `AUDIT_FULL.md` ~35 defects, `DESIGN.md` future brand system. Rejected separate efforts — audit's top finding (raw Tailwind colors: `text-zinc-500` ×119, `border-zinc-200` ×58) is prerequisite for DESIGN.md theme; doing sequentially touches every file twice.

Also rejected full DESIGN.md — most is marketing-page concerns, not back-office LMS. Dashboard-relevant subset: tokens (color tiers, cream canvas, pill radius, layered shadow scale). WhatsApp button already exists (`src/components/layout/whatsapp-button.tsx`).

**Decision — four tracks:**

1. **Bugs first:** Fix C-7 conflict dialog (`"Simpan Keduanya"` sends server values — add `localFields` to `IConflictData`); fix C-5 (native `<select>` → shadcn `Select`).
2. **Token foundation:** Add `--success`/`--warning` tokens to `globals.css`, global Button pill override (`rounded-full`) — no edits to `src/components/ui/`.
3. **C-2 sweep:** One pass: raw-color → semantic-token mapping applied file-by-file. Fold C-4 (adopt orphaned `Pagination`/`SearchInput`/`EmptyState`), C-3 (structural emoji → Hugeicons), C-9 (fix Button icon padding) — one touch per file.
4. **C-1 remainder:** Only unpaginated screens get shared `Pagination`/`SearchInput`. Owner lists already paginated inline — left per no-refactor-working-code rule.

**Verification:** `bun typecheck` + `bun lint` after each step, `bun build` after full sweep. One regression test for C-7. Mechanical sweep gets no per-site test.

**Tradeoffs:** Foundations-first = early sessions show no visible change. Single-sweep concentrates risk but limits churn to one touch per file. Scope corrections: C-8 already shipped, C-1 scope reduced inline, C-2 is ~600 sites across ~50 files. Live critical set: 7, not 9.
