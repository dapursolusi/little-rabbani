# Little Rabbani — Domain Language

A back-office tool for a small Indonesian preschool (owner: Hanifah). The v1
app — the observation/report domain (daily/monthly/quarterly reports, sessions,
curriculum) — is archived to `_archives/` (vocab in `_archives/docs-v1/`). The
V2 rebuild from the auth shell has shipped **only the kid/guardian module**
(`src/features/kids/`); the archived domain vocab below is kept only as the
target glossary for the planned rebuild, not live vocabulary.

## Language

### People

**Kid**:
A child at the preschool. In V2 the kid row is **identity-only** (name,
nickname, gender, dob, guardian, relationship) — enrollment status is _not_ on
the kid (ADR-0002). `_Avoid_`: Student, student (use "Kid" everywhere —
matches the preschool's own vocabulary).

**Guardian**:
The parent or caretaker of a kid. **Phone is the guardian's identity.** `phone`
is unique and its format is enforced (local Indonesian `08...`, no country
code) at the input boundary, so the phone alone reliably matches a returning
guardian when registering a sibling. A guardian is created and edited _through
the kid form_ — the record is shared, so editing it on one kid propagates to
every kid linked by the same `guardianId`. There is no dedicated guardian
module. A second contact (e.g. the other parent) is an optional
`secondContactName`/`secondContactPhone` field on the guardian record, not a
separate entity. `_Avoid_`: Parent (overloaded — "parent" of what?), mom/dad.

**Guardian Relationship**:
The kid's relationship to their guardian — `mother`, `father`,
`older_sibling`, `grandparent`, `aunt_uncle`, or `other`. Stored on the kid row
(a guardian may be a mother to one kid and an aunt to a sibling), not on the
guardian. `older_sibling` is real in this context: in Indonesia an adult
sibling sometimes enrolls an orphaned younger sibling. `other` (the generic
"wali") is the catch-all. `_Avoid_`: A second fallback enum value — `other`
alone covers it.

**Teacher**:
A staff member who leads a class session and captures observations during it.
`_Avoid_`: Staff, educator.

**Owner**:
The preschool's owner-operator (Hanifah). Has full access; only `owner` may run
mutating server actions (`requireOwner` gate). `_Avoid_`: Admin, principal.

### Archived (v1 — not implemented in V2)

The following vocabulary belongs to the archived v1 observation/report domain
(`_archives/docs-v1/adr/`). Keep the terms in mind as the target for the
rebuild, but do not model them yet.

**Kid Status** (waiting / enrolled / alumni) — dropped from the kid identity
(ADR-0002); enrollment returns as a separate event-history feature.

**Observation**, **Note**, **Activity**, **Activity Catalog** — the per-kid
capture vocabulary feeding reports.

**Curriculum**, **Session**, **Session Type**, **Holiday** — the scheduling
vocabulary.

**Daily Parent Report**, **Monthly Report**, **Quarterly Report**, **Daily
Class Report** — the report vocabulary.

## Design & UI

Design system defined in `DESIGN.md`; tokens in `globals.css`. Brand tokens:
Primary `#048647`, Accent `#0e9f5a`, House `#385451`, Canvas `#faf5f2`, Gold
`#eab308`, Mint `#d1f0e0`, Soft-Gold/Sky for decorative blobs only. Semantic
tokens: `--destructive`, `--success`, `--warning` via `bg-*/10` + `text-*`.
See `DESIGN.md` for full spec.

UI rules: never edit `src/components/ui/`; Hugeicons for chrome (emoji = data
content only); shared components at `src/components/shared/` (`EmptyState`,
`Pagination`, `SearchInput`, `getStatusBadge`). Raw-color sweep mapping:
`text-zinc-900` → `text-foreground`; `text-zinc-500/600` →
`text-muted-foreground`; `border-zinc-200/300` → `border`; `bg-zinc-50` →
`bg-muted`; `bg-green-100` → `bg-success/10` + `text-success`; `bg-red-50` →
`bg-destructive/10` + `text-destructive`; `bg-amber-*` → `bg-warning/10` +
`text-warning`. (Original defect list and sequencing archived in
`_archives/docs-v1/adr/0006-ui-consolidation-foundations-first.md`.)
