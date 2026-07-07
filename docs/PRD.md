# PRD: Full Preschool LMS Phase 1

## Document Info

- **Owner:** Hanifah Khoerul Amien (Preschool Owner/My Wife)
- **Status:** Approved
- **Date:** 2026-06-25
- **Target Release:** July 13th, 2026

---

## 1. Problem Statement

### Current Pain

- At the start of the preschool, my wife managed to send daily report + daily class report manually to each kid's parent. But doing so take so much of my wife's time who also need to take care of the family (me and my 2 kids - 2.5 y.o. boy and 5 y.o. girl) and the household. Using AI's text voice prompt, she need to create individual report per kid and refine the response multiple times. And copy the response to whatsapp and sometimes need to be adjusted manually before sent. It usually take from 12.00 pm where the school ends until 18.00. And that from daily report alone. The daily report consist of:
  1. Mood of the kid
  2. Appetite (the preschool offer free snack and the kid bring brunch box)
  3. Absence
  4. Kid's activity of the day
- Every month she also need to create monthly report per individual kid, which pretty much summarize the kid's growth within a month. While also still manage the daily report.
- And every 3 months, she also need to manage the school report.
- My wife didn't have time to store the data from daily report. So she only manages to create the monthly report by looking up the previous whatsapp chat to the parent. And for daily report she created the daily report based on her memory alone or from teachers' information.
- Because of the salary, my wife don't want to burden the teachers to create individual report. Because it still take a long time to create one. And one teacher pretty much handles 5-8 kids. So the time to create one report might around 30 minutes. So for all the kids report a teacher handled is around 2.5 - 4 hours.
- Because of these issue, my wife halt all the reports. So unless parent ask first, my wife only then create the report.

### Root Cause

- Manual reporting system (AI chat generation + whatsapp)
- No automation
- No template

### Why Now

- Until 13th June, 2026 the preschool is in school holiday term.
- A lot of enthusiasm from neighborhood. So many have lined in waiting list. So my wife's planning open two session within a day.

---

## 2. Goals & Success Metrics

### Goals (outcomes, not features)

- G1: Daily Parent Report generation time ≤ 30 min total (all kids), down from 6 hours today.
- G2: Observations persisted per kid per session, enabling Monthly/Quarterly aggregation without reconstructing from WhatsApp history.
- G3: Two-session operation viable without overloading the Owner — distributed capture by Teachers via tap-fast UX.
- G4: Reports sent proactively (daily + monthly + quarterly PDF), replacing the halted-unless-asked status quo.

### Non-Goals (explicitly not in this slice)

Your anti-scope-creep contract.

- NG1: Parent portal / guardian self-serve login (deferred to phase 2).
- NG2: WhatsApp Business API auto-send (v1 uses copy button + manual paste).
- NG3: Multi-guardian login per kid (one guardian record per kid; second guardian = optional contact field).
- NG4: Payment/fees tracking.
- NG5: Photo/video attachments in observations.

---

## 3. User Personas

### Persona A: Hanifah — Owner

- Context: Preschool owner-operator, also wife and mother of 2 kids. Manages class, captures observations, generates/polishes all reports, maintains catalog and schedule. Default actor.
- Primary pain: 6-hour daily report loop (AI chat → refine → WhatsApp paste). Monthly/quarterly reports reconstructed from WhatsApp memory because daily data isn't stored. Reports halted unless parent asks first.
- What success feels like for them: Daily reports done in under 30 min. Data persists. Reports generated, not hand-composed. Time recovered for family and household.

### Persona B: Teacher

- Context: Staff handling a session cohort (5–8 kids). Salary-constrained — no budget for extra report-writing time. Post-class is chaotic (kids leaving, parents asking); no time to hold phone during class itself. 2-hour class length makes recall reliable within a short post-class window.
- Primary pain: No tool today. Composing narrative reports = ~30 min/kid = prohibitive on salary.
- What success feels like for them: Tap ~1 min/kid post-class. No typing. No narrative composition. Done within recall window.

### Persona C: Guardian

- Context: Parent/caretaker of an enrolled kid. Receives reports via WhatsApp (existing channel).
- Primary pain: Reports halted unless they ask first. No visibility into kid's day, month, or term growth.
- What success feels like for them: Daily report on WhatsApp within hours of class. Monthly summaries. Quarterly PDF with growth narrative. No need to chase.

---

## 4. User Stories

Format: "As a [persona], I want [action], so that [outcome]."

### Must-Have (v1)

