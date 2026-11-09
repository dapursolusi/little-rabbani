import { MONTHLY_REPORT_STATUS } from '@/features/report/constants';
import MonthlyReportClient from '@/features/report/month/components/client';
import { ClassReportKid, ClassReportOverview } from '@/features/report/types';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));
vi.mock('@/contexts/ongoing-term', () => ({
  useOngoingTerm: () => ({ ongoingTerm: null, isLoading: false }),
}));

const TERM = {
  id: 'b3c1d2e4-0000-4000-8000-000000000001',
  name: 'Batch I',
  startDate: '2026-08-01',
  endDate: '2026-12-15',
  isAutoCreated: false,
};
const OTHER_TERM = {
  ...TERM,
  id: 'b3c1d2e4-0000-4000-8000-000000000009',
  name: 'Batch II',
};
const CLASS = {
  id: 'b3c1d2e4-0000-4000-8000-000000000002',
  name: 'Kelas Pagi',
  startTime: '08:00',
  endTime: '10:00',
};
const KID = {
  kidId: 'b3c1d2e4-0000-4000-8000-000000000010',
  name: 'Aisyah',
  nickName: null,
  classSessionId: CLASS.id,
};

function kid(overrides: Partial<ClassReportKid> = {}): ClassReportKid {
  return {
    ...KID,
    ready: true,
    reportStatus: null,
    isEdited: false,
    ...overrides,
  };
}

function overview(overrides: Partial<ClassReportOverview> = {}) {
  return {
    kids: [],
    summary: {
      totalKids: 0,
      withReport: 0,
      eligibleWithoutReport: 0,
      insufficientWithoutReport: 0,
    },
    isFinalMonth: false,
    monthStart: '2026-10-01',
    monthEnd: '2026-10-31',
    ...overrides,
  };
}

function renderClient(
  props: Partial<Parameters<typeof MonthlyReportClient>[0]>
) {
  return render(
    <MonthlyReportClient
      terms={[TERM, OTHER_TERM]}
      classSessions={[CLASS]}
      currentTermId={TERM.id}
      currentClassSessionId={CLASS.id}
      currentMonth="2026-10"
      overview={overview()}
      {...props}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MonthlyReportClient empty states', () => {
  it('asks for a batch when none is selected', () => {
    renderClient({ currentTermId: '' });

    expect(screen.getByText(/Pilih batch terlebih dahulu!/)).toBeDefined();
  });

  it('distinguishes an empty class from a class with no generated reports', () => {
    const { unmount } = renderClient({ overview: overview() });
    expect(screen.getByText('Belum ada anak di kelas ini')).toBeDefined();
    unmount();

    renderClient({
      overview: overview({
        kids: [kid()],
        summary: {
          totalKids: 1,
          withReport: 0,
          eligibleWithoutReport: 1,
          insufficientWithoutReport: 0,
        },
      }),
    });
    expect(screen.queryByText('Belum ada anak di kelas ini')).toBeNull();
    expect(screen.getByText('Belum ada laporan yang dibuat')).toBeDefined();
  });
});

describe('MonthlyReportClient summary', () => {
  it('renders the four counts from the overview summary', () => {
    renderClient({
      overview: overview({
        kids: [kid()],
        summary: {
          totalKids: 4,
          withReport: 2,
          eligibleWithoutReport: 1,
          insufficientWithoutReport: 1,
        },
      }),
    });

    for (const [label, value] of [
      ['Total anak', '4'],
      ['Laporan ada', '2'],
      ['Siap dibuat', '1'],
      ['Data kurang', '1'],
    ] as const) {
      const tile = screen.getByText(label).parentElement;
      expect(tile?.textContent).toContain(value);
    }
  });
});

