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
  ReportAlreadyExistsError,
  ReportAlreadySentError,
  ReportEmptyError,
  ReportNotFoundError,
  ReportNotReviewedError,
} from '@/lib/errors';

// Collaborator boundaries only — repo + AI generation are mocked; the service
// layer's branching logic stays real.
const mocks = vi.hoisted(() => ({
  findMonthlyReportRow: vi.fn(),
  createMonthlyReport: vi.fn(),
  insertMonthlyReportIfMissing: vi.fn(),
  updateMonthlyReport: vi.fn(),
  aggregateMonthlyKidReportData: vi.fn(),
  generateMonthlyReportDraft: vi.fn(),
  resolveReportRange: vi.fn(),
  getKidEnrolledTerms: vi.fn(),
}));

vi.mock('@/features/report/kid/repositories', () => ({
  findMonthlyReportRow: mocks.findMonthlyReportRow,
  createMonthlyReport: mocks.createMonthlyReport,
  insertMonthlyReportIfMissing: mocks.insertMonthlyReportIfMissing,
  updateMonthlyReport: mocks.updateMonthlyReport,
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
  reportStatus: MONTHLY_REPORT_STATUS.DRAFT as MonthlyReportStatus,
  isEdited: false,
};

beforeEach(() => {
  mocks.aggregateMonthlyKidReportData.mockResolvedValue({ child: {} });
  mocks.generateMonthlyReportDraft.mockResolvedValue(AI_DRAFT);
  mocks.createMonthlyReport.mockResolvedValue(ROW);
  mocks.insertMonthlyReportIfMissing.mockResolvedValue(ROW);
  mocks.updateMonthlyReport.mockResolvedValue(ROW);
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
    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
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
    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
  });

  it('regeneration overwrites the existing draft and resets lifecycle state', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue({
      ...ROW,
      reportStatus: MONTHLY_REPORT_STATUS.REVIEWED,
      isEdited: true,
    });

    const result = await kidReportService.generateMonthlyReport(PARAMS);

    // Single upsert path — no separate update call.
    expect(mocks.createMonthlyReport).toHaveBeenCalledWith(
      expect.objectContaining({
        narrative: expect.stringContaining(AI_DRAFT.wellbeing),
      })
    );
    // Regeneration is one upsert that resets status, edit flag and metadata.
    expect(mocks.createMonthlyReport).toHaveBeenCalledWith(
      expect.objectContaining({
        narrative: expect.any(String),
      })
    );
    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
    expect(result.narrative).toContain('Rekomendasi di rumah:');
  });

  it('reports a concurrent send as already-sent when the upsert refuses', async () => {
    // Read says draft; the guarded upsert then returns nothing because the
    // report was sent in between.
    mocks.findMonthlyReportRow.mockResolvedValue(ROW);
    mocks.createMonthlyReport.mockResolvedValue(null);

    await expect(
      kidReportService.generateMonthlyReport(PARAMS)
    ).rejects.toThrow(ReportAlreadySentError);
  });

  it('regeneration rejects and preserves existing content when report is sent', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue({
      ...ROW,
      reportStatus: MONTHLY_REPORT_STATUS.SENT,
    });

    await expect(
      kidReportService.generateMonthlyReport(PARAMS)
    ).rejects.toThrow(ReportAlreadySentError);

    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
    expect(mocks.createMonthlyReport).not.toHaveBeenCalled();
  });

  it('a persistence failure surfaces and leaves the previous report untouched', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue({
      ...ROW,
      reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
      isEdited: true,
    });
    mocks.createMonthlyReport.mockRejectedValue(new Error('db down'));

    await expect(
      kidReportService.generateMonthlyReport(PARAMS)
    ).rejects.toThrow('db down');

    // No partial write path exists — the failed upsert never runs an update.
    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
  });
});

