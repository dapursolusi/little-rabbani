# Preschool LMS

A back-office tool for a small preschool. Captures daily observations of each kid so that reports (daily parent, monthly, quarterly) can be generated instead of hand-composed.

## Language

### People

**Kid**:
A child enrolled at the preschool. The central entity around which observations are recorded and reports are generated.
_Avoid_: Student, child, student (use "Kid" everywhere — matches the preschool's own vocabulary).

**Kid Status**:
The lifecycle stage of a kid: `waiting` (on the waiting list, not yet enrolled), `enrolled` (attending sessions), or `alumni` (graduated or left). Only `enrolled` kids appear in session rosters and reports.
_Avoid_: Active/inactive (too generic — hides the waiting-list and alumni distinctions).

**Guardian**:
The parent or caretaker who receives a kid's reports. One guardian is registered per kid; a guardian may be linked to multiple kids (siblings). A second guardian (e.g., the other parent) is an optional contact field on the guardian record, not a separate entity — multi-guardian login is deferred to a later phase.
_Avoid_: Parent (overloaded — "parent" of what?), mom/dad.

**Teacher**:
A staff member who leads a class session and captures observations during it.
_Avoid_: Staff, educator.

**Owner**:
The preschool's owner-operator (Hanifah). Has full access, reviews/polishes generated reports, captures the Daily Class Report, and is the default actor when no other is specified.
_Avoid_: Admin, principal.

### Capture

**Observation**:
A single structured record of something noted about a kid during a session (e.g., mood, appetite, an activity participated in, absence). Captured by recall _after_ the session ends — not in real time — within the memory window the short class length allows. The atomic unit of the system; reports are projections of stored observations.
_Avoid_: Entry, log, report-item, data-point.

**Note**:
A free-text remark about a kid (e.g., "extra talkative today," "fell asleep early"). Unstructured, per-kid, surfaces in the Daily Parent Report narrative only — not aggregated into monthly/quarterly reports.
_Avoid_: Comment, annotation (too generic).

**Activity**:
Something a class or kid does during a session (e.g., painting, circle time, free play). Selected from the Activity Catalog by the owner at the class level when capturing the Daily Class Report; teachers then record per-kid participation by tapping. "Other" free-text activities may be added at the class level only.
_Avoid_: Task, exercise, lesson.

**Activity Catalog**:
The predefined list of activities the owner maintains. The source of consistent vocabulary that enables monthly/quarterly aggregation by activity.
_Avoid_: Activity list, library.

**Session**:
A scheduled class period on a given date (e.g., the morning session, 9–11am). Observations belong to one kid in one session. A preschool day may run more than one session.
_Avoid_: Class (overloaded), period, slot.

### Reports

**Daily Parent Report**:
A generated view of one kid's observations for one school day, drafted for that kid's guardian(s). Owner may edit a short narrative layer on top before sending.
_Avoid_: Daily report (ambiguous — see Daily Class Report).

**Monthly Report**:
A generated summary of one kid's observations across a calendar month.

**Quarterly Report**:
A generated summary of one kid's observations across a school quarter (≈3 months).

**Daily Class Report**:
A whole-class summary of one session — the activities run that day and what the class learned. Captured by the owner (not teachers). Distinct from per-kid Daily Parent Reports, which are projections of individual observations.
_Avoid_: Class summary, session recap.

## Design & UI

The design system is defined in `DESIGN.md` (extracted from the marketing site, `littlerabbani.com`) and the token layer lives in `src/app/globals.css`. Two sources, one split: `DESIGN.md` carries intent; `globals.css` is the executable theme.

**Brand Token Roles** (the four-green system — using a single "brand green" everywhere flattens the brand):

- **Brand Primary** (`--color-brand-primary #048647`, Little Rabbani Green): the dominant brand signal — headings, primary section headers.
- **Brand Accent** (`--color-brand-accent #0e9f5A` → `#0e9f5a`, Bright Green): the filled-CTA color ("Save", "Send report"), active dashboard CTAs. Brighter than primary for button contrast on the cream canvas.
- **Brand House** (`--color-brand-house #385451`, Dark Teal): sidebar surface, footer, feature bands, deep-status surfaces. The deep near-ink brand teal.
- **Brand Canvas** (`--color-brand-canvas #faf5f2`, Cream): the primary page background — warm, not cold white. Load-bearing; pure white as page canvas is forbidden.
- **Brand Gold** (`--color-brand-gold #eab308`, Amber Gold): achievement/status ceremony accent only — never a general-purpose accent.
- **Brand Mint** (`--color-brand-mint #d1f0e0`, Soft Mint): valid-field tint, success-state backgrounds, sidebar active-item tint.
- **Brand Soft-Gold / Brand Sky** (`#fde68a` / `#7dd3fc`): decorative blobs behind marketing sections only — never functional.

**Semantic Status Tokens**`:root` defines `--destructive`; `--success` and `--warning` are added in the foundations pass (success → brand-mint family with `--color-brand-accent` foreground; warning → `--color-brand-gold`). Use `bg-success/10` + `text-success`, `bg-destructive/10` + `text-destructive`, `bg-warning/10` + `text-warning` — never raw `bg-green-100`/`text-red-700`/`bg-amber-50`.

**Shadcn Base-Nova Primitives** (`src/components/ui/`): auto-generated; never edited directly (AGENTS.md). Brand customization happens via tokens in `globals.css` (e.g. a global Button pill override) or per-call classNames — never by editing the primitive files.

**Hugeicons**: the only iconography library. Structural UI chrome (checkmark, lock, warning, back-arrow) must use Hugeicons SVGs. A mood glyph displayed as a child's recorded mood is _data content_, not chrome — emoji is acceptable there.

**Shared Components** (`src/components/shared/`): `EmptyState`, `Pagination`, `SearchInput`, `getStatusBadge`. Originally extracted but left orphaned (zero importers); the foundations sweep adopts them site-wide. Any list page should use one of these rather than an inline duplicate.

**Raw-color sweep mapping** (the C-2 contract): `text-zinc-900` → `text-foreground`; `text-zinc-500` / `text-zinc-600` → `text-muted-foreground`; `border-zinc-200` / `border-zinc-300` → `border`; `bg-zinc-50` → `bg-muted`; `bg-green-100` + `text-green-700` → `bg-success/10` + `text-success`; `bg-red-50` + `text-red-700/800` → `bg-destructive/10` + `text-destructive`; `bg-amber-*` + `text-amber-*` → `bg-warning/10` + `text-warning`.

_Avoid_ (in UI): defaulting to raw Tailwind-color classes; editing `src/components/ui/`; emoji as UI chrome; square button corners (50px pill is universal, via global override). See `AUDIT_FULL.md` and ADR 0006 for the full defect list and sequencing.
