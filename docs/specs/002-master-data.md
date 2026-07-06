# Spec: Master Data

## Problem
No kids, guardians, terms, sessions, or activities exist. Every feature downstream needs these entities.

## Scope
**IN:** Kid CRUD (name, dob, status: waiting/enrolled/alumni, guardian link), Guardian CRUD (name, phone, email, optional second_contact), sibling linking (one guardian → many kids), Term CRUD, Session CRUD (recurring schedule + holiday overrides), cohort assignment (kids to terms), Activity Catalog CRUD (name, category, soft-delete, prompt-to-add from "other" entries), CSV seed import for Kids / Guardians / Teachers / Waiting list / Activity Catalog.

**OUT:** Schedule assignment (activities per session), class capture, observations, reports, any AI.

## Happy Path
1. Owner adds a Kid (name, dob) and links to a Guardian (name, phone, email).
2. Owner creates a Term (name, start_date, end_date) → enrolls kids from waiting list into the term cohort.
3. Owner defines Session schedule: recurring days-of-week + time slots within the term, with holiday overrides (date, reason).
4. Owner populates the Activity Catalog: name, category (e.g., "motorik", "seni", "outing").
5. Owner imports CSV for bulk Kid/Guardian/Catalog seeding.

## Data Model
```sql
kids: id, name, dob, status (enum: waiting|enrolled|alumni), guardian_id (FK guardians), enrolled_term_id (FK terms, nullable), created_at, updated_at

guardians: id, name, phone, email, second_contact_name, second_contact_phone, created_at, updated_at

terms: id, name, start_date, end_date, is_active, created_at

sessions: id, term_id (FK terms), date, start_time, end_time, label, is_holiday, holiday_reason, created_at

activities: id, name, category, is_deleted, deleted_at, created_at, updated_at
```

Guardian-kid is 1:N (one guardian → many kids). A kid belongs to one guardian. No junction table needed.
Cohort = kids with `enrolled_term_id = X`.
"Sibling linking" = guardian has multiple kids → same guardian_id.

## Edge Cases
- CSV parse error → reject row with line number, continue rest.
- Duplicate kid name + dob → warn, skip (not error — names can repeat in real world; manual dedup).
- Kid status transition: waiting → enrolled → alumni (no reverse except alumni → enrolled by Owner override).
- Holiday override on a session date → session marked `is_holiday`, schedule entry blocked for that date.
- Soft-deleted activity still referenced by past sessions → retains FK, hides from picker, shows in past data as "(archived)".
- Enrolling a kid into a term without an active term → block, surface message.
- Guardian with no enrolled kids → hidden from active roster, visible in "all guardians" admin view.

## Acceptance Criteria
- [ ] Owner can create, read, update, and delete Kids and Guardians.
- [ ] Kid status transitions follow waiting → enrolled → alumni (reverse only by override).
- [ ] Owner can create Terms and Sessions with recurring schedule + holiday overrides.
- [ ] Owner can assign kids to a term cohort.
- [ ] Owner can CRUD Activity Catalog with soft-delete and restore.
- [ ] CSV import works for Kids, Guardians, Teachers, Waiting list, and Activity Catalog.
- [ ] Teacher cannot access Kid/Guardian/Term/Activity management pages (403).
- [ ] No console errors.
- [ ] Deployed to staging, working end-to-end.

## Technical Notes
Depends on: 001-scaffold-auth.
Parallel-buildable: Kid+Guardian CRUD is independent of Term+Session CRUD and Activity Catalog CRUD — one dev can work all three sequentially within this spec.

Drizzle schema additions. API routes under `/api/kids`, `/api/guardians`, `/api/terms`, `/api/sessions`, `/api/activities`. CSV import via PapaParse on client, POST to batch-create endpoints. All mutations Owner-only (middleware check).
