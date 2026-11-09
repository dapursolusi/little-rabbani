import { redirect } from 'next/navigation';

import MonthlyReportPage from '@/app/(auth)/dashboard/report/month/page';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getTerms: vi.fn(),
  getClassSessions: vi.fn(),
  checkCurrentTerm: vi.fn(),
  getClassMonthlyReportOverview: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    // Next's redirect throws to stop rendering — mirror that.
    throw Object.assign(new Error('NEXT_REDIRECT'), { url });
  }),
}));
vi.mock('@/features/term/services', () => ({
  getTerms: mocks.getTerms,
  checkCurrentTerm: mocks.checkCurrentTerm,
}));
vi.mock('@/features/class-session/services', () => ({
  getClassSessions: mocks.getClassSessions,
}));
vi.mock('@/features/report/month/services', () => ({
  getClassMonthlyReportOverview: mocks.getClassMonthlyReportOverview,
}));
vi.mock('@/features/report/month/components/client', () => ({
  default: () => null,
}));

const TERM = {
  id: 'b3c1d2e4-0000-4000-8000-000000000001',
  name: 'Batch I',
  startDate: '2026-08-01',
  endDate: '2026-12-15',
  isAutoCreated: false,
};
const CLASS = {
  id: 'b3c1d2e4-0000-4000-8000-000000000002',
  name: 'Kelas Pagi',
  startTime: '08:00',
  endTime: '10:00',
};

const EMPTY_OVERVIEW = {
  kids: [],
  summary: {
    totalKids: 0,
    withReport: 0,
    eligibleWithoutReport: 0,
    insufficientWithoutReport: 0,
  },
  isFinalMonth: false,
};

async function renderPage(searchParams: Record<string, string> = {}) {
  return MonthlyReportPage({ searchParams: Promise.resolve(searchParams) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getTerms.mockResolvedValue([TERM]);
  mocks.getClassSessions.mockResolvedValue([CLASS]);
  mocks.checkCurrentTerm.mockResolvedValue(TERM);
  mocks.getClassMonthlyReportOverview.mockResolvedValue(EMPTY_OVERVIEW);
});

describe('MonthlyReportPage term and month selection', () => {
  it('redirects to the ongoing term when no term is selected', async () => {
    await expect(renderPage()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      `/dashboard/report/month?termId=${TERM.id}`
    );
  });

  it('keeps a valid class through the term redirect', async () => {
    await expect(renderPage({ classSessionId: CLASS.id })).rejects.toThrow(
      'NEXT_REDIRECT'
    );

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      `/dashboard/report/month?termId=${TERM.id}&classSessionId=${CLASS.id}`
    );
  });

  it('canonicalises to the latest reportable month', async () => {
    await expect(renderPage({ termId: TERM.id })).rejects.toThrow(
      'NEXT_REDIRECT'
    );

    const url = vi.mocked(redirect).mock.calls[0]?.[0] as string;
    expect(url).toContain('month=');
    expect(url).toContain('termId=' + TERM.id);
  });

  it('falls a future month back to the latest reportable month', async () => {
    await expect(
      renderPage({ termId: TERM.id, month: '2099-01' })
    ).rejects.toThrow('NEXT_REDIRECT');

    const url = vi.mocked(redirect).mock.calls[0]?.[0] as string;
    expect(url).not.toContain('2099-01');
  });

  it('scopes the overview to the canonical term, class and month', async () => {
    await renderPage({
      termId: TERM.id,
      classSessionId: CLASS.id,
      month: '2026-10',
    });

    expect(mocks.getClassMonthlyReportOverview).toHaveBeenCalledWith({
      termId: TERM.id,
      classSessionId: CLASS.id,
      yearMonth: '2026-10',
    });
  });

  it('drops a class id that belongs to no known class session', async () => {
    await renderPage({
      termId: TERM.id,
      classSessionId: 'b3c1d2e4-0000-4000-8000-0000000000ff',
      month: '2026-10',
    });

    expect(mocks.getClassMonthlyReportOverview).toHaveBeenCalledWith({
      termId: TERM.id,
      classSessionId: undefined,
      yearMonth: '2026-10',
    });
  });
});
