import type { CurriculumPlanView } from '@/features/curriculum/plan-view';

export type TermStatus = 'editable' | 'blocked';

export type GateState = {
  currentTermId: string | null;
  currentEmptyCount: number;
  currentFirstEmptyDate: string | null;
  statusByTerm: Record<string, TermStatus>;
  createNextTermNeeded: boolean;
};

export const EMPTY_GATE: GateState = {
  currentTermId: null,
  currentEmptyCount: 0,
  currentFirstEmptyDate: null,
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
  const currentFirstEmptyDate =
    (workdaysByTerm[currentTermId] ?? [])
      .sort((a, b) => a.localeCompare(b))
      .find((iso) => !planView.items[iso]) ?? null;

  const isLastTerm = currentIndex === terms.length - 1;
  const createNextTermNeeded = currentEmpty === 0 && isLastTerm;

  return {
    currentTermId,
    currentEmptyCount: currentEmpty,
    currentFirstEmptyDate,
    statusByTerm,
    createNextTermNeeded,
  };
}
