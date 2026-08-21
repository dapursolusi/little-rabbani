import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  checkCurrentTerm,
  checkNextTerm,
  createTerm,
  deleteTerm,
  updateTerm,
} from '@/features/term/actions';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: () => new Headers() }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock('@/db', () => ({
  db: {
    query: { term: { findFirst: mocks.findFirst, findMany: mocks.findMany } },
    insert: mocks.insert,
    update: mocks.update,
    delete: mocks.delete,
  },
}));

const NEW_TERM = {
  id: 'T1',
  name: 'Batch A',
  startDate: '2026-08-01',
  endDate: '2026-08-15',
};

function mockInsertResolves(row: unknown) {
  mocks.insert.mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([row]),
    }),
  });
}

function mockInsertRejects() {
  mocks.insert.mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockRejectedValue(new Error('db down')),
    }),
  });
}

function mockUpdateRejects() {
  mocks.update.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error('db down')),
    }),
  });
}

beforeEach(() => {
  mocks.getSession.mockResolvedValue({ user: { id: 'owner-1', role: 'owner' } });
  mocks.findFirst.mockResolvedValue(undefined);
  mocks.findMany.mockResolvedValue([]);
  mockInsertResolves(NEW_TERM);
  mocks.update.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });
});

afterEach(() => vi.clearAllMocks());

describe('createTerm', () => {
  const valid = { name: 'Batch A', startDate: '2026-08-01', endDate: '2026-08-15' };

  it('inserts a term with normalized dates when no conflict', async () => {
    const result = await createTerm(valid);

    expect(result).toEqual({ success: true, data: NEW_TERM });
    const valuesMock = mocks.insert.mock.results[0]!.value
      .values as ReturnType<typeof vi.fn>;
    expect(valuesMock).toHaveBeenCalledWith(valid);
  });

  it('rejects when the date range overlaps an existing term', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'OLD' });

    const result = await createTerm(valid);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain('bertabrakan');
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('returns a parse error for invalid input without touching the db', async () => {
    const result = await createTerm({ name: '', startDate: 'nope', endDate: '' });

    expect(result.success).toBe(false);
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('returns a generic error when the insert throws', async () => {
    mockInsertRejects();

    const result = await createTerm(valid);

    expect(result).toEqual({
      success: false,
      error: 'Gagal menambahkan batch baru',
    });
  });

  it('blocks a non-owner without querying', async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: 'teacher-1', role: 'teacher' },
    });

    const result = await createTerm(valid);

    expect(result.success).toBe(false);
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});