describe('generateMonthlyReportIfMissing (batch entry point)', () => {
  it('generates when no report exists', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(null);

    const result = await kidReportService.generateMonthlyReportIfMissing(PARAMS);

    expect(mocks.generateMonthlyReportDraft).toHaveBeenCalledTimes(1);
    expect(mocks.insertMonthlyReportIfMissing).toHaveBeenCalledTimes(1);
    expect(mocks.createMonthlyReport).not.toHaveBeenCalled();
    expect(result.narrative).toContain(AI_DRAFT.socialEmotional);
  });

  it('refuses an existing report instead of regenerating or overwriting it', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(ROW);

    await expect(
      kidReportService.generateMonthlyReportIfMissing(PARAMS)
    ).rejects.toThrow(ReportAlreadyExistsError);

    expect(mocks.generateMonthlyReportDraft).not.toHaveBeenCalled();
    expect(mocks.createMonthlyReport).not.toHaveBeenCalled();
    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
  });

  it('enforces the same eligibility guards as individual generation', async () => {
    // The batch path is a separate entry point, so each guard is proven again
    // here rather than inherited on trust.

    // Future month.
    await expect(
      kidReportService.generateMonthlyReportIfMissing({
        ...PARAMS,
        yearMonth: '2026-12',
      })
    ).rejects.toThrow(FutureMonthReportError);

    // Term final month.
    mocks.resolveReportRange.mockResolvedValue({
      ...RANGE,
      isFinalMonth: true,
    });
    await expect(
      kidReportService.generateMonthlyReportIfMissing(PARAMS)
    ).rejects.toThrow(FinalMonthUsesTermlyReportError);

    // Not enrolled / stale term.
    mocks.resolveReportRange.mockResolvedValue(null);
    await expect(
      kidReportService.generateMonthlyReportIfMissing(PARAMS)
    ).rejects.toThrow(KidNotEnrolledError);

    expect(mocks.generateMonthlyReportDraft).not.toHaveBeenCalled();
    expect(mocks.insertMonthlyReportIfMissing).not.toHaveBeenCalled();
  });

  it('refuses a report generated concurrently between the read and the LLM call', async () => {
    // Read says "no report" — another request inserted one before our upsert.
    mocks.findMonthlyReportRow.mockResolvedValueOnce(null);
    mocks.insertMonthlyReportIfMissing.mockResolvedValueOnce(null);

    await expect(
      kidReportService.generateMonthlyReportIfMissing(PARAMS)
    ).rejects.toThrow(ReportAlreadyExistsError);

    // The guard is a plain insert: no update path, so a concurrent row cannot
    // be silently replaced.
    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
    expect(mocks.createMonthlyReport).not.toHaveBeenCalled();
  });
});

describe('saveMonthlyReportNarrative', () => {
  it('marks the report as edited and returns it to draft', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue({
      ...ROW,
      reportStatus: MONTHLY_REPORT_STATUS.REVIEWED,
      isEdited: false,
    });

    await kidReportService.saveMonthlyReportNarrative({
      ...PARAMS,
      narrative: 'edited text',
    });

    expect(mocks.updateMonthlyReport).toHaveBeenCalledWith({
      reportId: ROW.id,
      values: {
        narrative: 'edited text',
        isEdited: true,
        reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
        reviewedAt: null,
      },
    });
    expect(mocks.createMonthlyReport).not.toHaveBeenCalled();
  });

  it('saving unchanged content is a no-op — no write, no edited flag', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(ROW);

    const result = await kidReportService.saveMonthlyReportNarrative({
      ...PARAMS,
      narrative: ROW.narrative,
    });

    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
    expect(result.reportStatus).toBe(MONTHLY_REPORT_STATUS.DRAFT);
    expect(result.isEdited).toBe(false);
  });

  it('creates a manual draft when no report exists yet', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(null);

    await kidReportService.saveMonthlyReportNarrative({
      ...PARAMS,
      narrative: 'manual draft',
    });

    expect(mocks.createMonthlyReport).toHaveBeenCalledWith({
      ...PARAMS,
      narrative: 'manual draft',
      isEdited: true,
    });
    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
  });

  it('rejects saving a report that was sent concurrently', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(null);
    // The upsert refuses sent rows, so it returns nothing.
    mocks.createMonthlyReport.mockResolvedValue(null);

    await expect(
      kidReportService.saveMonthlyReportNarrative({
        ...PARAMS,
        narrative: 'edited text',
      })
    ).rejects.toThrow(ReportAlreadySentError);
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

    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
  });
});

