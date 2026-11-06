import {
  MONTHLY_REPORT_STATUS,
  MonthlyReportStatus,
} from '@/features/report/constants';
import { MonthlyReportOutput } from '@/features/report/kid/ai/output.schema';
import * as kidReportService from '@/features/report/kid/services';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FinalMonthUsesTermlyReportError,
  FutureMonthReportError,
  KidNoEligibleMonthsError,
  KidNoReportHistoryError,
  KidNotEnrolledError,
  ReportAlreadySentError,
  ReportNotFoundError,
} from '@/lib/errors';

// Collaborator boundaries only — repo + AI generation are mocked; the service
// layer's branching logic stays real.
const mocks = vi.hoisted(() => ({
  findMonthlyReportRow: vi.fn(),
  createMonthlyReport: vi.fn(),
  updateMonthlyReportNarrative: vi.fn(),
  aggregateMonthlyKidReportData: vi.fn(),
  generateMonthlyReportDraft: vi.fn(),
  resolveReportRange: vi.fn(),
  getKidEnrolledTerms: vi.fn(),
}));

vi.mock('@/features/report/kid/repositories', () => ({
  findMonthlyReportRow: mocks.findMonthlyReportRow,
  createMonthlyReport: mocks.createMonthlyReport,
  updateMonthlyReportNarrative: mocks.updateMonthlyReportNarrative,
}));

vi.mock('@/features/report/month/services', () => ({
  aggregateMonthlyKidReportData: mocks.aggregateMonthlyKidReportData,
  resolveReportRange: mocks.resolveReportRange,
}));

vi.mock('@/features/kid-enrollment/services', () => ({
  getKidEnrolledTerms: mocks.getKidEnrolledTerms,
  verifyKidEnrollment: vi.fn(),
}));

vi.mock('@/features/report/kid/ai/generate', () => ({
  generateMonthlyReportDraft: mocks.generateMonthlyReportDraft,
}));

// Pin "today" so reportable-month boundaries are deterministic.
vi.mock('@/utils/date', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/date')>();
  return { ...actual, getLocalDateString: () => '2026-11-06' };
});

const TERM = {
  id: 'b3c1d2e4-0000-4000-8000-000000000002',
  name: 'Term 1',
  startDate: '2026-08-01',
  endDate: '2026-12-15',
  isAutoCreated: false,
};

const RANGE = {
  classSessionId: 'SESSION1',
  term: TERM,
  startDate: '2026-10-01',
  endDate: '2026-10-31',
  isFinalMonth: false,
};

const PARAMS = {
  kidId: 'b3c1d2e4-0000-4000-8000-000000000001',
  termId: 'b3c1d2e4-0000-4000-8000-000000000002',
  yearMonth: '2026-10',
};

const AI_DRAFT: MonthlyReportOutput = {
  socialEmotional: 'Ananda menunjukkan empati.',
  wellbeing: 'Kesehatan baik.',
  highlights: ['Berani tampil depan'],
  homeRecommendations: ['Ajak bercerita'],
};

const ROW = {
  id: 'b3c1d2e4-0000-4000-8000-000000000003',
  narrative: 'old narrative',
  reportStatus: MONTHLY_REPORT_STATUS.GENERATED as MonthlyReportStatus,
};

beforeEach(() => {
  mocks.aggregateMonthlyKidReportData.mockResolvedValue({ child: {} });
  mocks.generateMonthlyReportDraft.mockResolvedValue(AI_DRAFT);
  mocks.createMonthlyReport.mockResolvedValue(ROW);
  mocks.updateMonthlyReportNarrative.mockResolvedValue(ROW);
  mocks.resolveReportRange.mockResolvedValue(RANGE);
  mocks.getKidEnrolledTerms.mockResolvedValue([TERM]);
});

