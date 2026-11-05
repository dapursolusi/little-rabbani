# Kid module is identity-only; enrollment is a separate history

A Kid row records only identity and guardianship — name, nickname, gender, dob, `guardianId`, `relationship`. The v1 `status` (waiting/enrolled/alumni) and `enrolledTermId` columns are dropped from Kid. Enrollment state lives in a separate feature modeled as one row per enrollment event (term, status-at-that-time, date) — a many-to-many join whose rows are the history — because overwriting `enrolledTermId` when a kid re-enrolls in a new term would lose the audit trail. Registrating a kid is "who this person is," not "where they attend"; the kid form has no status field.

**Status:** accepted — **implemented** in `src/db/schema/kids.ts` (kid row: name, nickName, gender, dob, guardianId, relationship — no enrolledTermId).

> **Update (2026-11):** the kid row gained `activeStatus` (`active_status` enum, default `ACTIVE` — Terdaftar/Aktif/Tidak Aktif, constants in `src/features/kid/constants.ts`). This is a liveness flag, not the v1 enrollment `status` — enrollment state still lives in the separate enrollment feature. The core decision (no `enrolledTermId`, enrollment as event rows) holds.
> **Considered options:** keep `status` + `enrolledTermId` on Kid (v1) — overwrites enrollment history and couples registration to scheduling. Rejected.
> **Consequences:** the kid list shows identity only (no status column yet); the enrollment feature owns status transitions and term history when it lands. See PRD FR2.
