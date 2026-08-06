import { createCurriculumItems } from '@/features/curriculum/actions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  db: {
    query: {
      term: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('@/db', () => ({ db: mocks.db }));

const AUTH = { authorized: true as const };

vi.mock('@/lib/actions/utils', () => ({
  requireOwner: vi.fn(async () => AUTH),
}));

vi.mock('@/features/holiday/actions', () => ({
  getHolidays: vi.fn(async () => ({ success: true as const, data: [] })),
}));

vi.mock('@/features/sessionType/actions', () => ({
  getSessionTypes: vi.fn(async () => ({
    success: true as const,
    data: [{ id: 'st1' }],
  })),
}));

// Term: Mon 03 → Fri 07 Aug 2026, no holidays → 5 workdays (idx 0..4).
const TERM = {
  id: 't1',
  name: 'Term 1',
  startDate: '2026-08-03',
  endDate: '2026-08-07',
  isActive: true,
};

const INPUT = {
  termId: 't1',
  subThemeId: '11111111-1111-4111-8111-111111111111',
  name: 'Aktivitas',
  indoor: false,
};

function mockSelectMax(maxSort: number | null) {
  const where = vi.fn().mockResolvedValue([{ maxSort }]);
  const from = vi.fn().mockReturnValue({ where });
  mocks.db.select.mockReturnValue({ from });
  return { from, where };
}

function mockInsertReturning(rows: unknown[]) {
  const returning = vi.fn().mockResolvedValue(rows);
  const values = vi.fn().mockReturnValue({ returning });
  mocks.db.insert.mockReturnValue({ values });
  return { values, returning };
}

describe('createCurriculumItems date resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.db.query.term.findFirst.mockResolvedValue(TERM);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves a workday date to its sortOrder index (0-based position)', async () => {
    const { values } = mockInsertReturning([{ id: 'c1' }]);

    const result = await createCurriculumItems([
      { ...INPUT, date: '2026-08-07' }, // 5th workday → sortOrder 4
    ]);

    expect(result.success).toBe(true);
    expect(values).toHaveBeenCalledWith([
      expect.objectContaining({ termId: 't1', sortOrder: 4 }),
    ]);
    // No MAX+1 query needed when every input carries a date.
    expect(mocks.db.select).not.toHaveBeenCalled();
  });

  it('rejects a date that is not a workday of the term', async () => {
    const result = await createCurriculumItems([
      { ...INPUT, date: '2026-08-08' }, // Saturday
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('hari aktif term');
    }
    expect(mocks.db.insert).not.toHaveBeenCalled();
  });

  it('rejects two inputs targeting the same workday', async () => {
    const result = await createCurriculumItems([
      { ...INPUT, date: '2026-08-04', name: 'A' },
      { ...INPUT, date: '2026-08-04', name: 'B' },
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('satu aktivitas');
    }
    expect(mocks.db.insert).not.toHaveBeenCalled();
  });

  it('appends after MAX+1 when a date-less input is provided (legacy behavior)', async () => {
    mockSelectMax(23);
    const { values } = mockInsertReturning([{ id: 'c1' }]);

    const result = await createCurriculumItems([
      { ...INPUT, date: '2026-08-06', name: 'ByDate' }, // 4th workday → 3
      { ...INPUT, name: 'ByAppend' }, // date-less → MAX+1 = 24
    ]);

    expect(result.success).toBe(true);
    expect(values).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'ByDate', sortOrder: 3 }),
      expect.objectContaining({ name: 'ByAppend', sortOrder: 24 }),
    ]);
  });
});
