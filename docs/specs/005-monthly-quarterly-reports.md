# Spec: Monthly & Quarterly Reports

## Problem
Monthly reports are reconstructed from WhatsApp chat history because daily data is never stored. Quarterly reports don't exist at all. No term-over-term growth tracking.

## Scope
**IN:** Monthly Report generation (on-demand per kid, stats aggregation + AI narrative in Bahasa Indonesia from daily report narratives), observation locking on generation, Owner review/edit, Quarterly Report PDF generation via react-pdf (three sections: what changed / what improved / recommendations), AI-drafted from daily narratives + previous-term snapshot delta, previous-term snapshot storage for future delta, Owner override → stale → re-gen flow.

**OUT:** Activity category aggregation in Monthly Reports (v2 — ship activity-name counts only), auto-send, parent self-serve.

## Happy Path
1. Owner selects kid + month → triggers "Generate Monthly Report".
2. System aggregates stats from daily report snapshots (attendance %, mood distribution, appetite distribution, activity participation counts) + calls AI to draft narrative from daily report narratives.
3. Monthly report drafted → Owner reviews → observations locked for that month. Report snapshot saved.
4. Owner selects kid + term → triggers "Generate Quarterly Report".
5. System aggregates term stats, calls AI with: current-term daily narratives + previous-term quarterly snapshot delta + instruction to produce three sections (changes/improvements/recommendations) in Bahasa Indonesia → generates PDF via react-pdf.
6. Owner reviews PDF, edits sections if needed, saves final. Snapshot stored for next term's delta.
7. If Owner unlocks observations (override) for a month with an existing report, that report's status → stale, prompts re-generation.

## Data Model
```sql
monthly_report_snapshots: id, kid_id (FK kids), term_id (FK terms), month (date — first day of month), stats_json (JSONB: attendance_pct, mood_distribution, appetite_distribution, activity_counts), narrative_ai_draft, narrative_final, locked_observation_ids (JSONB array), status (enum: draft|final|stale), generated_at, created_at, updated_at

quarterly_report_snapshots: id, kid_id (FK kids), term_id (FK terms), stats_json (JSONB), sections_json (JSONB: {changes, improvements, recommendations}), narrative_ai_draft, narrative_final, pdf_url, previous_snapshot_id (FK self, nullable), status (enum: draft|final|stale), generated_at, created_at, updated_at

report_templates: id, key (unique), template_text, updated_at  -- shared with 004-daily-parent-report
```

`locked_observation_ids` — IDs of observations locked when monthly report is generated. Used to detect stale: if any observation changes after lock, report becomes stale.

## Edge Cases
- No daily reports exist for the month → can't generate monthly report → show empty state with message.
- AI service down → structured-only fallback (stats without narrative).
- Locked observations changed by Owner override → monthly report status → stale, re-gen prompt shown.
- First term (no previous quarterly snapshot) → AI skips delta comparison, generates based on this term's data only.
- Quarterly report PDF generation exceeds timeout (10s) → async with progress indicator, notification on completion.
- Empty "recommendations" section → AI still generates generic recommendation from stats; Owner can edit/remove.
- Concurrent generation for same kid + month → second trigger blocked with "Report generation in progress."
- Kid graduated mid-term (status → alumni) → quarterly report still generatable for completed months only.
- react-pdf render fails → fallback to plain HTML view (no PDF download until fix).

## Acceptance Criteria
- [ ] Owner can generate Monthly Report for a kid — stats + AI narrative.
- [ ] Monthly report generation locks underlying observations.
- [ ] Unlocking observations marks monthly report as stale.
- [ ] Owner can generate Quarterly Report as PDF with three sections.
- [ ] Quarterly PDF uses previous-term snapshot for delta comparison.
- [ ] First-term quarterly report generates without delta (no previous snapshot).
- [ ] AI failure falls back to structured-only (stats without narrative).
- [ ] Report snapshots stored for future delta on every generation.
- [ ] Teacher cannot access report generation.
- [ ] No console errors.
- [ ] Deployed to staging, working end-to-end.

## Technical Notes
Depends on: 001-scaffold-auth, 002-master-data, 003-capture-flow, 004-daily-parent-report.

Reuses OpenRouter client from 004. Monthly stats computed in SQL (aggregations on observations + daily_report_snapshots). Quarterly PDF via `@react-pdf/renderer`. `report_templates` table shared with 004 — AI prompt templates stored here so Owner can adjust wording without code deploys. PDF stored in Neon (base64 or BYTEA) for v1; move to object storage later if needed.
