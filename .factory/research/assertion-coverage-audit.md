# Assertion Coverage Audit

## Methodology

Extracted all assertion IDs (format `VAL-AREA-NNN`) from:

- **Source 1:** `validation-contract.md` — all assertions defined in the contract
- **Source 2:** `features.json` — all assertion IDs in `fulfills` arrays across 14 features

Compared each set to identify orphans (in contract but not in any fulfills) and duplicates (in multiple fulfills).

---

## 1. Total Assertions in Contract: 219

| Prefix        | Count   | Range   |
| ------------- | ------- | ------- |
| VAL-AUTH      | 14      | 001–014 |
| VAL-MASTER    | 65      | 001–065 |
| VAL-CAPTURE   | 54      | 001–054 |
| VAL-DAILY     | 17      | 001–017 |
| VAL-MONTHLY   | 13      | 001–013 |
| VAL-QUARTERLY | 13      | 001–013 |
| VAL-REMIN     | 18      | 001–018 |
| VAL-CROSS     | 25      | 001–025 |
| **Total**     | **219** |         |

## 2. Total Assertions Claimed by Features: 205

14 features declare fulfills. All claimed assertions appear exactly once (no duplicates). The remaining 14 assertions are orphans.

## 3. Orphaned Assertions: 14

These `VAL-CROSS-*` assertions exist in the contract but are NOT listed in any feature's `fulfills` array:

1.  VAL-CROSS-001 — Full daily flow (schedule → capture → daily reports)
2.  VAL-CROSS-002 — Observations persist → monthly report without WhatsApp
3.  VAL-CROSS-003 — Two-session day independent Teacher capture
4.  VAL-CROSS-004 — Quarterly PDF with delta-based narrative
5.  VAL-CROSS-005 — Proactive report sending + WhatsApp reminders
6.  VAL-CROSS-006 — Offline capture survives network drop
7.  VAL-CROSS-007 — One-handed tap-fast capture ≤2 min
8.  VAL-CROSS-008 — Two-layer conflict resolution for concurrent edits
9.  VAL-CROSS-009 — Same-day unscheduled activity end-to-end
10. VAL-CROSS-010 — First-visit flow (new unregistered user)
11. VAL-CROSS-011 — All features reachable via navigation
12. VAL-CROSS-012 — Auth guard on all /dashboard/* routes
13. VAL-CROSS-013 — Role-based access isolation
14. VAL-CROSS-014 — Bahasa Indonesia consistency

## 4. Duplicated Assertions: 0

No assertion ID appears in more than one feature's `fulfills` array. All claimed assertions are unique per feature.

## Summary

| Metric                             | Value           |
| ---------------------------------- | --------------- |
| Total assertions in contract       | 219             |
| Total claimed by features          | 205             |
| Orphaned (in contract, no feature) | 14              |
| Duplicated (in multiple features)  | 0               |
| Coverage rate                      | 93.6% (205/219) |

**Action required:** The 14 orphaned `VAL-CROSS-001` through `VAL-CROSS-014` assertions need to be assigned to one or more features in `features.json`. These are high-level end-to-end cross-cutting assertions that span auth, capture, master data, reports, and reminders — they may need a dedicated "cross-area" feature, or be distributed across existing features that cover the relevant flows.
