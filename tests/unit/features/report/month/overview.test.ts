import { MONTHLY_REPORT_STATUS } from '@/features/report/constants';
import { getClassMonthlyReportOverview } from '@/features/report/month/services';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@/lib/errors';

// Collaborator boundaries only. Eligibility window math stays real.
const mocks = vi.hoisted(() => ({
  getTermById: vi.fn(),
  getKidsEnrollments: vi.fn(),
  getObservationCountsByKidForMonth: vi.fn(),
  findManyByTermMonth: vi.fn(),
}));

vi.mock('@/features/term/services', () => ({
  getTermById: mocks.getTermById,
}));
vi.mock('@/features/kid-enrollment/services', () => ({
  getKidsEnrollments: mocks.getKidsEnrollments,
}));
vi.mock('@/features/daily-class-report/services', () => ({
  dcrService: {
    getObservationCountsByKidForMonth: mocks.getObservationCountsByKidForMonth,
  },
}));
vi.mock('@/features/report/kid/repositories', () => ({
  findManyByTermMonth: mocks.findManyByTermMonth,
}));

const TERM_ID = 'b3c1d2e4-0000-4000-8000-000000000001';
const CLASS_A = 'b3c1d2e4-0000-4000-8000-000000000002';
const CLASS_B = 'b3c1d2e4-0000-4000-8000-000000000003';
const KID_A = 'b3c1d2e4-0000-4000-8000-000000000010';
const KID_B = 'b3c1d2e4-0000-4000-8000-000000000011';
const KID_C = 'b3c1d2e4-0000-4000-8000-000000000012';
const KID_D = 'b3c1d2e4-0000-4000-8000-000000000013';

const TERM = {
  id: TERM_ID,
  name: 'Batch I',
  startDate: '2026-08-01',
  endDate: '2026-12-15',
  isAutoCreated: false,
};

function enrollment(kidId: string, name: string, classSessionId = CLASS_A) {
  return {
    id: `e-${kidId}`,
    termId: TERM_ID,
    classSessionId,
    kidId,
    status: 'enrolled',
    kid: { id: kidId, name, nickName: null },
    term: { id: TERM_ID, name: TERM.name },
    classSession: { id: classSessionId, name: 'Kelas' },
  };
}

function counts(byClass: Record<string, Record<string, number>> = {}) {
  mocks.getObservationCountsByKidForMonth.mockImplementation(
    async ({ classSessionId }: { classSessionId: string }) => {
      const observationCountByKidId = byClass[classSessionId] ?? {};
      return {
        dcrCount: Object.keys(observationCountByKidId).length > 0 ? 3 : 0,
        observationCountByKidId,
      };
    }
  );
}

const INPUT = {
  termId: TERM_ID,
  classSessionId: CLASS_A,
  yearMonth: '2026-10',
};

beforeEach(() => {
  mocks.getTermById.mockResolvedValue(TERM);
  mocks.getKidsEnrollments.mockResolvedValue([
    enrollment(KID_A, 'Aisyah'),
    enrollment(KID_B, 'Budi'),
  ]);
  counts({ [CLASS_A]: { [KID_A]: 2, [KID_B]: 1 } });
  mocks.findManyByTermMonth.mockResolvedValue([]);
});

afterEach(() => vi.clearAllMocks());

describe('getClassMonthlyReportOverview scoping', () => {
  it('asks enrollment for the selected term and class only', async () => {
    await getClassMonthlyReportOverview(INPUT);

    expect(mocks.getKidsEnrollments).toHaveBeenCalledWith({
      termId: TERM_ID,
      classSessionId: CLASS_A,
    });
  });

  it('uses calendar-month boundaries clipped by the term', async () => {
    mocks.getTermById.mockResolvedValue({
      ...TERM,
      startDate: '2026-10-16',
      endDate: '2026-11-20',
    });

    await getClassMonthlyReportOverview(INPUT);

    expect(mocks.getObservationCountsByKidForMonth).toHaveBeenCalledWith({
      classSessionId: CLASS_A,
      startDate: '2026-10-16',
      endDate: '2026-10-31',
    });
  });

  it('clips the window to a term that ends mid-month', async () => {
    mocks.getTermById.mockResolvedValue({
      ...TERM,
      startDate: '2026-10-01',
      endDate: '2026-10-20',
    });

    await getClassMonthlyReportOverview(INPUT);

    expect(mocks.getObservationCountsByKidForMonth).toHaveBeenCalledWith({
      classSessionId: CLASS_A,
      startDate: '2026-10-01',
      endDate: '2026-10-20',
    });
  });

  it('treats an empty class filter as "all classes"', async () => {
    await getClassMonthlyReportOverview({ ...INPUT, classSessionId: '' });

    expect(mocks.getKidsEnrollments).toHaveBeenCalledWith({
      termId: TERM_ID,
      classSessionId: undefined,
    });
  });

  it('matches reports on the exact term + month + enrolled kid set', async () => {
    await getClassMonthlyReportOverview(INPUT);

    expect(mocks.findManyByTermMonth).toHaveBeenCalledWith({
      termId: TERM_ID,
      yearMonth: '2026-10',
      kidIds: [KID_A, KID_B],
    });
  });

  it('refuses a month outside the term range', async () => {
    await expect(
      getClassMonthlyReportOverview({ ...INPUT, yearMonth: '2026-07' })
    ).rejects.toThrow(AppError);

    expect(mocks.getKidsEnrollments).not.toHaveBeenCalled();
  });

  it('queries observations once per class when no class filter is applied', async () => {
    mocks.getKidsEnrollments.mockResolvedValue([
      enrollment(KID_A, 'Aisyah', CLASS_A),
      enrollment(KID_B, 'Budi', CLASS_B),
    ]);

    await getClassMonthlyReportOverview({
      ...INPUT,
      classSessionId: 'all',
    });

    expect(mocks.getObservationCountsByKidForMonth).toHaveBeenCalledTimes(2);
    expect(mocks.getObservationCountsByKidForMonth).toHaveBeenCalledWith(
      expect.objectContaining({ classSessionId: CLASS_A })
    );
    expect(mocks.getObservationCountsByKidForMonth).toHaveBeenCalledWith(
      expect.objectContaining({ classSessionId: CLASS_B })
    );
  });
});

