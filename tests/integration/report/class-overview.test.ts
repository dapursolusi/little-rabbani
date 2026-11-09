import { MONTHLY_REPORT_STATUS } from '@/features/report/constants';
import { getClassMonthlyReportOverview } from '@/features/report/month/services';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MonthlyReportStore } from '../../helpers/monthly-report-store';

/**
 * Class-overview integration through the real overview service. Enrollment,
 * observation counts and persisted reports are faked at their boundaries; the
 * month/term math, readiness derivation and summary reduction are real.
 */
const mocks = vi.hoisted(() => ({
  getTermById: vi.fn(),
  getKidsEnrollments: vi.fn(),
  getObservationCountsByKidForMonth: vi.fn(),
  store: undefined as unknown as MonthlyReportStore,
}));

vi.mock('@/features/term/services', () => ({
  getTermById: mocks.getTermById,
}));
vi.mock('@/features/kid-enrollment/services', () => ({
  getKidsEnrollments: mocks.getKidsEnrollments,
  verifyKidEnrollment: vi.fn(),
}));
vi.mock('@/features/daily-class-report/services', () => ({
  dcrService: {
    getObservationCountsByKidForMonth: mocks.getObservationCountsByKidForMonth,
  },
}));
vi.mock('@/features/report/kid/repositories', () => ({
  findManyByTermMonth: (
    input: Parameters<MonthlyReportStore['findManyByTermMonth']>[0]
  ) => mocks.store.findManyByTermMonth(input),
}));

const { createMonthlyReportStore } =
  await import('../../helpers/monthly-report-store');

const TERM_ID = 'b3c1d2e4-0000-4000-8000-000000000001';
const CLASS_A = 'b3c1d2e4-0000-4000-8000-000000000002';
const CLASS_B = 'b3c1d2e4-0000-4000-8000-000000000003';
const kidIds = (start: number, count: number) =>
  Array.from(
    { length: count },
    (_, index) =>
      `b3c1d2e4-0000-4000-8000-${String(start + index).padStart(12, '0')}`
  );

const TERM = {
  id: TERM_ID,
  name: 'Batch I',
  startDate: '2026-08-01',
  endDate: '2026-12-15',
  isAutoCreated: false,
};

function enrollment(kidId: string, classSessionId = CLASS_A) {
  return {
    id: `e-${kidId}`,
    termId: TERM_ID,
    classSessionId,
    kidId,
    status: 'enrolled',
    kid: { id: kidId, name: `Kid ${kidId.slice(-4)}`, nickName: null },
    term: { id: TERM_ID, name: TERM.name },
    classSession: { id: classSessionId, name: 'Kelas' },
  };
}

const INPUT = {
  termId: TERM_ID,
  classSessionId: CLASS_A,
  yearMonth: '2026-10',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.store = createMonthlyReportStore();
  mocks.getTermById.mockResolvedValue(TERM);
  // Mirror the real query: the enrollment boundary applies the class filter.
  mocks.getKidsEnrollments.mockImplementation(
    async ({ classSessionId }: { classSessionId?: string }) =>
      classSessionId ? [enrollment(kidIds(10, 1)[0], classSessionId)] : []
  );
  mocks.getObservationCountsByKidForMonth.mockResolvedValue({
    dcrCount: 5,
    observationCountByKidId: {},
  });
});

