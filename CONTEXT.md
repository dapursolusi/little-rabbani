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

**Session**: A scheduled class period on a given date — one Session Type running on one school date (e.g., the 9–10:30am morning block on Tue 12 Feb). Observations belong to one kid in one session. A preschool day may run more than one session; a kid attends exactly one session per day. Not persisted as its own row — derived from date + active Session Type + whether that date is a Holiday. See ADR 0007.
_Avoid_: Class (overloaded), period, slot, occurrence.

**Session Type**: A named, recurring time block the preschool runs — e.g., Session 1 (9–10:30am), Session 2 (11am–12:30pm). Has start/end and an active state; only active types are offered for planning and capture. When its time changes (e.g., Session 1 moves from 9am to 8:30am next year), the old row is deactivated and a new one created — deactivated rows are frozen history so past captures keep their original times. See ADR 0007.
_Avoid_: Session schedule, time slot, period config.

**Holiday**: A day or date range the preschool is closed — e.g., Eid al-Fitr (a 5-day span), Vesak Day, a school field trip. National holidays may be synced from the Indonesian holiday calendar; custom closures are entered by the owner; term-scoped closures belong to one term. One row per closure event with its own reason and source; multiple events can share a date (e.g., a national holiday and a field trip the same day). `_Avoid_`: Day off, closure, off-day, break (too generic). See ADR 0007.

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

Design system defined in `DESIGN.md`; tokens in `globals.css`. Brand tokens: Primary `#048647`, Accent `#0e9f5a`, House `#385451`, Canvas `#faf5f2`, Gold `#eab308`, Mint `#d1f0e0`, Soft-Gold/Sky for decorative blobs only. Semantic tokens: `--destructive`, `--success`, `--warning` via `bg-*/10` + `text-*`. See `DESIGN.md` for full spec.

UI rules: never edit `src/components/ui/`; Hugeicons for chrome (emoji = data content only); shared components at `src/components/shared/` (`EmptyState`, `Pagination`, `SearchInput`, `getStatusBadge`). Raw-color sweep mapping: `text-zinc-900` → `text-foreground`; `text-zinc-500/600` → `text-muted-foreground`; `border-zinc-200/300` → `border`; `bg-zinc-50` → `bg-muted`; `bg-green-100` → `bg-success/10` + `text-success`; `bg-red-50` → `bg-destructive/10` + `text-destructive`; `bg-amber-*` → `bg-warning/10` + `text-warning`. See ADR 0006 for defect list and sequencing.
