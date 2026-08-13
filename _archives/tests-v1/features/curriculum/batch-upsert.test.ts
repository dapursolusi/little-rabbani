import { batchUpsert } from '@/features/curriculum/actions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Collect column names referenced inside a drizzle SQL condition so tests can
// assert the update's where clause is scoped to the term (cross-term writes
// are impossible) without depending on drizzle internals' exact shape.
function sqlColumns(condition: unknown): Set<string> {
  const cols = new Set<string>();
  const walk = (o: unknown): void => {
    if (Array.isArray(o)) {
      o.forEach(walk);
      return;
    }
    if (!o || typeof o !== 'object') return;
    const obj = o as Record<string, unknown>;
    if (
      typeof obj.name === 'string' &&
      typeof obj.table === 'object' &&
      obj.table !== null
    ) {
      cols.add(obj.name);
    }
    if (typeof obj.value === 'object' && obj.value !== null) walk(obj.value);
    if (Array.isArray(obj.queryChunks)) walk(obj.queryChunks);
  };
  walk(condition);
  return cols;
}

const mocks = vi.hoisted(() => ({
  db: {
    query: {
      curriculum: {
        findMany: vi.fn(),
      },
    },
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/db', () => ({ db: mocks.db }));

const AUTH = { authorized: true as const };

vi.mock('@/lib/actions/utils', () => ({
  requireOwner: vi.fn(async () => AUTH),
}));

describe('batchUpsert', () => {
  const row = {
    sortOrder: 3,
    subThemeId: '11111111-1111-4111-8111-111111111111',
    name: 'Aktivitas 3',
    indoor: 'false',
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('inserts a row that has no existing item at its sortOrder', async () => {
    mocks.db.query.curriculum.findMany.mockResolvedValue([]);
    const insertValues = vi.fn().mockResolvedValue([{ id: 'new1' }]);
    mocks.db.insert.mockReturnValue({ values: insertValues });

    const result = await batchUpsert('t1', [row]);
    expect(result.success).toBe(true);
    expect(mocks.db.insert).toHaveBeenCalledTimes(1);
    expect(insertValues).toHaveBeenCalledWith([
      expect.objectContaining({
        termId: 't1',
        sortOrder: row.sortOrder,
        subThemeId: row.subThemeId,
        name: row.name,
        indoor: false,
      }),
    ]);
    expect(mocks.db.update).not.toHaveBeenCalled();
  });

  it('updates a row that has an existing item at its sortOrder', async () => {
    mocks.db.query.curriculum.findMany.mockResolvedValue([
      { id: 'c3', sortOrder: 3 },
    ]);
    const updateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ id: 'c3' }]),
    });
    mocks.db.update.mockReturnValue({ set: updateSet });

    const result = await batchUpsert('t1', [row]);
    expect(result.success).toBe(true);
    expect(mocks.db.update).toHaveBeenCalledTimes(1);
    const where = updateSet.mock.results[0].value.where;
    const whereCondition = where.mock.calls[0][0];
    expect(sqlColumns(whereCondition)).toContain('term_id');
    expect(mocks.db.insert).not.toHaveBeenCalled();
  });
});
