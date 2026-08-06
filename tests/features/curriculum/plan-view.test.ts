import { buildPlanView } from '@/features/curriculum/plan-view';
import { describe, expect, it } from 'vitest';

// 2026-08-03 is a Monday, 2026-08-07 is a Friday (no holidays in test fixtures).
const TERM = {
  id: 't1',
  name: 'Term 1',
  startDate: '2026-08-03',
  endDate: '2026-08-14',
  isActive: true,
};

const ITEM = (sortOrder: number) => ({
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

describe('buildPlanView', () => {
  it('projects workday #N to item at sortOrder N (absolute position)', () => {
    const view = buildPlanView({
      terms: [TERM],
      holidays: [],
      hasActiveSessionType: true,
      curriculumByTerm: { t1: [ITEM(0), ITEM(1)] },
    });

    // Workdays: Mon 03, Tue 04, Wed 05, Thu 06, Fri 07, Mon 10 ... Fri 14 (10 workdays)
    expect(view.positions['2026-08-03']).toBe(1);
    expect(view.items['2026-08-03'].name).toBe('Aktivitas 0');
    expect(view.positions['2026-08-04']).toBe(2);
    expect(view.items['2026-08-04'].name).toBe('Aktivitas 1');

    // Third workday has a position but no item → yellow "needs filling"
    expect(view.positions['2026-08-05']).toBe(3);
    expect(view.items['2026-08-05']).toBeUndefined();
  });

  it('skips holidays and weekends when assigning positions', () => {
    const view = buildPlanView({
      terms: [TERM],
      holidays: [{ startDate: '2026-08-05', endDate: '2026-08-05' }],
      hasActiveSessionType: true,
      curriculumByTerm: { t1: [ITEM(0)] },
    });

    // 05 is a holiday → not a workday; 06 is the 3rd workday
    expect(view.positions['2026-08-05']).toBeUndefined();
    expect(view.positions['2026-08-06']).toBe(3);
  });

  it('returns empty maps when no session type is active', () => {
    const view = buildPlanView({
      terms: [TERM],
      holidays: [],
      hasActiveSessionType: false,
      curriculumByTerm: { t1: [ITEM(0)] },
    });
    expect(Object.keys(view.positions)).toHaveLength(0);
    expect(Object.keys(view.items)).toHaveLength(0);
  });

  it('uses global holidays (term-scoped + national + custom)', () => {
    const view = buildPlanView({
      terms: [TERM],
      holidays: [{ startDate: '2026-08-10', endDate: '2026-08-11' }],
      hasActiveSessionType: true,
      curriculumByTerm: { t1: [ITEM(0)] },
    });
    // Mon 10 + Tue 11 are holidays → skipped
    expect(view.positions['2026-08-10']).toBeUndefined();
    expect(view.positions['2026-08-11']).toBeUndefined();
    expect(view.positions['2026-08-12']).toBe(6); // 3rd workday was 05
  });
});