describe('class monthly overview integration', () => {
  it('scopes children to the selected term and class', async () => {
    const [kidA, kidB] = kidIds(10, 2);
    // Mirror the real repo: the class filter is applied at the query.
    mocks.getKidsEnrollments.mockImplementation(
      async ({ classSessionId }: { classSessionId?: string }) =>
        [enrollment(kidA, CLASS_A), enrollment(kidB, CLASS_B)].filter(
          (row) => row.classSessionId === classSessionId
        )
    );

    const overview = await getClassMonthlyReportOverview(INPUT);

    expect(mocks.getKidsEnrollments).toHaveBeenCalledWith({
      termId: TERM_ID,
      classSessionId: CLASS_A,
    });
    // The class-B child is not part of this class's overview.
    expect(overview.kids.map((kid) => kid.kidId)).toEqual([kidA]);
  });

  it('represents every enrolled child exactly once', async () => {
    const ids = kidIds(10, 20);
    mocks.getKidsEnrollments.mockResolvedValue(ids.map((id) => enrollment(id)));
    mocks.getObservationCountsByKidForMonth.mockResolvedValue({
      dcrCount: 5,
      observationCountByKidId: Object.fromEntries(ids.map((id) => [id, 3])),
    });

    const overview = await getClassMonthlyReportOverview(INPUT);

    expect(overview.kids).toHaveLength(20);
    expect(new Set(overview.kids.map((kid) => kid.kidId)).size).toBe(20);
  });

  it('matches each child to their own report and reports the edit flag', async () => {
    const [kidA, kidB, kidC] = kidIds(10, 3);
    mocks.getKidsEnrollments.mockResolvedValue(
      [kidA, kidB, kidC].map((id) => enrollment(id))
    );
    mocks.getObservationCountsByKidForMonth.mockResolvedValue({
      dcrCount: 5,
      observationCountByKidId: { [kidA]: 3, [kidB]: 2, [kidC]: 1 },
    });
    await mocks.store.createMonthlyReport({
      kidId: kidA,
      termId: TERM_ID,
      yearMonth: '2026-10',
      narrative: 'A',
      isEdited: true,
    });
    await mocks.store.createMonthlyReport({
      kidId: kidB,
      termId: TERM_ID,
      yearMonth: '2026-10',
      narrative: 'B',
    });
    await mocks.store.updateMonthlyReport({
      reportId: mocks.store.rows[1].id,
      values: { reportStatus: MONTHLY_REPORT_STATUS.SENT },
    });

    const overview = await getClassMonthlyReportOverview(INPUT);

    expect(overview.kids).toMatchObject([
      {
        kidId: kidA,
        reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
        isEdited: true,
      },
      {
        kidId: kidB,
        reportStatus: MONTHLY_REPORT_STATUS.SENT,
        isEdited: false,
      },
      { kidId: kidC, reportStatus: null, isEdited: false },
    ]);
  });

  it('never matches a report from another month or term', async () => {
    const [kidA] = kidIds(10, 1);
    mocks.getKidsEnrollments.mockResolvedValue([enrollment(kidA)]);
    mocks.getObservationCountsByKidForMonth.mockResolvedValue({
      dcrCount: 5,
      observationCountByKidId: { [kidA]: 1 },
    });
    // Same child, wrong month and wrong term.
    await mocks.store.createMonthlyReport({
      kidId: kidA,
      termId: TERM_ID,
      yearMonth: '2026-09',
      narrative: 'september',
    });
    await mocks.store.createMonthlyReport({
      kidId: kidA,
      termId: 'b3c1d2e4-0000-4000-8000-000000000099',
      yearMonth: '2026-10',
      narrative: 'other term',
    });

    const overview = await getClassMonthlyReportOverview(INPUT);

    expect(overview.kids[0].reportStatus).toBeNull();
  });

  it('summary counts are derived from the same rows as the child list', async () => {
    const ids = kidIds(10, 6);
    mocks.getKidsEnrollments.mockResolvedValue(ids.map((id) => enrollment(id)));
    // 3 ready (one with report), 3 not ready.
    mocks.getObservationCountsByKidForMonth.mockResolvedValue({
      dcrCount: 5,
      observationCountByKidId: { [ids[0]]: 2, [ids[1]]: 1, [ids[2]]: 1 },
    });
    await mocks.store.createMonthlyReport({
      kidId: ids[0],
      termId: TERM_ID,
      yearMonth: '2026-10',
      narrative: 'x',
    });

    const { kids, summary } = await getClassMonthlyReportOverview(INPUT);

    expect(summary).toEqual({
      totalKids: 6,
      withReport: 1,
      eligibleWithoutReport: 2,
      insufficientWithoutReport: 3,
    });
    expect(summary.withReport).toBe(
      kids.filter((kid) => kid.reportStatus).length
    );
    expect(summary.eligibleWithoutReport).toBe(
      kids.filter((kid) => !kid.reportStatus && kid.ready).length
    );
    expect(summary.insufficientWithoutReport).toBe(
      kids.filter((kid) => !kid.reportStatus && !kid.ready).length
    );
  });

  it('explains insufficient data with the right reason', async () => {
    const [noDcr, noObservation] = kidIds(10, 2);
    mocks.getKidsEnrollments.mockResolvedValue([
      enrollment(noDcr),
      enrollment(noObservation),
    ]);
    mocks.getObservationCountsByKidForMonth.mockImplementation(
      async ({ classSessionId }: { classSessionId: string }) =>
        classSessionId === CLASS_A
          ? { dcrCount: 4, observationCountByKidId: { [noObservation]: 0 } }
          : { dcrCount: 4, observationCountByKidId: {} }
    );

    const overview = await getClassMonthlyReportOverview(INPUT);

    // With DCRs present, a kid absent from the counts has zero observations.
    expect(overview.kids).toMatchObject([
      {
        kidId: noDcr,
        ready: false,
        readinessReason: 'Belum ada observasi untuk anak ini',
      },
      {
        kidId: noObservation,
        ready: false,
        readinessReason: 'Belum ada observasi untuk anak ini',
      },
    ]);
  });

  it('flags the reason class-wide when no daily report exists', async () => {
    const [kidA] = kidIds(10, 1);
    mocks.getKidsEnrollments.mockResolvedValue([enrollment(kidA)]);
    mocks.getObservationCountsByKidForMonth.mockResolvedValue({
      dcrCount: 0,
      observationCountByKidId: {},
    });

    const overview = await getClassMonthlyReportOverview(INPUT);

    expect(overview.kids[0]).toMatchObject({
      ready: false,
      readinessReason: 'Belum ada laporan harian di bulan ini',
    });
  });

  it('does not touch a sent report when new observations arrive later', async () => {
    const [kidA] = kidIds(10, 1);
    mocks.getKidsEnrollments.mockResolvedValue([enrollment(kidA)]);
    mocks.getObservationCountsByKidForMonth.mockResolvedValue({
      dcrCount: 5,
      observationCountByKidId: { [kidA]: 2 },
    });
    await mocks.store.createMonthlyReport({
      kidId: kidA,
      termId: TERM_ID,
      yearMonth: '2026-10',
      narrative: 'laporan terkirim',
    });
    await mocks.store.updateMonthlyReport({
      reportId: mocks.store.rows[0].id,
      values: { reportStatus: MONTHLY_REPORT_STATUS.SENT },
    });
    const before = { ...mocks.store.rows[0] };

    // Later observations land (counts change) and the overview is re-read.
    mocks.getObservationCountsByKidForMonth.mockResolvedValue({
      dcrCount: 12,
      observationCountByKidId: { [kidA]: 9 },
    });
    const overview = await getClassMonthlyReportOverview(INPUT);

    expect(overview.kids[0]).toMatchObject({
      ready: true,
      reportStatus: MONTHLY_REPORT_STATUS.SENT,
    });
    expect(mocks.store.rows[0]).toEqual(before);
  });

  it('returns an empty, non-error overview for a class with no children', async () => {
    mocks.getKidsEnrollments.mockResolvedValue([]);

    const overview = await getClassMonthlyReportOverview(INPUT);

    expect(overview.kids).toEqual([]);
    expect(overview.summary.totalKids).toBe(0);
  });

  it('refuses a month outside the selected term', async () => {
    mocks.getKidsEnrollments.mockResolvedValue([]);

    await expect(
      getClassMonthlyReportOverview({ ...INPUT, yearMonth: '2027-03' })
    ).rejects.toMatchObject({
      publicMessage: 'Batch ini tidak mencakup bulan yang dipilih',
    });
  });
});