- As Owner, I want to capture the Daily Class Report (activities + learning) so that Teachers can record per-kid participation against it.
- As Teacher, I want to capture per-kid observations (mood, appetite, absence, notes) by tapping, so that data persists without composing narratives.
- As Teacher, I want to record per-kid activity participation after the Daily Class Report is done, so that participation data is structured.
- As Owner, I want to generate Daily Parent Reports as drafts (structured + AI narrative), so that I review/edit instead of composing from scratch.
- As Owner, I want to copy generated reports to clipboard, so that I send them via WhatsApp manually.
- As Owner, I want to generate Monthly Reports (stats + narrative) on demand, so that I don't reconstruct from WhatsApp history.
- As Owner, I want to generate Quarterly Reports as PDF (changes/improvements/recommendations), so that Guardians receive term summaries.
- As Owner, I want to enter the weekly schedule once (before Friday), so that Teachers see today/tomorrow activities on dashboard and Guardians receive the weekly plan.
- As Owner, I want to add/swap/delete schedule items at any time up until session start, so that sudden events (unplanned visit, outing change) are reflected on Teacher dashboard and Daily Class Report immediately.
- As Owner, I want WhatsApp reminders for pending captures and schedule entry, so that nothing slips without my memory.
- As Teacher, I want my captures to queue offline, so that network drops don't lose data within the recall window.

### Nice-to-Have (v2)

- As Guardian, I want to log in and view report history (parent portal).
- As Owner, I want auto-send via WhatsApp Business API instead of copy/paste.
- As Owner, I want photo attachments in observations.
- As Owner, I want a second Guardian login per kid.

---

## 5. User Journey (Happy Path)

High-level sequence — no wireframes, just the flow.

**Daily flow:**

1. Owner enters the weekly schedule before Friday (catalog activities + outings). Items can be added/swapped/removed anytime up until the session starts — changes appear on Teacher dashboard immediately without re-login.
2. Class runs (no in-class phone use). Post-class, Owner captures the Daily Class Report — activities prefilled from schedule, deviation tracked (done/skipped/modified).
3. Teachers open app, pick today's session, see roster with ✓/✗ captured state. Pass 1 (mood/appetite/absence+reason/notes) captured anytime; Pass 2 (activity participation) unlocked after Daily Class Report done.
4. Owner triggers Daily Parent Report generation → system drafts 6 reports (structured data read-only + AI narrative editable) → Owner edits narratives → copies each to WhatsApp → marks sent. (~15 min total.)
5. If network drops during capture, taps queue locally and sync on reconnect within the recall window.

---

## 6. Functional Requirements

What the system must do. Still no implementation detail.

- FR1: System must authenticate users via Google OAuth with Owner and Teacher roles (role-aware dashboard redirect).
- FR2: System must manage Kids (status: waiting/enrolled/alumni), Guardians (one per kid, sibling-linked), Teachers, Terms, Sessions (recurring schedule + holiday overrides + fixed cohort per term).
- FR3: System must maintain an Activity Catalog (Owner CRUD, categorized, soft-delete, prompt-to-add from "other" entries).
- FR4: System must let Owner enter weekly schedules (catalog activities + outings with location/bring-items/permission flag) with holiday warnings. Owner can edit schedule items at any time up until the session starts; edits propagate live to Teacher dashboard and Daily Class Report prefill without re-login.
- FR5: System must let Owner capture the Daily Class Report (activities prefilled from schedule, deviation tracking done/skipped/modified, Owner can also add unplanned activities mid-capture — these flow into per-kid participation like planned activities and trigger prompt-to-add to catalog).
- FR6: System must let Teachers capture per-kid observations in two passes — Pass 1: mood (5-level), appetite (3-level), presence status (present_full/late/early_pickup/absent), absence reason (sick/family/permission/other), notes (many, free-text); Pass 2: activity participation (yes/no per class-level activity).
- FR7: System must enforce unique constraints per (kid, session, field) with optimistic locking (version field) and two-layer conflict UI (refresh conflicted single-value fields only; notes always persist as append-only).
- FR8: System must queue captures offline (IndexedDB) and sync on reconnect, surfacing optimistic-lock conflicts on flush.
- FR9: System must generate Daily Parent Reports as two layers: read-only structured data (from observations) + editable AI-drafted narrative (Bahasa Indonesia, pre-drafted via OpenRouter).
- FR10: System must generate Monthly Reports on manual trigger (stats + AI narrative from daily narratives), locking underlying observations on gen.
- FR11: System must generate Quarterly Reports as PDF (react-pdf) with three sections — what changed / what improved / recommendations — AI-drafted from stats + daily narratives + previous-term snapshot delta.
- FR12: System must store AI-drafted report snapshots to DB on every generation (regardless of sent status) for future-term delta context.
- FR13: System must lock observations on report generation; Owner override triggers stale → re-gen flow.
- FR14: System must send WhatsApp reminders to Owner (capture pending 15 min post-session, schedule entry Thursday) and show in-app banners to Teachers (pending captures on dashboard open).
- FR15: System must support CSV seed import for Kids/Guardians/Teachers/Waiting list/Catalog.
- FR16: System must let Owner copy generated report text to clipboard and manually mark reports sent (status: draft/sent/stale).