describe('checkCurrentTerm', () => {
  it('returns the active term when one exists', async () => {
    const active = { ...NEW_TERM, startDate: '2026-08-01', endDate: '2026-08-31' };
    mocks.findFirst.mockResolvedValue(active);

    const result = await checkCurrentTerm();

    expect(result).toEqual({ success: true, data: active });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('returns the latest term when it has not ended (lenient — no auto-create on top of a queued next term)', async () => {
    const latest = { ...NEW_TERM, startDate: '2026-08-01', endDate: '2026-12-31' };
    mocks.findFirst
      .mockResolvedValueOnce(undefined) // no active term
      .mockResolvedValueOnce(latest); // latest fallback
    mocks.findMany.mockResolvedValue([latest]);

    const result = await checkCurrentTerm();

    expect(result).toEqual({ success: true, data: latest });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('auto-creates a new term when the latest has ended (app untouched for months)', async () => {
    const ended = {
      ...NEW_TERM,
      id: 'OLD',
      startDate: '2026-01-01',
      endDate: '2026-06-30',
    };
    mocks.findFirst
      .mockResolvedValueOnce(undefined) // no active term
      .mockResolvedValueOnce(ended); // latest fallback = ended
    mocks.findMany.mockResolvedValue([ended]);

    const result = await checkCurrentTerm();

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(mocks.insert).toHaveBeenCalled();
    const values = mocks.insert.mock.results[0]!.value
      .values as ReturnType<typeof vi.fn>;
    const { startDate, endDate, isAutoCreated } = values.mock.calls[0][0];
    expect(startDate).toBe('2026-08-21'); // today (real clock)
    expect(new Date(endDate) > new Date(startDate)).toBe(true);
    expect(isAutoCreated).toBe(true);
  });
});

describe('checkNextTerm', () => {
  it('returns the queued next term when one already exists (no insert)', async () => {
    const next = { ...NEW_TERM, id: 'NEXT', startDate: '2026-09-01' };
    // Distinguish the two findFirst calls by where-clause param count:
    // active query has 2 params (lte+gte on today), next query has 1 (gt on today).
    mocks.findFirst.mockImplementation((q: unknown) => {
      const where = (q as { where?: { queryChunks?: unknown[] } }).where;
      let params = 0;
      const walk = (x: unknown) => {
        if (Array.isArray(x)) return x.forEach(walk);
        if (x && typeof x === 'object' && 'queryChunks' in x) {
          return (x as { queryChunks: unknown[] }).queryChunks.forEach(walk);
        }
        if (x && (x as { constructor?: { name?: string } }).constructor?.name === 'Param') params++;
      };
      where?.queryChunks?.forEach(walk);
      return Promise.resolve(params === 1 ? next : undefined);
    });
    mocks.findMany.mockResolvedValue([NEW_TERM, next]);

    const result = await checkNextTerm();

    expect(result).toEqual({ success: true, data: next });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('does nothing when there is no active term to base one on', async () => {
    const result = await checkNextTerm();

    expect(result).toEqual({ success: true, data: undefined });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('auto-creates the next term starting the day the active one ends', async () => {
    const active = {
      ...NEW_TERM,
      id: 'ACTIVE',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    };
    mocks.findFirst
      .mockResolvedValueOnce(active) // current active
      .mockResolvedValueOnce(undefined); // no next
    mocks.findMany.mockResolvedValue([active]);

    const result = await checkNextTerm();

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(mocks.insert).toHaveBeenCalled();
    const values = mocks.insert.mock.results[0]!.value
      .values as ReturnType<typeof vi.fn>;
    const inserted = values.mock.calls[0][0];
    expect(inserted.startDate).toBe('2026-09-01'); // day after current term's end
    expect(inserted.endDate).toBe('2026-10-01'); // same 30-day duration
    expect(inserted.endDate > inserted.startDate).toBe(true); // CHECK constraint holds
    expect(inserted.isAutoCreated).toBe(true);
  });

  it('returns a generic error when the insert throws', async () => {
    const active = {
      ...NEW_TERM,
      id: 'ACTIVE',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    };
    mocks.findFirst
      .mockResolvedValueOnce(active)
      .mockResolvedValueOnce(undefined);
    mocks.findMany.mockResolvedValue([active]);
    mockInsertRejects();

    const result = await checkNextTerm();

    expect(result).toEqual({
      success: false,
      error: 'Gagal menyiapkan batch berikutnya',
    });
  });
});

describe('updateTerm', () => {
  const existing = {
    id: 'T1',
    name: 'Batch A',
    startDate: '2026-08-01',
    endDate: '2026-09-30',
    isAutoCreated: true,
  };

  it('clears isAutoCreated and does not touch the successor when dates are unchanged', async () => {
    mocks.findFirst
      .mockResolvedValueOnce(existing) // the row being edited
      .mockResolvedValueOnce(undefined); // successor lookup (none)
    mocks.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const result = await updateTerm('T1', {
      name: 'Batch A',
      startDate: '2026-08-01',
      endDate: '2026-09-30',
    });

    expect(result.success).toBe(true);
    const setMock = mocks.update.mock.results[0]!.value
      .set as ReturnType<typeof vi.fn>;
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ isAutoCreated: false })
    );
    // successor update (deletedAt) not called
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });

  it('soft-deletes the auto-created successor chained to the old end date', async () => {
    const successor = {
      id: 'NEXT',
      name: 'Batch II',
      startDate: '2026-09-30', // == existing.endDate
      endDate: '2026-10-30',
      isAutoCreated: true,
    };
    mocks.findFirst
      .mockResolvedValueOnce(existing) // the row being edited
      .mockResolvedValueOnce(successor); // successor lookup
    mocks.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const result = await updateTerm('T1', {
      name: 'Batch A',
      startDate: '2026-07-01',
      endDate: '2026-09-10', // corrected dates
    });

    expect(result.success).toBe(true);
    expect(mocks.update).toHaveBeenCalledTimes(2);
    const setMock = mocks.update.mock.results[0]!.value
      .set as ReturnType<typeof vi.fn>;
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2026-07-01',
        endDate: '2026-09-10',
        isAutoCreated: false,
      })
    );
    const successorSetMock = mocks.update.mock.results[1]!.value
      .set as ReturnType<typeof vi.fn>;
    expect(successorSetMock).toHaveBeenCalledWith({
      deletedAt: expect.any(Date),
    });
  });

  it('returns not-found when the term does not exist', async () => {
    mocks.findFirst.mockResolvedValueOnce(undefined);

    const result = await updateTerm('GHOST', {
      name: 'Batch A',
      startDate: '2026-08-01',
      endDate: '2026-09-30',
    });

    expect(result).toEqual({
      success: false,
      error: 'Batch tidak ditemukan',
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe('deleteTerm', () => {
  it('soft-deletes the term and returns success', async () => {
    const result = await deleteTerm('T1');

    expect(result).toEqual({ success: true, data: undefined });
    const setMock = mocks.update.mock.results[0]!.value
      .set as ReturnType<typeof vi.fn>;
    expect(setMock).toHaveBeenCalledWith({ deletedAt: expect.any(Date) });
    expect(mocks.update.mock.results[0]!.value.set.mock.results[0]!.value
      .where).toHaveBeenCalledTimes(1);
  });

  it('returns a generic error when the update throws', async () => {
    mockUpdateRejects();

    const result = await deleteTerm('T1');

    expect(result).toEqual({ success: false, error: 'Gagal menghapus batch' });
  });

  it('blocks a non-owner', async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: 'teacher-1', role: 'teacher' },
    });

    const result = await deleteTerm('T1');

    expect(result.success).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
