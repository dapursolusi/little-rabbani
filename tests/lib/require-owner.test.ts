import { afterEach, describe, expect, it, vi } from 'vitest';

import { requireOwner } from '@/lib/actions/require-owner';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: () => new Headers() }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

afterEach(() => vi.clearAllMocks());

describe('requireOwner auth gate', () => {
  it('runs the handler for an owner session', async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: 'owner-1', role: 'owner' },
    });
    const handler = vi.fn(async () => ({ ok: true }));

    const result = await requireOwner(handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true });
  });

  it('redirects an unauthenticated caller without running the handler', async () => {
    mocks.getSession.mockResolvedValue(null);
    // Real redirect() throws NEXT_REDIRECT to abort the render — mirror that.
    mocks.redirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    const handler = vi.fn(async () => ({ ok: true }));

    await expect(requireOwner(handler)).rejects.toThrow('NEXT_REDIRECT');

    expect(mocks.redirect).toHaveBeenCalledWith('/login');
    expect(handler).not.toHaveBeenCalled();
  });

  it('blocks a non-owner without running the handler', async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: 'teacher-1', role: 'teacher' },
    });
    const handler = vi.fn(async () => ({ ok: true }));

    const result = await requireOwner(handler);

    expect(handler).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: 'Akses ditolak. Hanya Owner yang dapat melakukan tindakan ini.',
    });
  });
});