---

## 7. Non-Functional Requirements

- **Performance:** Dashboard loads <2s on mid-range phones. Capture save <500ms perceived (optimistic UI). Report generation <10s per kid.
- **Security:** Google OAuth only (no passwords). Role-based access (Owner full, Teacher capture-only). PII (kid/guardian/phone) stored server-side, never exposed to non-authorized roles. No client-side exposure of non-owned data.
- **Reliability:** Offline capture queue (IndexedDB). Optimistic locking on observation writes. Idempotent upserts per (kid, session, field). Neon daily backups + PITR.
- **UX Constraints:** Mobile-first, one-handed-tap-fast for Teachers (no typing in capture flow). Bahasa Indonesia for all user-facing strings and AI output.

---

## 8. Out of Scope (v1)

Be explicit. This prevents scope creep mid-build.

- Parent portal / Guardian self-serve login (v2)
- WhatsApp Business API auto-send (v2 — v1 uses copy button + manual paste)
- Multi-guardian login per kid (v2 — second guardian is optional contact field only)
- Payment/fees tracking (not planned)
- Photo/video attachments in observations (v2)
- Activity category aggregation in Monthly Reports (v2 — ship activity-name counts only)
- Offline read cache (v2 — ship write queue only)
- Stale-status tracking polish (v1 — simple re-gen button)
- Dashboard audit feed / recent captures widget (v2)
- Schedule deviation reason free-text (v2 — ship done/skipped/modified flags only)
- Report-gen-ready, monthly, and send reminders (v1 — ship capture-pending + schedule-entry reminders only)
- Automated tests (post-launch; manual QA + synthetic fixtures for v1)
- Outing digital permission slips (v1 — flag-only; manual tracking by Owner)

---

## 9. Assumptions, Risks & Open Questions

### Assumptions

- A1: Teachers will adopt tap-based capture (salary-neutral, ~1 min/kid, faster than status quo).
- A2: AI-generated Bahasa Indonesia narrative quality is sufficient after Owner polish.
- A3: DeepSeek (or fallback on OpenRouter) remains available and affordable for the term.
- A4: Google OAuth suffices for ~5 users (Owner + Teachers).
- A5: Recall window of ~2 hours post-class is reliable for Teachers at 2-hour session length.
- A6: One Guardian per kid is sufficient for v1 (second guardian deferred).

### Risks

- R1: Recall window miss → Teachers forget before capture → data gap. → Mitigation: roster pending counter visible on dashboard, end-of-session WhatsApp nudge to Owner.
- R2: AI narrative warmth/quality in Bahasa. → Mitigation: editable narrative layer, ReportTemplates stored in DB (iterate without dev), Owner reviews every report before send.
- R3: Teacher adoption resistance. → Mitigation: tap-only UX, no typing, ~1 min/kid, free-capture-any-kid coordination (no formal assignment).
- R4: Offline sync conflicts on reconnect. → Mitigation: optimistic locking + two-layer conflict UI (refresh single-value fields only; notes append-only, always persist).
- R5: July 13 timeline slip. → Mitigation: documented v1 cuts (~5–6 days saved), vertical-slice specs enable incremental ship.

### Open Questions (must answer before writing spec)

| Question                                                                     | Owner   | Deadline             |
| ---------------------------------------------------------------------------- | ------- | -------------------- |
| Q1: Exact DeepSeek model string on OpenRouter at wiring time (V3.x vs newer) | Dev     | Implementation start |
| Q2: Outing permission-slip tracking depth (flag-only vs digital consent)     | Product | v2 scoping           |

---

## 10. Acceptance Criteria (Product-Level)

These are NOT unit tests — they're "a human agrees it works."

- AC1: Owner can generate Daily Parent Reports for all kids in ≤30 min total (was 6 hours).
- AC2: Observations persist per kid per session; Monthly Report generates without manual WhatsApp reconstruction.
- AC3: Two-session day operable — Teachers capture independently across sessions, Owner reviews combined.
- AC4: Quarterly PDF generates with changes/improvements/recommendations sections, Owner-editable, using previous-term snapshot for delta.
- AC5: Reports sent proactively (not halted unless asked); WhatsApp reminders fire on schedule (capture pending, schedule entry Thursday).
- AC6: Offline capture survives network drop; data syncs on reconnect within the recall window without silent loss.
- AC7: Teacher captures one kid in ≤2 min; no typing required (catalog tap + emoji + enum).
- AC8: Edit conflict between two Teachers surfaces two-layer prompt; notes never lost; only conflicted single-value fields refresh.
- AC9: Owner adds a same-day unscheduled activity (e.g., teeth-care visit) → Teacher sees it on today's dashboard block without re-login → Daily Class Report captures it with deviation tracking → per-kid participation logged → report includes it.
