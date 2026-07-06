# Spec: WhatsApp Reminders

## Problem
Owner forgets capture deadlines and schedule entry. No proactive nudging exists — everything relies on Owner's memory. Reports being halted means there's no reminder infrastructure at all.

## Scope
**IN:** Browser push notifications (Service Worker + Web Push API) to Owner: capture-pending reminder 15 min after session end, schedule-entry reminder Thursday morning. In-app Teacher dashboard banner showing pending capture count ("X kids need captures"), tappable — routes to pending capture screen. Owner toggles reminders on/off in settings.

**OUT:** WhatsApp Business API integration (v2 — this spec uses browser notifications, not WhatsApp), report-gen-ready reminders (v2), monthly reminders (v2), send reminders (v2), SMS fallback, email reminders, push notifications on Android/iOS native (v1 is web-only).

## Happy Path
1. Owner navigates to Settings → toggles reminders on (capture-pending and schedule-entry).
2. Session ends at 11:00 → system schedules capture-pending notification for 11:15.
3. 11:15 → Owner receives browser notification: "Capture tertunda: Sesi Pagi — 8 anak perlu dicapture." Owner taps notification → routed to session capture overview.
4. Thursday at 08:00 → Owner receives browser notification: "Jadwal minggu depan belum diisi. Masukkan sekarang." Owner taps → routed to schedule entry.
5. Teacher opens dashboard → sees banner: "5 capture tertunda" → taps banner → routed to pending capture list.
6. Teacher completes last pending capture → banner disappears.

## Data Model
```sql
reminder_config: id, user_id (FK users, unique), capture_reminder_enabled boolean DEFAULT true, schedule_reminder_enabled boolean DEFAULT true, created_at, updated_at

reminder_log: id, user_id (FK users), type (enum: capture_pending|schedule_entry), session_id (FK sessions, nullable — null for schedule reminders), scheduled_at, sent_at, acknowledged_at, created_at
```

## Edge Cases
- Browser notification permission denied → reminder_config still saved, reminder fires silently → in-app badge as fallback (Owner dashboard shows pending count).
- Session has no enrolled kids → skip capture-pending reminder for that session.
- Multiple sessions end same day → aggregate into single reminder ("2 sesi perlu capture").
- Teacher dashboard open when reminder fires → banner appears in real-time (polling / real-time channel).
- Owner offline at reminder time → notification queued by browser, delivered on next visit.
- Thursday is a holiday → suppress schedule-entry reminder for that day.
- Reminder log grows unbounded → periodic cleanup (delete logs > 30 days old).
- Service Worker not supported (old browser) → reminder feature silently disabled, in-app fallback only.

## Acceptance Criteria
- [ ] Owner receives browser notification 15 min after session ends if captures are pending.
- [ ] Owner receives browser notification Thursday morning if next week's schedule is empty.
- [ ] Owner can toggle capture-pending and schedule-entry reminders on/off.
- [ ] Teacher sees in-app banner with pending capture count on dashboard open.
- [ ] Teacher tapping banner routes to pending capture screen.
- [ ] Reminders fire only when relevant (kids enrolled, schedule empty, not holiday).
- [ ] Notification permission denied → in-app fallback badge on Owner dashboard.
- [ ] No console errors.
- [ ] Deployed to staging, working end-to-end.

## Technical Notes
Depends on: 001-scaffold-auth, 002-master-data, 003-capture-flow.

Reminders triggered by cron endpoint (Vercel Cron Jobs hitting `/api/cron/reminders` every 5 min). Checks: session end time + 15 min, pending observations for that session → if yes, schedule notification. Thursday check: any session in next 7 days without schedule items → if yes, schedule notification. Browser push via `web-push` npm package with VAPID keys. Service Worker registered at `/sw.js`. Banner uses polling (5s interval) or Supabase Realtime channel for instant update.
