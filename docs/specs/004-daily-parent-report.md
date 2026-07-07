# Spec: Daily Parent Report

## Problem

Owner spends 6 hours daily composing individual parent reports from memory. Reports are halted unless parents ask first. Daily data is never stored, so monthly aggregation is impossible.

## Scope

**IN:** OpenRouter AI client with DeepSeek V3.x primary + fallback chain (per ADR-0004), Daily Parent Report generation (two-layer: read-only structured data from observations + editable AI-drafted narrative in Bahasa Indonesia), Owner review/edit flow, copy-to-clipboard button, mark-sent status (draft / sent / stale), report snapshots saved to DB on every generation (regardless of sent status).

**OUT:** WhatsApp Business API auto-send (v2), Monthly/Quarterly reports, parent portal, AI narrative quality beyond Owner-editable drafts.

## Happy Path

1. Owner navigates to session → triggers "Generate Daily Reports".
2. System reads observations for each kid in the session, drafts reports in parallel: structured top section (mood, appetite, attendance, activities participated) + AI narrative bottom section (Bahasa Indonesia, 2-3 paragraphs describing the kid's day).
3. Owner sees report list with per-kid preview. Taps a kid → sees full report with structured data (read-only) and narrative (editable textarea).
4. Owner edits narrative, taps "Copy" → copies full report text to clipboard → pastes into WhatsApp → taps "Mark Sent".
5. Report snapshot saved to DB. If Owner re-edits after marking sent, status changes to "stale".
6. AI service unavailable → still generates structured-only report, Owner composes narrative manually.

## Data Model

```sql
daily_report_snapshots: id, kid_id (FK kids), session_id (FK sessions), structured_json (JSONB), narrative_ai_draft, narrative_final, status (enum: draft|sent|stale), edited_by (FK users), generated_at, created_at, updated_at
```

One snapshot per (kid, session). Re-generation upserts the existing row, increments version internally, transitions status to draft.

## Edge Cases

- AI service (OpenRouter/DeepSeek) down → generation fails gracefully, structured-only fallback, Owner fills narrative manually.
- Kid has no observations for the session → skip generation, show notice: "No observations recorded."
- Kid was absent → narrative reflects absence reason instead of activity narrative.
- Owner edits narrative after marking sent → status → stale, visual indicator in report list.
- Clipboard API blocked / unsupported → show raw text in modal for manual copy.
- Multiple kids → generation in parallel, per-kid progress indicator.
- AI returns non-Bahasa-Indonesia output → Owner edits before send (mitigation; prompt should enforce language).
- Zero activities captured for a kid (present but no participation recorded) → generation still proceeds with mood/appetite only.

## Acceptance Criteria

- [ ] Owner can trigger Daily Parent Report generation for a session.
- [ ] Generated reports show structured data (read-only) + editable AI narrative in Bahasa Indonesia.
- [ ] Owner can edit narrative, copy full report to clipboard, and mark as sent.
- [ ] Re-editing after marking sent changes status to stale.
- [ ] AI service failure falls back to structured-only report with manual-narrative option.
- [ ] Report snapshots saved to DB on every generation.
- [ ] Teacher cannot access report generation or view parent reports.
- [ ] No console errors.
- [ ] Deployed to staging, working end-to-end.

## Technical Notes

Depends on: 001-scaffold-auth, 002-master-data, 003-capture-flow.

OpenRouter client in `lib/ai.ts` — single function `generateNarrative(prompt, context)` with DeepSeek primary model (exact model string wired at implementation per Q1), fallback to secondary model on failure. ReportTemplate strings stored in DB table `report_templates` (key, template_text) so Owner can iterate wording without code deploys. AI prompt: include kid name, mood, appetite, activities participated, notes — compose warm 2-3 paragraph narrative in Bahasa Indonesia addressing the guardian directly.