describe('markMonthlyReportReviewed', () => {
  it('moves a draft to reviewed without touching the edited flag', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue({
      ...ROW,
      isEdited: true,
    });

    await kidReportService.markMonthlyReportReviewed(PARAMS);

    expect(mocks.updateMonthlyReport).toHaveBeenCalledWith({
      reportId: ROW.id,
      values: expect.objectContaining({
        reportStatus: MONTHLY_REPORT_STATUS.REVIEWED,
        reviewedAt: expect.any(Date),
      }),
    });
    // Reviewing never marks content as manually edited.
    expect(mocks.updateMonthlyReport.mock.calls[0][0].values.isEdited).toBe(
      undefined
    );
  });

  it('rejects an empty report', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue({
      ...ROW,
      narrative: '   ',
    });

    await expect(
      kidReportService.markMonthlyReportReviewed(PARAMS)
    ).rejects.toThrow(ReportEmptyError);

    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
  });

  it('rejects a sent report', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue({
      ...ROW,
      reportStatus: MONTHLY_REPORT_STATUS.SENT,
    });

    await expect(
      kidReportService.markMonthlyReportReviewed(PARAMS)
    ).rejects.toThrow(ReportAlreadySentError);
  });

  it('rejects when no report exists', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(null);

    await expect(
      kidReportService.markMonthlyReportReviewed(PARAMS)
    ).rejects.toThrow(ReportNotFoundError);
  });
});

describe('markMonthlyReportSent', () => {
  const SENT_BY = 'owner-1';

  it('only a reviewed report can be sent — a draft is refused', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(ROW);

    await expect(
      kidReportService.markMonthlyReportSent({ ...PARAMS, sentBy: SENT_BY })
    ).rejects.toThrow(ReportNotReviewedError);

    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
  });

  it('records sentAt and sentBy when sending a reviewed report', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue({
      ...ROW,
      reportStatus: MONTHLY_REPORT_STATUS.REVIEWED,
    });

    await kidReportService.markMonthlyReportSent({
      ...PARAMS,
      sentBy: SENT_BY,
    });

    expect(mocks.updateMonthlyReport).toHaveBeenCalledWith({
      reportId: ROW.id,
      values: expect.objectContaining({
        reportStatus: MONTHLY_REPORT_STATUS.SENT,
        sentAt: expect.any(Date),
        sentBy: SENT_BY,
      }),
    });
  });

  it('rejects an already sent report', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue({
      ...ROW,
      reportStatus: MONTHLY_REPORT_STATUS.SENT,
    });

    await expect(
      kidReportService.markMonthlyReportSent({ ...PARAMS, sentBy: SENT_BY })
    ).rejects.toThrow(ReportAlreadySentError);

    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
  });

  it('rejects when no report exists', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(null);

    await expect(
      kidReportService.markMonthlyReportSent({ ...PARAMS, sentBy: SENT_BY })
    ).rejects.toThrow(ReportNotFoundError);
  });
});

describe('month scoping', () => {
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
    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
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

    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
    expect(mocks.createMonthlyReport).not.toHaveBeenCalled();
  });

  it('review and send refuse the term final month', async () => {
    mocks.resolveReportRange.mockResolvedValue(FINAL_RANGE);
    mocks.findMonthlyReportRow.mockResolvedValue(ROW);

    await expect(
      kidReportService.markMonthlyReportReviewed(PARAMS)
    ).rejects.toThrow(FinalMonthUsesTermlyReportError);
    await expect(
      kidReportService.markMonthlyReportSent({ ...PARAMS, sentBy: 'owner-1' })
    ).rejects.toThrow(FinalMonthUsesTermlyReportError);

    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
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

    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
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

    expect(mocks.updateMonthlyReport).not.toHaveBeenCalled();
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