describe('generateMonthlyReport (persistence lifecycle)', () => {
  it('inserts a new draft when no report exists', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(null);

    const result = await kidReportService.generateMonthlyReport(PARAMS);

    expect(mocks.createMonthlyReport).toHaveBeenCalledTimes(1);
    expect(mocks.createMonthlyReport).toHaveBeenCalledWith(
      expect.objectContaining({
        kidId: PARAMS.kidId,
        termId: PARAMS.termId,
        yearMonth: PARAMS.yearMonth,
      })
    );
    expect(mocks.updateMonthlyReportNarrative).not.toHaveBeenCalled();
    // Returned narrative is the persisted formatted draft.
    expect(result.narrative).toContain('Sorotan:');
    expect(result.narrative).toContain(AI_DRAFT.socialEmotional);
  });

  it('does not create a row when generation fails', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(null);
    mocks.generateMonthlyReportDraft.mockResolvedValue(null);

    await expect(
      kidReportService.generateMonthlyReport(PARAMS)
    ).rejects.toThrow('Failed to generate text from LLM');

    expect(mocks.createMonthlyReport).not.toHaveBeenCalled();
    expect(mocks.updateMonthlyReportNarrative).not.toHaveBeenCalled();
  });

  it('regeneration overwrites the existing draft via upsert', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(ROW);
    mocks.createMonthlyReport.mockResolvedValue(ROW);

    const result = await kidReportService.generateMonthlyReport(PARAMS);

    // Single upsert path — no separate update call.
    expect(mocks.createMonthlyReport).toHaveBeenCalledWith(
      expect.objectContaining({
        narrative: expect.stringContaining(AI_DRAFT.wellbeing),
      })
    );
    expect(mocks.updateMonthlyReportNarrative).not.toHaveBeenCalled();
    expect(result.narrative).toContain('Rekomendasi di rumah:');
  });

  it('regeneration rejects and preserves existing content when report is sent', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue({
      ...ROW,
      reportStatus: MONTHLY_REPORT_STATUS.SENT,
    });

    await expect(
      kidReportService.generateMonthlyReport(PARAMS)
    ).rejects.toThrow(ReportAlreadySentError);

    expect(mocks.updateMonthlyReportNarrative).not.toHaveBeenCalled();
    expect(mocks.createMonthlyReport).not.toHaveBeenCalled();
  });
});

describe('saveMonthlyReportNarrative', () => {
  it('updates the existing row — never duplicates', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(ROW);

    await kidReportService.saveMonthlyReportNarrative({
      ...PARAMS,
      narrative: 'edited text',
    });

    expect(mocks.updateMonthlyReportNarrative).toHaveBeenCalledWith({
      reportId: ROW.id,
      narrative: 'edited text',
      reportStatus: MONTHLY_REPORT_STATUS.EDITED,
    });
    expect(mocks.createMonthlyReport).not.toHaveBeenCalled();
  });

  it('rejects when no report exists', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(null);

    await expect(
      kidReportService.saveMonthlyReportNarrative({
        ...PARAMS,
        narrative: 'edited text',
      })
    ).rejects.toThrow(ReportNotFoundError);

    expect(mocks.updateMonthlyReportNarrative).not.toHaveBeenCalled();
  });

  it('rejects when report is sent', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue({
      ...ROW,
      reportStatus: MONTHLY_REPORT_STATUS.SENT,
    });

    await expect(
      kidReportService.saveMonthlyReportNarrative({
        ...PARAMS,
        narrative: 'edited text',
      })
    ).rejects.toThrow(ReportAlreadySentError);

    expect(mocks.updateMonthlyReportNarrative).not.toHaveBeenCalled();
  });
});

describe('month scoping', () => {
  it('forwards the month on every read — different months fetch different rows', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(ROW);

    await kidReportService.findMonthlyReportRow({
      ...PARAMS,
      yearMonth: '2026-10',
    });
    await kidReportService.findMonthlyReportRow({
      ...PARAMS,
      yearMonth: '2026-11',
    });

    expect(mocks.findMonthlyReportRow).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ yearMonth: '2026-10' })
    );
    expect(mocks.findMonthlyReportRow).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ yearMonth: '2026-11' })
    );
  });

  it('persists each generated draft under its own month', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(null);
    mocks.createMonthlyReport.mockResolvedValue(ROW);

    await kidReportService.generateMonthlyReport({
      ...PARAMS,
      yearMonth: '2026-11',
    });

    // November's generate must not touch October's row.
    expect(mocks.findMonthlyReportRow).toHaveBeenCalledWith(
      expect.objectContaining({ yearMonth: '2026-11' })
    );
    expect(mocks.createMonthlyReport).toHaveBeenCalledWith(
      expect.objectContaining({ yearMonth: '2026-11' })
    );
  });
});