describe('MonthlyReportClient child rows', () => {
  it('always shows the name', () => {
    renderClient({
      overview: overview({
        kids: [kid()],
        summary: { ...overview().summary, totalKids: 1 },
      }),
    });

    expect(screen.getByText('Aisyah')).toBeDefined();
  });

  it.each([
    [MONTHLY_REPORT_STATUS.DRAFT, 'Draft'],
    [MONTHLY_REPORT_STATUS.REVIEWED, 'Direview'],
    [MONTHLY_REPORT_STATUS.SENT, 'Terkirim'],
  ])('renders the %s lifecycle badge', (status, label) => {
    renderClient({
      overview: overview({
        kids: [kid({ reportStatus: status })],
        summary: {
          totalKids: 1,
          withReport: 1,
          eligibleWithoutReport: 0,
          insufficientWithoutReport: 0,
        },
      }),
    });

    expect(screen.getByText(label)).toBeDefined();
  });

  it('separates readiness, lifecycle and manual edits into distinct labels', () => {
    renderClient({
      overview: overview({
        kids: [
          kid({
            reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
            isEdited: true,
          }),
        ],
        summary: {
          totalKids: 1,
          withReport: 1,
          eligibleWithoutReport: 0,
          insufficientWithoutReport: 0,
        },
      }),
    });

    expect(screen.getByText('Siap')).toBeDefined();
    expect(screen.getByText('Draft')).toBeDefined();
    expect(screen.getByText('Diedit manual')).toBeDefined();
  });

  it('shows the insufficient-data reason instead of a lifecycle status', () => {
    renderClient({
      overview: overview({
        kids: [
          kid({
            ready: false,
            readinessReason: 'Belum ada observasi untuk anak ini',
          }),
        ],
        summary: {
          totalKids: 1,
          withReport: 0,
          eligibleWithoutReport: 0,
          insufficientWithoutReport: 1,
        },
      }),
    });

    expect(screen.getAllByText('Data kurang')).toHaveLength(2); // summary tile + row badge
    expect(
      screen.getByText('Belum ada observasi untuk anak ini')
    ).toBeDefined();
    expect(screen.getByText('Belum dibuat')).toBeDefined();
  });

  it('links a child with a report to the individual report editor', () => {
    renderClient({
      overview: overview({
        kids: [kid({ reportStatus: MONTHLY_REPORT_STATUS.SENT })],
        summary: {
          totalKids: 1,
          withReport: 1,
          eligibleWithoutReport: 0,
          insufficientWithoutReport: 0,
        },
      }),
    });

    const link = screen.getByText('Buka laporan').closest('a');
    expect(link?.getAttribute('href')).toBe(
      `/dashboard/report/kid/${KID.kidId}?termId=${TERM.id}&month=2026-10`
    );
  });

  it('links a ready child without a report to the individual generation flow', () => {
    renderClient({
      overview: overview({
        kids: [kid()],
        summary: {
          totalKids: 1,
          withReport: 0,
          eligibleWithoutReport: 1,
          insufficientWithoutReport: 0,
        },
      }),
    });

    const link = screen.getByText('Buat laporan').closest('a');
    expect(link?.getAttribute('href')).toBe(
      `/dashboard/report/kid/${KID.kidId}?termId=${TERM.id}&month=2026-10`
    );
  });

  it('offers no report action for a child with insufficient data', () => {
    renderClient({
      overview: overview({
        kids: [
          kid({
            ready: false,
            readinessReason: 'Belum ada observasi untuk anak ini',
          }),
        ],
        summary: {
          totalKids: 1,
          withReport: 0,
          eligibleWithoutReport: 0,
          insufficientWithoutReport: 1,
        },
      }),
    });

    expect(screen.queryByText('Buka laporan')).toBeNull();
    expect(screen.queryByText('Buat laporan')).toBeNull();
  });
});

describe('MonthlyReportClient reserved batch action', () => {
  it('reserves a disabled slot for generate-remaining instead of faking it', () => {
    renderClient({
      overview: overview({
        kids: [kid()],
        summary: {
          totalKids: 2,
          withReport: 1,
          eligibleWithoutReport: 1,
          insufficientWithoutReport: 0,
        },
      }),
    });

    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === 'BUTTON' &&
          (el.textContent ?? '').startsWith('Buat laporan tersisa')
      )
    ).toHaveAttribute('disabled');
  });

  it('hides the batch slot when nothing is remaining', () => {
    renderClient({
      overview: overview({
        kids: [kid({ reportStatus: MONTHLY_REPORT_STATUS.SENT })],
        summary: {
          totalKids: 1,
          withReport: 1,
          eligibleWithoutReport: 0,
          insufficientWithoutReport: 0,
        },
      }),
    });

    expect(
      screen.queryByText(
        (_, el) =>
          el?.tagName === 'BUTTON' &&
          (el.textContent ?? '').startsWith('Buat laporan tersisa')
      )
    ).toBeNull();
  });
});

describe('MonthlyReportClient final month', () => {
  it('explains that the final month uses termly reporting', () => {
    renderClient({
      overview: overview({
        kids: [kid()],
        isFinalMonth: true,
        summary: {
          totalKids: 1,
          withReport: 0,
          eligibleWithoutReport: 1,
          insufficientWithoutReport: 0,
        },
      }),
    });

    expect(screen.getByText(/laporan triwulanan/)).toBeDefined();
  });

  it('offers no monthly generation action in the final month', () => {
    renderClient({
      overview: overview({
        kids: [kid()],
        isFinalMonth: true,
        summary: {
          totalKids: 1,
          withReport: 0,
          eligibleWithoutReport: 1,
          insufficientWithoutReport: 0,
        },
      }),
    });

    expect(screen.queryByText('Buat laporan')).toBeNull();
    expect(
      screen.queryByText(
        (_, el) =>
          el?.tagName === 'BUTTON' &&
          (el.textContent ?? '').startsWith('Buat laporan tersisa')
      )
    ).toBeNull();
  });

  it('still opens an existing report in the final month', () => {
    renderClient({
      overview: overview({
        kids: [kid({ reportStatus: MONTHLY_REPORT_STATUS.SENT })],
        isFinalMonth: true,
        summary: {
          totalKids: 1,
          withReport: 1,
          eligibleWithoutReport: 0,
          insufficientWithoutReport: 0,
        },
      }),
    });

    expect(screen.getByText('Buka laporan')).toBeDefined();
  });
});
