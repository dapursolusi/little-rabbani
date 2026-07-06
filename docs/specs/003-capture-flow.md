# Spec: Capture Flow

## Problem
No way to plan a teaching week, capture what happened in class, or record per-kid observations. The core loop — plan → run → capture — is missing.

## Scope
**IN:** Weekly Schedule (Owner assigns catalog activities + outings to sessions, with location / bring-items / permission flag, editable until session start, holiday warnings, real-time Teacher dashboard propagation), Daily Class Report (Owner captures class activities prefilled from schedule, deviation tracking: done / skipped / modified, add unplanned activities mid-capture with prompt-to-add-to-catalog), Teacher Observation Capture — two passes (Pass 1: mood 5-level, appetite 3-level, presence: present_full / late / early_pickup / absent, absence_reason: sick / family / permission / other, free-text notes; Pass 2: yes/no activity participation per class-level activity), roster view with per-kid capture state (✓/✗), optimistic locking (version field) with two-layer conflict UI (single-value refresh; notes append-only, always persist), offline capture queue (IndexedDB, sync on reconnect, conflict surfacing on flush).

**OUT:** AI narrative, report generation, WhatsApp reminders, schedule deviation reason free-text (v2), any PDF, parent portal.

## Happy Path
1. Owner enters weekly schedule: picks session slots, adds catalog activities + outings (location, bring-items, permission flag). Holiday dates show warnings.
2. Teacher opens dashboard → sees today's session schedule, activities listed (no re-login).
3. Owner edits schedule (add activity, swap session) → Teacher dashboard updates in real-time without re-login.
4. Class runs. Post-class, Owner captures Daily Class Report: activities prefilled from schedule, marks each as done / skipped / modified, adds any unplanned activities ("teeth-care visit").
5. Teacher opens app → picks today's session → sees kid roster with ✓/✗ capture state.
6. Teacher taps a kid → Pass 1: selects mood (5 emoji levels), appetite (3 levels), presence status, absence reason if absent, types notes → saves.
7. Teacher taps "Activities" for same kid → Pass 2 (unlocked after DCR is captured): taps yes/no per activity.
8. Network drops during capture → taps queue to IndexedDB → reconnects → syncs, surfaces any version conflicts.

## Data Model
```sql
schedule_items: id, session_id (FK sessions), activity_id (FK activities, nullable — null = outing), type (enum: activity|outing), outing_location, outing_bring_items, outing_permission_required, sort_order, created_at, updated_at

daily_class_reports: id, session_id (FK sessions, unique), learning_notes, captured_by (FK users), captured_at, created_at

dcr_activities: id, dcr_id (FK daily_class_reports), activity_id (FK activities, nullable — null = unplanned "other"), activity_name_other, deviation (enum: done|skipped|modified), was_planned (boolean), created_at

observations: id, kid_id (FK kids), session_id (FK sessions), teacher_id (FK users), mood (enum 1-5), appetite (enum: good|moderate|poor), presence (enum: present_full|late|early_pickup|absent), absence_reason (enum: sick|family|permission|other, nullable), version int DEFAULT 0, captured_at, created_at, updated_at

observation_notes: id, observation_id (FK observations), text, created_at

observation_activities: id, observation_id (FK observations), dcr_activity_id (FK dcr_activities), participated boolean, created_at
```

Unique constraint: (kid_id, session_id) on observations — one observation row per kid per session.
Unique constraint: (session_id) on daily_class_reports — one DCR per session.
Unique constraint: (observation_id, dcr_activity_id) on observation_activities.

## Edge Cases
- Teacher opens capture before DCR is done → Pass 2 locked, banner: "Waiting for class report."
- Two teachers capture same kid simultaneously → second save hits version mismatch → conflict UI: refresh single-value fields (mood, appetite, presence), notes always appended (never overwritten).
- Kid absence → skip activity participation (Pass 2), show absence reason in roster.
- Offline queue full → surface warning in capture UI (IndexedDB quota).
- Sync after offline → conflict on flush → conflict UI surfaces same as online conflict.
- Unplanned activity added mid-capture → appears immediately in Pass 2 for all kids.
- Edit schedule after Teacher has dashboard open → real-time update via polling/pusher, no re-login.
- Session with zero enrolled kids → empty roster, "No kids in this session" state.
- Capture on holiday session → blocked, session marked as non-capturable.

## Acceptance Criteria
- [ ] Owner can enter weekly schedule with catalog activities and outings.
- [ ] Schedule edits propagate to Teacher dashboard in real-time without re-login.
- [ ] Holiday dates show warnings when scheduling.
- [ ] Owner can capture Daily Class Report with prefilled activities, mark deviations, add unplanned activities.
- [ ] Teacher can capture Pass 1 observations (mood, appetite, presence, notes) by tapping.
- [ ] Teacher can capture Pass 2 activity participation (yes/no) after DCR is done.
- [ ] Roster view shows ✓/✗ capture state per kid per session.
- [ ] Two-teacher conflict triggers two-layer UI: refresh single fields, notes always persist.
- [ ] Captures queue offline in IndexedDB and sync on reconnect.
- [ ] Teacher cannot access schedule editing or DCR capture (Owner-only).
- [ ] No console errors.
- [ ] Deployed to staging, working end-to-end.

## Technical Notes
Depends on: 001-scaffold-auth, 002-master-data.

Real-time propagation via Supabase Realtime (broadcast channel) or simple polling — decision at implementation time. Offline queue via Dexie.js (IndexedDB wrapper). Optimistic version check on observation upsert: WHERE version = oldVersion, SET version = oldVersion + 1. All mutations except observation capture are Owner-only.