describe('final-month enforcement', () => {
  const FINAL_RANGE = { ...RANGE, isFinalMonth: true };

  it('generation refuses the term final month — never calls the LLM or persists', async () => {
    mocks.resolveReportRange.mockResolvedValue(FINAL_RANGE);

    await expect(
      kidReportService.generateMonthlyReport(PARAMS)
    ).rejects.toThrow(FinalMonthUsesTermlyReportError);

    expect(mocks.generateMonthlyReportDraft).not.toHaveBeenCalled();
    expect(mocks.createMonthlyReport).not.toHaveBeenCalled();
    expect(mocks.updateMonthlyReportNarrative).not.toHaveBeenCalled();
  });

  it('persistence refuses the term final month — existing rows stay untouched', async () => {
    mocks.resolveReportRange.mockResolvedValue(FINAL_RANGE);
    mocks.findMonthlyReportRow.mockResolvedValue(ROW);

    await expect(
      kidReportService.saveMonthlyReportNarrative({
        ...PARAMS,
        narrative: 'edited text',
      })
    ).rejects.toThrow(FinalMonthUsesTermlyReportError);

    expect(mocks.updateMonthlyReportNarrative).not.toHaveBeenCalled();
    expect(mocks.createMonthlyReport).not.toHaveBeenCalled();
  });
});

describe('invalid kid/month/term combinations', () => {
  it('generation refuses a stale termId that does not resolve', async () => {
    mocks.resolveReportRange.mockResolvedValue(null);

    await expect(
      kidReportService.generateMonthlyReport(PARAMS)
    ).rejects.toThrow(KidNotEnrolledError);

    expect(mocks.generateMonthlyReportDraft).not.toHaveBeenCalled();
    expect(mocks.createMonthlyReport).not.toHaveBeenCalled();
  });

  it('persistence refuses a stale termId that does not resolve', async () => {
    mocks.resolveReportRange.mockResolvedValue(null);
    mocks.findMonthlyReportRow.mockResolvedValue(ROW);

    await expect(
      kidReportService.saveMonthlyReportNarrative({
        ...PARAMS,
        narrative: 'edited text',
      })
    ).rejects.toThrow(KidNotEnrolledError);

    expect(mocks.updateMonthlyReportNarrative).not.toHaveBeenCalled();
  });
});

describe('future month guard', () => {
  // The suite pins "today" to 2026-11-06.
  const FUTURE = { ...PARAMS, yearMonth: '2026-12' };

  it('generation refuses a month that has not started', async () => {
    await expect(
      kidReportService.generateMonthlyReport(FUTURE)
    ).rejects.toThrow(FutureMonthReportError);

    expect(mocks.resolveReportRange).not.toHaveBeenCalled();
    expect(mocks.generateMonthlyReportDraft).not.toHaveBeenCalled();
    expect(mocks.createMonthlyReport).not.toHaveBeenCalled();
  });

  it('persistence refuses a month that has not started', async () => {
    await expect(
      kidReportService.saveMonthlyReportNarrative({
        ...FUTURE,
        narrative: 'edited text',
      })
    ).rejects.toThrow(FutureMonthReportError);

    expect(mocks.updateMonthlyReportNarrative).not.toHaveBeenCalled();
  });

  it('allows the current month', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(null);

    await expect(
      kidReportService.generateMonthlyReport({
        ...PARAMS,
        yearMonth: '2026-11',
      })
    ).resolves.toBeDefined();
  });
});