describe('getClassMonthlyReportOverview readiness and lifecycle', () => {
  it('lists every enrolled child, ready when the kid has observations', async () => {
    counts({ [CLASS_A]: { [KID_A]: 2 } });

    const overview = await getClassMonthlyReportOverview(INPUT);

    expect(overview.kids.map((k) => k.name)).toEqual(['Aisyah', 'Budi']);
    expect(overview.kids[0]).toMatchObject({ ready: true, reportStatus: null });
    expect(overview.kids[1]).toMatchObject({
      ready: false,
      reportStatus: null,
    });
  });

  it('explains insufficient data per kid versus a class with no daily reports', async () => {
    counts({});
    mocks.getKidsEnrollments.mockResolvedValue([enrollment(KID_A, 'Aisyah')]);

    const overview = await getClassMonthlyReportOverview(INPUT);
    expect(overview.kids[0].readinessReason).toBe(
      'Belum ada laporan harian di bulan ini'
    );

    // Daily reports exist, but this kid has no observation in any of them.
    counts({ [CLASS_A]: { [KID_A]: 1 } });
    mocks.getKidsEnrollments.mockResolvedValue([
      enrollment(KID_A, 'Aisyah'),
      enrollment(KID_B, 'Budi'),
    ]);

    const mixed = await getClassMonthlyReportOverview(INPUT);
    expect(mixed.kids.find((k) => k.kidId === KID_B)?.readinessReason).toBe(
      'Belum ada observasi untuk anak ini'
    );
  });

  it('matches each persisted report to its child and keeps edited separate', async () => {
    mocks.findManyByTermMonth.mockResolvedValue([
      {
        kidId: KID_A,
        reportStatus: MONTHLY_REPORT_STATUS.REVIEWED,
        isEdited: true,
      },
    ]);

    const overview = await getClassMonthlyReportOverview(INPUT);
    const aisyah = overview.kids.find((k) => k.kidId === KID_A);
    const budi = overview.kids.find((k) => k.kidId === KID_B);

    expect(aisyah).toMatchObject({
      reportStatus: MONTHLY_REPORT_STATUS.REVIEWED,
      isEdited: true,
    });
    expect(budi?.reportStatus).toBeNull();
  });

  it('never surfaces a report belonging to a child outside the selected class', async () => {
    // Both the enrollment query and the report query are kid-scoped; a report
    // for a kid nobody enrolled (other class/term) can never become a row.
    mocks.findManyByTermMonth.mockResolvedValue([
      {
        kidId: KID_D,
        reportStatus: MONTHLY_REPORT_STATUS.SENT,
        isEdited: false,
      },
    ]);

    const overview = await getClassMonthlyReportOverview(INPUT);

    expect(overview.kids).toHaveLength(2);
    expect(overview.kids.some((k) => k.kidId === KID_D)).toBe(false);
    expect(overview.summary.withReport).toBe(0);
    expect(overview.summary.totalKids).toBe(2);
  });

  it('counts the summary without double counting', async () => {
    mocks.getKidsEnrollments.mockResolvedValue([
      enrollment(KID_A, 'Aisyah'),
      enrollment(KID_B, 'Budi'),
      enrollment(KID_C, 'Citra'),
      enrollment(KID_D, 'Dimas'),
    ]);
    // Aisyah: ready + draft. Budi: ready, no report. Citra: insufficient, no
    // report. Dimas: insufficient (no observation) but a sent report exists.
    counts({ [CLASS_A]: { [KID_A]: 2, [KID_B]: 1 } });
    mocks.findManyByTermMonth.mockResolvedValue([
      {
        kidId: KID_A,
        reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
        isEdited: false,
      },
      {
        kidId: KID_D,
        reportStatus: MONTHLY_REPORT_STATUS.SENT,
        isEdited: false,
      },
    ]);

    const { summary, kids } = await getClassMonthlyReportOverview(INPUT);

    expect(summary).toEqual({
      totalKids: 4,
      withReport: 2,
      eligibleWithoutReport: 1,
      insufficientWithoutReport: 1,
    });
    expect(
      summary.withReport +
        summary.eligibleWithoutReport +
        summary.insufficientWithoutReport
    ).toBe(kids.length);
  });

  it('flags the term final month — monthly generation is not applicable', async () => {
    const overview = await getClassMonthlyReportOverview({
      ...INPUT,
      yearMonth: '2026-12',
    });

    expect(overview.isFinalMonth).toBe(true);
  });

  it('returns an empty overview for a class with no enrolled children', async () => {
    mocks.getKidsEnrollments.mockResolvedValue([]);

    const overview = await getClassMonthlyReportOverview(INPUT);

    expect(overview.kids).toEqual([]);
    expect(overview.summary).toEqual({
      totalKids: 0,
      withReport: 0,
      eligibleWithoutReport: 0,
      insufficientWithoutReport: 0,
    });
    // No kid ids → no report query, no observation query.
    expect(mocks.findManyByTermMonth).not.toHaveBeenCalled();
    expect(mocks.getObservationCountsByKidForMonth).not.toHaveBeenCalled();
  });
});
