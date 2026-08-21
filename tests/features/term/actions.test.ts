import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTerm, deleteTerm } from '@/features/term/actions';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn(),
  findFirst: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: () => new Headers() }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock('@/db', () => ({
  db: {
    query: { term: { findFirst: mocks.findFirst } },
    insert: mocks.insert,
    update: mocks.update,
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
