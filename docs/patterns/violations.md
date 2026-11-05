# Violations — code that deviates from documented patterns

One file to clear as debt. Each item: location, deviation, canonical shape. Delete entries (or the whole file) as they're fixed. Extracted 2026-11-04 at commit `fe1a0de`.

## Metadata rule (AGENTS.md: every page exports metadata)

8 pages missing `metadata`:

- `src/app/page.tsx`
- `src/app/(auth)/dashboard/page.tsx` (stub page — also the only page not following the page composition shapes)
- `src/app/(auth)/dashboard/registration/page.tsx`
- `src/app/(auth)/dashboard/term/page.tsx`
- `src/app/(auth)/dashboard/daily/page.tsx`
- `src/app/(auth)/dashboard/class-session/page.tsx`
- `src/app/(auth)/dashboard/report/month/page.tsx`
- `src/app/(auth)/dashboard/report/kid/[id]/page.tsx`

Fix: add `export const metadata = { ...baseMetadata, title: '...' }`.

## Server actions

| Location                                                         | Deviation                                                                                                        | Canonical                                                |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `src/features/term/actions.ts:22-29`                             | `getTerms` queries `db.query.term` directly inside an actions file (actions→db layering violation)               | Actions are parse-only shells; reads go through services |
| `src/features/report/kid/actions.ts`                             | 0-byte empty file; only actions file without `'use server'`                                                      | Delete or implement                                      |
| `src/features/kid-enrollment/actions.ts:8-16`                    | `getKidsEnrollments`/`getAvailableKids` cast `input as { termId?: string }` instead of parsing                   | `parseInput()` at every trust boundary                   |
| `src/features/theme/actions.ts:56,68`                            | `input: Record<string, unknown>` instead of `input: unknown`                                                     | `unknown`                                                |
| `src/features/kid-enrollment/services.ts:73-93`                  | `getAvailableKids` returns `{ success, error: string }` — string `error`, not `message`                          | ActionResult contract: `message` is the failure string   |
| `src/features/class-session/services.ts:50,55`                   | success literals missing `as const` (same file has them at :78, :101)                                            | `as const` on every literal                              |
| `src/features/daily-class-report/services/dcr.ts:50-57`          | `saveDCR` reads `existingDCRResults.data?.id ?? ''` — empty-string id on sibling failure instead of early return | `if (!result.success) return …` early-return             |
| `src/features/daily-class-report/repositories/observation.ts:69` | commented-out code `// columns: dcrObservationColumnSelection,`                                                  | Remove                                                   |

## Auth gating — UNDECIDED (do not fix mechanically)

Placement is not settled (see [auth.md](auth.md)). Open questions, not violations:

- requireOwner lives in services (21 call sites) vs actions (`daily-class-report/actions/report-template.ts:20`, `term/actions.ts:22`)
- Owner-gating reads is inconsistent: `getTerms` gates, `getThemes`/`getDCRs`/`getKidsEnrollments` don't
- `src/features/daily-class-report/services/*.ts` contain zero gating (module-level gate may be intended)
- `NEXT_PUBLIC_DEMO_MODE` is consumed in `src/features/auth/demo-login.ts:23` but **not registered in `env.mjs`**
- `src/lib/pii.ts` has zero call sites — infrastructure only

## Logging

`console.error` in services of: `kid`, `theme`, `term`, `kid-enrollment`, `class-session`. Canonical: `logger` (`src/lib/logger.ts`, pino + redaction) — used by all `daily-class-report` services.

## Schema

| Location                                                           | Deviation                                                                                                                    | Canonical                                     |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `src/db/schema/enrollment.ts`                                      | array-style third arg `(table) => [check(...)]` — actually the NEW canonical; all other schema files use legacy object style | Array style; migrate others opportunistically |
| `src/db/schema/daily.ts`                                           | relations named `dcrRelationship`, `dailyKidReportRelationship`                                                              | `*Relations`                                  |
| `src/features/kid/repositories/kid.ts:101`, `dailyKidReport` repos | hard `db.delete()` on rows that have `deletedAt` (kid service even filters `isNull(deletedAt)`)                              | Soft delete for domain entities               |

## Naming

`DCR`/`Dcr` casing drifts across `daily-class-report`: `DCRObservationInput`, `dcrObservationSchema`, `getDCRs`, `getDcrsByMonth`. Canonical: acronyms are words (`Dcr`, `getDcrs`).

## UI / components

| Location                                                                                                     | Deviation                                                                                                                          | Canonical                             |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `src/features/theme/components/{client,form}.tsx`                                                            | named exports (multi-component file, no default)                                                                                   | Default export for feature components |
| `src/features/daily-class-report/components/form.tsx`                                                        | two named exports (`DailyClassReportForm`, `DCRObservationForm`), no default                                                       | Default export for feature components |
| `src/features/kid-enrollment/columns.tsx`                                                                    | exports non-column artifacts (`NewKidIdsContext`, `UpdateModeContext`, factories) alongside columns                                | `columns.tsx` exports only columns    |
| `src/app/(auth)/dashboard/kid/[id]/edit/page.tsx`                                                            | declares `interface EditKidPageProps` while all other pages inline props                                                           | Inline for trivial page props         |
| `src/app/(auth)/dashboard/report/month/page.tsx`                                                             | page title rendered as centered `<p>` — three header styles coexist (h1 block / centered p / none)                                 | Pick one header style                 |
| `src/app/(auth)/dashboard/report/kid/[id]/page.tsx:72`                                                       | `<TermSelector terms={[]}>` rendered with no data (WIP placeholder)                                                                | Selectors receive fetched data        |
| `src/features/report-template client` (`src/app/(auth)/dashboard/settings/report-template/client.tsx:23-31`) | hand-rolled mutation flow with inline toasts (legitimate — no schema — but only mutation off the engine path besides daily-report) | None (accepted exception)             |

## Open structural questions (ambiguous, no winner yet)

- Count query: `sql<number>`count(*)`` (kid) vs `drizzleCount()` (class-session) — database.md now says `drizzleCount()`
- Repo return contract: raw `.returning()` (dominant) vs strict `satisfies` + throw + refetch (`observation.ts`)
- Inline one-off column selections vs exported per-entity selections — inline allowed for one-off `with:` shapes
- Page header convention (see UI table above)
