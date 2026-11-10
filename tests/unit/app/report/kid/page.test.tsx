import { redirect } from 'next/navigation';

import KidReportPage from '@/app/(auth)/dashboard/report/kid/[id]/page';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  KidNoEligibleMonthsError,
  KidNoReportHistoryError,
} from '@/lib/errors';

const mocks = vi.hoisted(() => ({
  getKidMonthlyReportPage: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    // Next's redirect throws to stop rendering — mirror that.
    throw Object.assign(new Error('NEXT_REDIRECT'), { url });
  }),
}));
vi.mock('@/features/report/kid/services', () => ({
  getKidMonthlyReportPage: mocks.getKidMonthlyReportPage,
}));
vi.mock('@/features/report/kid/components/client', () => ({
  default: () => null,
}));

const KID_ID = 'b3c1d2e4-0000-4000-8000-000000000001';
const TERM = {
  id: 'b3c1d2e4-0000-4000-8000-000000000002',
  name: 'Term 1',
  startDate: '2026-08-01',
  endDate: '2026-12-15',
  isAutoCreated: false,
};

const PAGE = {
  enrolledTerms: [TERM],
  reportableMonths: ['2026-08', '2026-09', '2026-10'],
  selectedMonth: '2026-10',
  selectedTerm: TERM,
  monthTerms: [TERM],
  isFinalMonth: false,
  prevMonth: '2026-09',
  nextMonth: null,
  kidDetails: { id: KID_ID, name: 'Ananda', monthlyReports: [] },
  academicDetails: { dcrs: [], isFinalMonth: false },
};

async function renderPage(
  searchParams: Record<string, string> = {}
): Promise<unknown> {
  return KidReportPage({
    params: Promise.resolve({ id: KID_ID }),
    searchParams: Promise.resolve(searchParams),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getKidMonthlyReportPage.mockResolvedValue(PAGE);
});

describe('KidReportPage empty states', () => {
  it('renders the no-batch state when the kid is enrolled in no term', async () => {
    mocks.getKidMonthlyReportPage.mockRejectedValue(
      new KidNoEligibleMonthsError()
    );

    await renderPage();

    // The page must not redirect or throw; it renders the shared empty state.
    expect(vi.mocked(redirect)).not.toHaveBeenCalled();
  });

  it('renders the no-history state when no month has started yet', async () => {
    mocks.getKidMonthlyReportPage.mockRejectedValue(
      new KidNoReportHistoryError()
    );

    await renderPage();

    expect(vi.mocked(redirect)).not.toHaveBeenCalled();
  });

  it('rethrows errors that are not modelled empty states', async () => {
    mocks.getKidMonthlyReportPage.mockRejectedValue(
      new Error('Data anak tidak ditemukan')
    );

    await expect(renderPage()).rejects.toThrow('Data anak tidak ditemukan');
  });
});

describe('KidReportPage read wiring', () => {
  it('reads the page context once with the requested URL params', async () => {
    await renderPage({ termId: TERM.id, month: '2026-10' });

    expect(mocks.getKidMonthlyReportPage).toHaveBeenCalledTimes(1);
    expect(mocks.getKidMonthlyReportPage).toHaveBeenCalledWith({
      kidId: KID_ID,
      yearMonth: '2026-10',
      termId: TERM.id,
    });
  });

  it('canonicalises the URL against the resolved month and term', async () => {
    mocks.getKidMonthlyReportPage.mockResolvedValue({
      ...PAGE,
      selectedMonth: '2026-09',
    });

    await expect(renderPage({ month: '2026-10' })).rejects.toThrow(
      'NEXT_REDIRECT'
    );

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      `/dashboard/report/kid/${KID_ID}?termId=${TERM.id}&month=2026-09`
    );
  });

  it('renders without redirecting when the URL already matches', async () => {
    await renderPage({ termId: TERM.id, month: '2026-10' });

    expect(vi.mocked(redirect)).not.toHaveBeenCalled();
  });
});