describe('getKidMonthlyReportContext', () => {
  const [YEAR, MONTH] = [2026, 10];

  it('throws when the kid has no enrolled terms', async () => {
    mocks.getKidEnrolledTerms.mockResolvedValue([]);

    await expect(
      kidReportService.getKidMonthlyReportContext({
        kidId: PARAMS.kidId,
        yearMonth: '2026-10',
      })
    ).rejects.toThrow(KidNoEligibleMonthsError);
  });

  it('falls back to the latest reportable month when the requested month is invalid', async () => {
    const result = await kidReportService.getKidMonthlyReportContext({
      kidId: PARAMS.kidId,
      yearMonth: '2020-01',
    });

    // Term runs Aug–Dec; "today" is Nov 6, so December is not reportable yet.
    expect(result.selectedMonth).toBe('2026-11');
    expect(result.prevMonth).toBe('2026-10');
    expect(result.nextMonth).toBeNull();
  });

  it('excludes future months from the reportable list', async () => {
    const result = await kidReportService.getKidMonthlyReportContext({
      kidId: PARAMS.kidId,
      yearMonth: '2026-08',
    });

    expect(result.reportableMonths).toEqual([
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
  });

  it('redirects a requested future month back to the latest reportable month', async () => {
    const result = await kidReportService.getKidMonthlyReportContext({
      kidId: PARAMS.kidId,
      yearMonth: '2026-12',
      termId: TERM.id,
    });

    expect(result.selectedMonth).toBe('2026-11');
  });

  it('throws when no reportable month has started yet', async () => {
    mocks.getKidEnrolledTerms.mockResolvedValue([
      { ...TERM, startDate: '2027-01-01', endDate: '2027-04-30' },
    ]);

    await expect(
      kidReportService.getKidMonthlyReportContext({
        kidId: PARAMS.kidId,
        yearMonth: '2027-01',
      })
    ).rejects.toThrow(KidNoReportHistoryError);
  });

  it('disables previous navigation at the earliest eligible month', async () => {
    const result = await kidReportService.getKidMonthlyReportContext({
      kidId: PARAMS.kidId,
      yearMonth: '2026-08',
    });

    expect(result.prevMonth).toBeNull();
    expect(result.nextMonth).toBe('2026-09');
  });

  it('keeps a valid termId from the URL', async () => {
    const result = await kidReportService.getKidMonthlyReportContext({
      kidId: PARAMS.kidId,
      yearMonth: `${YEAR}-${String(MONTH).padStart(2, '0')}`,
      termId: TERM.id,
    });

    expect(result.selectedTerm.id).toBe(TERM.id);
  });

  it('replaces a stale termId with an eligible term', async () => {
    const result = await kidReportService.getKidMonthlyReportContext({
      kidId: PARAMS.kidId,
      yearMonth: '2026-10',
      termId: 'b3c1d2e4-0000-4000-8000-000000000099',
    });

    expect(result.selectedTerm.id).toBe(TERM.id);
  });

  it('exposes every enrolled term overlapping the month as selector options', async () => {
    const second = {
      ...TERM,
      id: 'b3c1d2e4-0000-4000-8000-000000000005',
      name: 'Term 2',
      startDate: '2026-10-16',
      endDate: '2027-01-31',
    };
    mocks.getKidEnrolledTerms.mockResolvedValue([TERM, second]);

    const result = await kidReportService.getKidMonthlyReportContext({
      kidId: PARAMS.kidId,
      yearMonth: '2026-10',
      termId: TERM.id,
    });

    expect(result.monthTerms.map((t) => t.id)).toEqual([TERM.id, second.id]);
  });

  it('reports isFinalMonth from the selected term, not the calendar month', async () => {
    mocks.resolveReportRange.mockResolvedValue({
      ...RANGE,
      isFinalMonth: true,
    });

    const result = await kidReportService.getKidMonthlyReportContext({
      kidId: PARAMS.kidId,
      yearMonth: '2026-10',
      termId: TERM.id,
    });

    expect(result.isFinalMonth).toBe(true);
  });

  it('gives each term its own final-month verdict when a month is shared', async () => {
    // Aug 2026 is Term 1's last month but Term 2's first month.
    const endingTerm = {
      ...TERM,
      id: 'b3c1d2e4-0000-4000-8000-000000000010',
      name: 'Term 1',
      startDate: '2026-06-01',
      endDate: '2026-08-15',
    };
    const startingTerm = {
      ...TERM,
      id: 'b3c1d2e4-0000-4000-8000-000000000011',
      name: 'Term 2',
      startDate: '2026-08-16',
      endDate: '2026-12-01',
    };
    mocks.getKidEnrolledTerms.mockResolvedValue([endingTerm, startingTerm]);

    // resolveReportRange reflects whichever term was selected.
    mocks.resolveReportRange.mockImplementation(
      async ({ termId }: { termId: string }) => ({
        ...RANGE,
        isFinalMonth: termId === endingTerm.id,
      })
    );

    const first = await kidReportService.getKidMonthlyReportContext({
      kidId: PARAMS.kidId,
      yearMonth: '2026-08',
      termId: endingTerm.id,
    });
    const second = await kidReportService.getKidMonthlyReportContext({
      kidId: PARAMS.kidId,
      yearMonth: '2026-08',
      termId: startingTerm.id,
    });

    expect(first.isFinalMonth).toBe(true);
    expect(second.isFinalMonth).toBe(false);
    // Both terms remain selectable for that month.
    expect(first.monthTerms.map((t) => t.id)).toEqual([
      endingTerm.id,
      startingTerm.id,
    ]);
  });
});
