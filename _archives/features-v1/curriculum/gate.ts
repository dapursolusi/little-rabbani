import type { CurriculumPlanView } from '@/features/curriculum/plan-view';

export type TermStatus = 'editable' | 'blocked';

export type GateState = {
  currentTermId: string | null;
  /** Earliest term from the current term onward with unfilled workdays — the
   *  term the owner must complete before later terms unlock. Null when the
   *  current term and everything after it are full. */
  blockingTermId: string | null;
  /** Empty workday count of the blocking term (the X in the gate message). */
  blockingEmptyCount: number;
  /** First unfilled workday in the blocking term (the jump-back target). */
  blockingFirstEmptyDate: string | null;
  statusByTerm: Record<string, TermStatus>;
  createNextTermNeeded: boolean;
};

export const EMPTY_GATE: GateState = {
  currentTermId: null,
  blockingTermId: null,
  blockingEmptyCount: 0,
  blockingFirstEmptyDate: null,
  statusByTerm: {},
  createNextTermNeeded: false,
};

/** Earliest sorted term whose [startDate, endDate] covers iso; null if none. */
export function findCoveringTerm(
  terms: Array<{ id: string; startDate: string; endDate: string }>,
  iso: string
): { id: string } | null {
  const sorted = [...terms].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );
  return sorted.find((t) => t.startDate <= iso && iso <= t.endDate) ?? null;
}

function termCovers(
  term: { startDate: string; endDate: string },
  iso: string
): boolean {
  return term.startDate <= iso && iso <= term.endDate;
}

export function buildGateState(
  planView: CurriculumPlanView | null,
  todayIso: string
): GateState {
  if (!planView || Object.keys(planView.positions).length === 0) {
    return EMPTY_GATE;
  }

  const terms = [...planView.terms].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );

  // Group workday dates per term — positions already encode the #64 workday map.
  const workdaysByTerm: Record<string, string[]> = {};
  for (const iso of Object.keys(planView.positions)) {
    const term = terms.find((t) => termCovers(t, iso));
    if (term) {
      (workdaysByTerm[term.id] ??= []).push(iso);
    }
  }

  const emptyByTerm: Record<string, number> = {};
  for (const t of terms) {
    const workdays = (workdaysByTerm[t.id] ?? []).sort((a, b) =>
      a.localeCompare(b)
    );
    const filled = workdays.filter((iso) => planView.items[iso]).length;
    emptyByTerm[t.id] = Math.max(0, workdays.length - filled);
  }

  // Resolve current term: covering today → active → earliest → none.
  const covering = findCoveringTerm(terms, todayIso);
  const active = terms.find((t) => t.isActive);
  const currentTermId =
    covering?.id ?? active?.id ?? (terms[0] ? terms[0].id : null);

  if (!currentTermId) return EMPTY_GATE;

  const currentIndex = terms.findIndex((t) => t.id === currentTermId);

  const statusByTerm: Record<string, TermStatus> = {};
  for (let i = 0; i < terms.length; i++) {
    if (i <= currentIndex) {
      statusByTerm[terms[i].id] = 'editable';
      continue;
    }
    // Future term is editable iff every term from current up to its
    // predecessor is full (the issue's "same check recurses").
    let allFull = true;
    for (let j = currentIndex; j < i; j++) {
      if (emptyByTerm[terms[j].id] > 0) {
        allFull = false;
        break;
      }
    }
    statusByTerm[terms[i].id] = allFull ? 'editable' : 'blocked';
  }

  const currentEmpty = emptyByTerm[currentTermId] ?? 0;

  // Blocking term = first term at/after the current term with empty workdays.
  // In the normal flow this is the current term; when the current term is
  // full, it's the next term that still gates the terms after it.
  const blockingIndex = terms.findIndex(
    (t, i) => i >= currentIndex && emptyByTerm[t.id] > 0
  );
  const blockingTermId = blockingIndex === -1 ? null : terms[blockingIndex].id;
  const blockingEmptyCount = blockingTermId
    ? (emptyByTerm[blockingTermId] ?? 0)
    : 0;
  const blockingFirstEmptyDate = blockingTermId
    ? ((workdaysByTerm[blockingTermId] ?? [])
        .sort((a, b) => a.localeCompare(b))
        .find((iso) => !planView.items[iso]) ?? null)
    : null;

  const isLastTerm = currentIndex === terms.length - 1;
  // Only when a term covers today or an active term exists — the
  // earliest-term fallback (no covering, no active: school year ended) must
  // not surface a "create next term" nudge against a term that ended months
  // ago.
  const createNextTermNeeded =
    Boolean(covering ?? active) && currentEmpty === 0 && isLastTerm;

  return {
    currentTermId,
    blockingTermId,
    blockingEmptyCount,
    blockingFirstEmptyDate,
    statusByTerm,
    createNextTermNeeded,
  };
}
