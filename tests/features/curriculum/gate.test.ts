import {
  EMPTY_GATE,
  buildGateState,
  findCoveringTerm,
} from '@/features/curriculum/gate';
import { buildPlanView } from '@/features/curriculum/plan-view';
import type { Curriculum } from '@/features/curriculum/types';
import { describe, expect, it } from 'vitest';

// 2026-08-03 is Monday; 2026-08-07 Friday; no holidays in fixtures.
const T1 = {
  id: 't1',
  name: 'Term 1',
  startDate: '2026-08-03',
  endDate: '2026-08-07',
  isActive: true,
};
const T2 = {
  id: 't2',
  name: 'Term 2',
  startDate: '2026-08-10',
  endDate: '2026-08-14',
  isActive: false,
};
const T3 = {
  id: 't3',
  name: 'Term 3',
  startDate: '2026-08-17',
  endDate: '2026-08-21',
  isActive: false,
};

const ITEM = (sortOrder: number): Curriculum => ({
  id: `c${sortOrder}`,
  termId: 't1',
  sortOrder,
  subThemeId: 'st1',
  name: `Aktivitas ${sortOrder}`,
  objective: null,
  indoor: false,
  itemsToBring: null,
  createdAt: new Date('2026-08-01'),
  updatedAt: new Date('2026-08-01'),
  subTheme: { id: 'st1', name: 'Binatang', theme: { name: 'Alam' } },
});

// t1 workdays: Mon03 Tue04 Wed05 Thu06 Fri07 (positions 1-5).
const VIEW = (curriculumByTerm: Record<string, Curriculum[]>) =>
  buildPlanView({
    terms: [T1, T2, T3],
    holidays: [],
    hasActiveSessionType: true,
    curriculumByTerm,
  });

describe('buildGateState', () => {
  it('blocks future terms while the current term has empty workdays', () => {
    // t1 has 2 of 5 workdays filled → 3 empty.
    const view = VIEW({ t1: [ITEM(0), ITEM(1)] });
    const gate = buildGateState(view, '2026-08-04'); // today inside t1

    expect(gate.currentTermId).toBe('t1');
    expect(gate.currentEmptyCount).toBe(3);
    expect(gate.currentFirstEmptyDate).toBe('2026-08-05'); // 3rd workday
    expect(gate.statusByTerm).toEqual({
      t1: 'editable',
      t2: 'blocked',
      t3: 'blocked',
    });
    expect(gate.createNextTermNeeded).toBe(false);
  });

  it('unlocks the next term when the current term is full (recurses)', () => {
    const full = [0, 1, 2, 3, 4].map(ITEM); // t1 full
    const gate = buildGateState(VIEW({ t1: full }), '2026-08-04');

    expect(gate.currentEmptyCount).toBe(0);
    // t2 unlocked (t1 full); t3 still blocked because t2 is empty.
    expect(gate.statusByTerm).toEqual({
      t1: 'editable',
      t2: 'editable',
      t3: 'blocked',
    });

    // Fill t2 → t3 unlocks too (same check recurses).
    const gate2 = buildGateState(
      VIEW({ t1: full, t2: [0, 1, 2, 3, 4].map(ITEM) }),
      '2026-08-04'
    );
    expect(gate2.statusByTerm.t3).toBe('editable');
  });

  it('sets createNextTermNeeded when the current term is full and no later term exists', () => {
    const view = buildPlanView({
      terms: [T1],
      holidays: [],
      hasActiveSessionType: true,
      curriculumByTerm: { t1: [0, 1, 2, 3, 4].map(ITEM) },
    });
    const gate = buildGateState(view, '2026-08-04');

    expect(gate.currentEmptyCount).toBe(0);
    expect(gate.currentFirstEmptyDate).toBeNull();
    expect(gate.createNextTermNeeded).toBe(true);
    expect(gate.statusByTerm).toEqual({ t1: 'editable' });
  });

  it('does not gate future terms on a past term with empties', () => {
    // Past term A (July) is empty; today is inside B (August).
    const view = buildPlanView({
      terms: [
        {
          id: 'ta',
          name: 'Past',
          startDate: '2026-07-06',
          endDate: '2026-07-10',
          isActive: false,
        },
        {
          id: 'tb',
          name: 'Current',
          startDate: '2026-08-03',
          endDate: '2026-08-07',
          isActive: true,
        },
      ],
      holidays: [],
      hasActiveSessionType: true,
      curriculumByTerm: {}, // both empty
    });
    const gate = buildGateState(view, '2026-08-04');

    expect(gate.currentTermId).toBe('tb');
    expect(gate.statusByTerm).toEqual({ ta: 'editable', tb: 'editable' });
  });

  it('falls back to the active term when today is in a gap', () => {
    const view = buildPlanView({
      terms: [
        { ...T1, isActive: false }, // ends 08-07
        { ...T2, isActive: true }, // starts 08-10
      ],
      holidays: [],
      hasActiveSessionType: true,
      curriculumByTerm: {},
    });
    // 08-08 is in the gap between T1 (ends 08-07) and T2 (starts 08-10).
    const gate = buildGateState(view, '2026-08-08');
    expect(gate.currentTermId).toBe('t2'); // active fallback
  });

  it('returns EMPTY_GATE for a null planView or when no workdays exist', () => {
    expect(buildGateState(null, '2026-08-04')).toBe(EMPTY_GATE);
    // No active session type → zero workdays → no gate.
    const emptyView = buildPlanView({
      terms: [T1],
      holidays: [],
      hasActiveSessionType: false,
      curriculumByTerm: {},
    });
    expect(buildGateState(emptyView, '2026-08-04')).toBe(EMPTY_GATE);
  });
});

describe('findCoveringTerm', () => {
  it('returns the term whose date range covers the iso', () => {
    expect(findCoveringTerm([T1, T2], '2026-08-04')?.id).toBe('t1');
    expect(findCoveringTerm([T1, T2], '2026-08-11')?.id).toBe('t2');
    expect(findCoveringTerm([T1, T2], '2026-08-08')).toBeNull(); // gap
  });
});
