import { MONTHLY_REPORT_STATUS } from '@/features/report/constants';
import * as kidReportAction from '@/features/report/kid/actions';
import MonthlyReportClient from '@/features/report/month/components/client';
import { ClassReportKid, ClassReportOverview } from '@/features/report/types';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));
vi.mock('@/contexts/ongoing-term', () => ({
  useOngoingTerm: () => ({ ongoingTerm: null, isLoading: false }),
}));
vi.mock('@/features/report/kid/actions', () => ({
  generateMonthlyReportForBatch: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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

describe('MonthlyReportClient batch generation', () => {
  const READY = kid();
  const WITH_REPORT = kid({
    kidId: 'b3c1d2e4-0000-4000-8000-000000000011',
    name: 'Budi',
    reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
  });
  const NOT_READY = kid({
    kidId: 'b3c1d2e4-0000-4000-8000-000000000012',
    name: 'Citra',
    ready: false,
    readinessReason: 'Belum ada observasi untuk anak ini',
  });

  function batchOverview() {
    return overview({
      kids: [READY, WITH_REPORT, NOT_READY],
      summary: {
        totalKids: 3,
        withReport: 1,
        eligibleWithoutReport: 1,
        insufficientWithoutReport: 1,
      },
    });
  }

  const AI_DRAFT = {
    socialEmotional: 'Ananda menunjukkan empati.',
    wellbeing: 'Kesehatan baik.',
    highlights: ['Berani tampil depan'],
    homeRecommendations: ['Ajak bercerita'],
  };
  const OK = {
    success: true as const,
    data: { narrative: 'draft', aiDraft: AI_DRAFT },
    message: 'ok',
  };
  const FAIL = {
    success: false as const,
    message: 'Gagal membuat draft',
  };

  function batchButton() {
    return screen.getByText(
      (_, el) =>
        el?.tagName === 'BUTTON' &&
        (el.textContent ?? '').startsWith('Buat laporan tersisa')
    );
  }

  function confirmButton() {
    return screen.getByText(
      (_, el) => el?.tagName === 'BUTTON' && el.textContent === 'Ya, Buat'
    );
  }

  beforeEach(() => {
    vi.mocked(kidReportAction.generateMonthlyReportForBatch).mockResolvedValue(
      OK
    );
  });

  it('shows a confirmation with the eligible, skipped-existing and skipped-insufficient counts', () => {
    renderClient({ overview: batchOverview() });

    fireEvent.click(batchButton());

    expect(screen.getByText(/1 laporan akan dibuat/)).toBeDefined();
    expect(screen.getByText(/1 laporan sudah ada dan dilewati/)).toBeDefined();
    expect(screen.getByText(/1 anak datanya kurang/)).toBeDefined();
    expect(screen.getByText(/Kelas Pagi, Oktober 2026/)).toBeDefined();
  });

  it('does not call the server before explicit confirmation', () => {
    renderClient({ overview: batchOverview() });

    fireEvent.click(batchButton());

    expect(
      kidReportAction.generateMonthlyReportForBatch
    ).not.toHaveBeenCalled();
  });

  it('generates only the eligible children without reports, one request at a time', async () => {
    renderClient({ overview: batchOverview() });

    fireEvent.click(batchButton());
    fireEvent.click(confirmButton());

    await waitFor(() =>
      expect(kidReportAction.generateMonthlyReportForBatch).toHaveBeenCalled()
    );
    await waitFor(() => expect(screen.getByText(/1 berhasil/)).toBeDefined());

    expect(kidReportAction.generateMonthlyReportForBatch).toHaveBeenCalledTimes(
      1
    );
    expect(kidReportAction.generateMonthlyReportForBatch).toHaveBeenCalledWith({
      kidId: READY.kidId,
      termId: TERM.id,
      yearMonth: '2026-10',
    });
  });

  it('processes children sequentially — the next request waits for the previous result', async () => {
    const SECOND = kid({
      kidId: 'b3c1d2e4-0000-4000-8000-000000000013',
      name: 'Dimas',
    });
    let resolveFirst: () => void = () => {};
    vi.mocked(kidReportAction.generateMonthlyReportForBatch)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = () => resolve(OK);
          })
      )
      .mockResolvedValueOnce(OK);

    renderClient({
      overview: overview({
        kids: [READY, SECOND],
        summary: {
          totalKids: 2,
          withReport: 0,
          eligibleWithoutReport: 2,
          insufficientWithoutReport: 0,
        },
      }),
    });

    fireEvent.click(batchButton());
    fireEvent.click(confirmButton());

    await waitFor(() =>
      expect(
        screen.getByText(/Generating 1 of 2|Membuat 1 dari 2/)
      ).toBeDefined()
    );
    expect(kidReportAction.generateMonthlyReportForBatch).toHaveBeenCalledTimes(
      1
    );

    await act(async () => resolveFirst());

    await waitFor(() =>
      expect(
        kidReportAction.generateMonthlyReportForBatch
      ).toHaveBeenCalledTimes(2)
    );
    await waitFor(() => expect(screen.getByText(/2 berhasil/)).toBeDefined());
  });

  it('continues after a failure and reports it in the final summary', async () => {
    const SECOND = kid({
      kidId: 'b3c1d2e4-0000-4000-8000-000000000013',
      name: 'Dimas',
    });
    vi.mocked(kidReportAction.generateMonthlyReportForBatch)
      .mockResolvedValueOnce(OK)
      .mockResolvedValueOnce(FAIL);

    renderClient({
      overview: overview({
        kids: [READY, SECOND],
        summary: {
          totalKids: 2,
          withReport: 0,
          eligibleWithoutReport: 2,
          insufficientWithoutReport: 0,
        },
      }),
    });

    fireEvent.click(batchButton());
    fireEvent.click(confirmButton());

    await waitFor(() => expect(screen.getByText(/1 gagal/)).toBeDefined());
    expect(kidReportAction.generateMonthlyReportForBatch).toHaveBeenCalledTimes(
      2
    );
    expect(screen.getByText('Dimas')).toBeDefined();
    expect(screen.getByText('Gagal membuat draft')).toBeDefined();
    // The successful child is kept.
    expect(screen.getByText(/1 berhasil/)).toBeDefined();
  });

  it('offers a per-child retry for a failed child only', async () => {
    vi.mocked(kidReportAction.generateMonthlyReportForBatch)
      .mockResolvedValueOnce({ success: false, message: 'Gagal membuat draft' })
      .mockResolvedValueOnce(OK);

    renderClient({
      overview: overview({
        kids: [READY],
        summary: {
          totalKids: 1,
          withReport: 0,
          eligibleWithoutReport: 1,
          insufficientWithoutReport: 0,
        },
      }),
    });

    fireEvent.click(batchButton());
    fireEvent.click(confirmButton());

    await waitFor(() => expect(screen.getByText(/Coba lagi/)).toBeDefined());
    fireEvent.click(screen.getByText(/Coba lagi/));

    await waitFor(() => expect(screen.getByText(/1 berhasil/)).toBeDefined());
    expect(kidReportAction.generateMonthlyReportForBatch).toHaveBeenCalledTimes(
      2
    );
    // Retry repeats only the failed child.
    expect(
      vi.mocked(kidReportAction.generateMonthlyReportForBatch).mock.calls
    ).toEqual([
      [{ kidId: READY.kidId, termId: TERM.id, yearMonth: '2026-10' }],
      [{ kidId: READY.kidId, termId: TERM.id, yearMonth: '2026-10' }],
    ]);
  });

  it('skips a child that already has a report when the run is repeated', async () => {
    // First run succeeds; the overview prop is unchanged in this unit, so the
    // rerun must rely on the locally adopted success state.
    renderClient({
      overview: overview({
        kids: [READY],
        summary: {
          totalKids: 1,
          withReport: 0,
          eligibleWithoutReport: 1,
          insufficientWithoutReport: 0,
        },
      }),
    });

    fireEvent.click(batchButton());
    fireEvent.click(confirmButton());
    await waitFor(() => expect(screen.getByText(/1 berhasil/)).toBeDefined());

    // Nothing remains → button is gone, no second request possible.
    expect(
      screen.queryByText(
        (_, el) =>
          el?.tagName === 'BUTTON' &&
          (el.textContent ?? '').startsWith('Buat laporan tersisa')
      )
    ).toBeNull();
    expect(kidReportAction.generateMonthlyReportForBatch).toHaveBeenCalledTimes(
      1
    );
  });

  it('never starts an empty batch', () => {
    renderClient({
      overview: overview({
        kids: [WITH_REPORT, NOT_READY],
        summary: {
          totalKids: 2,
          withReport: 1,
          eligibleWithoutReport: 0,
          insufficientWithoutReport: 1,
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

  it('disables batch start while a run is in progress', async () => {
    let resolveFirst: () => void = () => {};
    vi.mocked(kidReportAction.generateMonthlyReportForBatch).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFirst = () => resolve(OK);
        })
    );

    renderClient({
      overview: overview({
        kids: [READY],
        summary: {
          totalKids: 1,
          withReport: 0,
          eligibleWithoutReport: 1,
          insufficientWithoutReport: 0,
        },
      }),
    });

    fireEvent.click(batchButton());
    fireEvent.click(confirmButton());

    await waitFor(() =>
      expect(
        screen.getByText(/Membuat 1 dari 1|Generating 1 of 1/)
      ).toBeDefined()
    );
    // No batch trigger is available while running — double submission blocked.
    expect(
      screen.queryByText(
        (_, el) =>
          el?.tagName === 'BUTTON' &&
          (el.textContent ?? '').startsWith('Buat laporan tersisa')
      )
    ).toBeNull();

    await act(async () => resolveFirst());
  });

  it('blocks a per-child retry while another batch run is in progress', async () => {
    const SECOND = kid({
      kidId: 'b3c1d2e4-0000-4000-8000-000000000013',
      name: 'Dimas',
    });
    let resolveSecond: () => void = () => {};
    vi.mocked(kidReportAction.generateMonthlyReportForBatch)
      .mockResolvedValueOnce(FAIL)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = () => resolve(OK);
          })
      );

    renderClient({
      overview: overview({
        kids: [READY, SECOND],
        summary: {
          totalKids: 2,
          withReport: 0,
          eligibleWithoutReport: 2,
          insufficientWithoutReport: 0,
        },
      }),
    });

    fireEvent.click(batchButton());
    fireEvent.click(confirmButton());

    // The first child failed, the second is still generating.
    await waitFor(() => expect(screen.getByText(/Coba lagi/)).toBeDefined());
    expect(screen.getByText(/Coba lagi/).closest('button')).toHaveAttribute(
      'disabled'
    );
    expect(kidReportAction.generateMonthlyReportForBatch).toHaveBeenCalledTimes(
      2
    );

    await act(async () => resolveSecond());
  });

  it('counts a conflict as skipped, not failed', async () => {
    vi.mocked(kidReportAction.generateMonthlyReportForBatch).mockResolvedValue({
      success: false,
      message: 'Laporan sudah ada dan tidak dibuat ulang',
      error: { type: 'conflict' },
    });

    renderClient({
      overview: overview({
        kids: [READY],
        summary: {
          totalKids: 1,
          withReport: 0,
          eligibleWithoutReport: 1,
          insufficientWithoutReport: 0,
        },
      }),
    });

    fireEvent.click(batchButton());
    fireEvent.click(confirmButton());

    await waitFor(() => expect(screen.getByText(/1 dilewati/)).toBeDefined());
    expect(screen.getByText('Dilewati')).toBeDefined();
    expect(screen.queryByText(/gagal/)).toBeNull();
    expect(screen.queryByText(/Coba lagi/)).toBeNull();
  });

  it('shows an error toast when a run produced no report at all', async () => {
    vi.mocked(kidReportAction.generateMonthlyReportForBatch).mockResolvedValue(
      FAIL
    );

    renderClient({
      overview: overview({
        kids: [READY],
        summary: {
          totalKids: 1,
          withReport: 0,
          eligibleWithoutReport: 1,
          insufficientWithoutReport: 0,
        },
      }),
    });

    fireEvent.click(batchButton());
    fireEvent.click(confirmButton());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Tidak ada laporan yang berhasil dibuat'
      )
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('keeps "Buka laporan" for a child whose report exists despite a failure', () => {
    renderClient({
      overview: overview({
        kids: [kid({ reportStatus: MONTHLY_REPORT_STATUS.DRAFT })],
        summary: {
          totalKids: 1,
          withReport: 1,
          eligibleWithoutReport: 0,
          insufficientWithoutReport: 0,
        },
      }),
    });

    expect(screen.getByText('Buka laporan')).toBeDefined();
    expect(screen.queryByText('Coba lagi')).toBeNull();
  });

  it('drops batch state when the month changes so eligibility is recalculated', async () => {
    const { rerender } = renderClient({
      overview: overview({
        kids: [READY],
        summary: {
          totalKids: 1,
          withReport: 0,
          eligibleWithoutReport: 1,
          insufficientWithoutReport: 0,
        },
      }),
    });

    fireEvent.click(batchButton());
    fireEvent.click(confirmButton());
    await waitFor(() => expect(screen.getByText(/1 berhasil/)).toBeDefined());

    // Same child, next month: the previous run's success must not hide it.
    rerender(
      <MonthlyReportClient
        terms={[TERM, OTHER_TERM]}
        classSessions={[CLASS]}
        currentTermId={TERM.id}
        currentClassSessionId={CLASS.id}
        currentMonth="2026-11"
        overview={overview({
          kids: [READY],
          summary: {
            totalKids: 1,
            withReport: 0,
            eligibleWithoutReport: 1,
            insufficientWithoutReport: 0,
          },
        })}
      />
    );

    expect(screen.queryByText(/1 berhasil/)).toBeNull();
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === 'BUTTON' &&
          (el.textContent ?? '').startsWith('Buat laporan tersisa')
      )
    ).toBeDefined();
  });

  it('refreshes the overview after a run so persisted reports show up', async () => {
    renderClient({
      overview: overview({
        kids: [READY],
        summary: {
          totalKids: 1,
          withReport: 0,
          eligibleWithoutReport: 1,
          insufficientWithoutReport: 0,
        },
      }),
    });

    fireEvent.click(batchButton());
    fireEvent.click(confirmButton());

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalled();
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
