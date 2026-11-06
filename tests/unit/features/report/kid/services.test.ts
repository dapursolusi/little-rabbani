import * as kidReportService from '@/features/report/kid/services';
import { MonthlyReportOutput } from '@/features/report/kid/ai/output.schema';
import {
  MONTHLY_REPORT_STATUS,
  MonthlyReportStatus,
} from '@/features/report/constants';
import {
  ReportAlreadySentError,
  ReportNotFoundError,
} from '@/lib/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Collaborator boundaries only — repo + AI generation are mocked; the service
// layer's branching logic stays real.
const mocks = vi.hoisted(() => ({
  findMonthlyReportRow: vi.fn(),
  createMonthlyReport: vi.fn(),
  updateMonthlyReportNarrative: vi.fn(),
  aggregateMonthlyKidReportData: vi.fn(),
  generateMonthlyReportDraft: vi.fn(),
}));

vi.mock('@/features/report/kid/repositories', () => ({
  findMonthlyReportRow: mocks.findMonthlyReportRow,
  createMonthlyReport: mocks.createMonthlyReport,
  updateMonthlyReportNarrative: mocks.updateMonthlyReportNarrative,
}));

vi.mock('@/features/report/month/services', () => ({
  aggregateMonthlyKidReportData: mocks.aggregateMonthlyKidReportData,
}));

vi.mock('@/features/report/kid/ai/generate', () => ({
  generateMonthlyReportDraft: mocks.generateMonthlyReportDraft,
}));

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

    await expect(kidReportService.generateMonthlyReport(PARAMS)).rejects.toThrow(
      'Failed to generate text from LLM'
    );

    expect(mocks.createMonthlyReport).not.toHaveBeenCalled();
    expect(mocks.updateMonthlyReportNarrative).not.toHaveBeenCalled();
  });

  it('regeneration overwrites the existing draft via upsert', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue(ROW);
    mocks.createMonthlyReport.mockResolvedValue(ROW);

    const result = await kidReportService.generateMonthlyReport(PARAMS);

    // Single upsert path — no separate update call.
    expect(mocks.createMonthlyReport).toHaveBeenCalledWith(
      expect.objectContaining({ narrative: expect.stringContaining(AI_DRAFT.wellbeing) })
    );
    expect(mocks.updateMonthlyReportNarrative).not.toHaveBeenCalled();
    expect(result.narrative).toContain('Rekomendasi di rumah:');
  });

  it('regeneration rejects and preserves existing content when report is sent', async () => {
    mocks.findMonthlyReportRow.mockResolvedValue({
      ...ROW,
      reportStatus: MONTHLY_REPORT_STATUS.SENT,
    });

    await expect(kidReportService.generateMonthlyReport(PARAMS)).rejects.toThrow(
      ReportAlreadySentError
    );

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
