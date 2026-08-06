import { batchUpsert } from '@/features/curriculum/actions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    mocks.db.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue([{ id: 'new1' }]),
    });

    const result = await batchUpsert('t1', [row]);
    expect(result.success).toBe(true);
    expect(mocks.db.insert).toHaveBeenCalledTimes(1);
    expect(mocks.db.update).not.toHaveBeenCalled();
  });

  it('updates a row that has an existing item at its sortOrder', async () => {
    mocks.db.query.curriculum.findMany.mockResolvedValue([
      { id: 'c3', sortOrder: 3 },
    ]);
    mocks.db.update.mockReturnValue({
      set: vi
        .fn()
        .mockReturnValue({ where: vi.fn().mockResolvedValue([{ id: 'c3' }]) }),
    });

    const result = await batchUpsert('t1', [row]);
    expect(result.success).toBe(true);
    expect(mocks.db.update).toHaveBeenCalledTimes(1);
    expect(mocks.db.insert).not.toHaveBeenCalled();
  });
});
