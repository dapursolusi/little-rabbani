import type { Curriculum } from '@/features/curriculum/types';
import { listTermWorkdays } from '@/features/term/workdays';

export type CurriculumPlanView = {
  terms: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>;
  positions: Record<string, number>;
  items: Record<string, Curriculum>;
};

export function buildPlanView(input: {
  terms: CurriculumPlanView['terms'];
  holidays: Array<{ startDate: string; endDate: string }>;
  hasActiveSessionType: boolean;
  curriculumByTerm: Record<string, Curriculum[]>;
}): CurriculumPlanView {
  const positions: Record<string, number> = {};
  const items: Record<string, Curriculum> = {};

  for (const term of input.terms) {
    const workdays = listTermWorkdays(
      term,
      input.holidays,
      input.hasActiveSessionType
    );
    const termItems = input.curriculumByTerm[term.id] ?? [];
    const bySortOrder = new Map(
      [...termItems]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => [item.sortOrder, item])
    );

    workdays.forEach((date, idx) => {
      positions[date] = idx + 1;
      const item = bySortOrder.get(idx);
      if (item) items[date] = item;
    });
  }

  return { terms: input.terms, positions, items };
}
