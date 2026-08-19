# Combined Kid + Guardian registration (phone as identity)

Registration of a kid requires a guardian, so the form is one unit: a guardian fieldset (name, phone, email, 2nd contact) and a kid fieldset. `phone` is the guardian's identity — its format is enforced (`^08\d{8,}$`, local Indonesian) at the input boundary, making sibling dedup and the `guardian` phone unique-constraint reliable. Editing a kid edits the guardian too; the record is shared by `guardianId`, so changes propagate to every linked sibling — that propagation is the point, not a bug. There is no dedicated guardian module: a guardian is created and corrected through the kid form, and orphaned guardian rows (no kids) are kept and reusable.

**Status:** accepted — **implemented** in `src/features/kids/` (`KidGuardianFormSchema`, `createKid`/`updateKid` transactional inserts).
**Considered options:** split guardian-first workflow (v1, forced a pre-step dead-end); explicit existing-guardian picker only (revives the two-step flow); read-only guardian on kid edit (denied sibling-correction). Rejected.
**Consequences:** a phone typo that collides with another guardian errors on the unique constraint; changing a phone fires a confirm warning since it changes identity.

> **Update (2026-08):** the v2 plan's "use existing guardian" search-picker toggle and the sibling-count badge are **not implemented** — the shipped form is the plain combined form with new-guardian entry only. `searchGuardians` exists in `actions.ts` but is not yet wired to any UI. The `guardian_relationship` enum shipped as `older_sibling` (not v1's `brother_sister`).
