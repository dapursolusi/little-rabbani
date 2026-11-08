import {
  generateMonthlyReport,
  reviewMonthlyReport,
  saveMonthlyReportNarrative,
  sendMonthlyReport,
} from '@/features/report/kid/actions';
import * as kidReportService from '@/features/report/kid/services';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  generate: vi.fn(),
  save: vi.fn(),
  review: vi.fn(),
  send: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: () => new Headers() }));
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
// Service layer is the collaborator boundary — auth must be enforced above it.
vi.mock('@/features/report/kid/services', () => ({
  generateMonthlyReport: mocks.generate,
  saveMonthlyReportNarrative: mocks.save,
  markMonthlyReportReviewed: mocks.review,
  markMonthlyReportSent: mocks.send,
}));

const PARAMS = {
  kidId: 'b3c1d2e4-0000-4000-8000-000000000001',
  termId: 'b3c1d2e4-0000-4000-8000-000000000002',
  yearMonth: '2026-10',
};

const ROW = {
  id: 'r1',
  narrative: 'draft',
  reportStatus: 'draft',
  isEdited: false,
  reviewedAt: null,
  sentAt: null,
  sentBy: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({
    user: { id: 'user-1', role: 'owner' },
  });
  mocks.generate.mockResolvedValue({ narrative: 'draft', aiDraft: {} });
  mocks.save.mockResolvedValue(ROW);
  mocks.review.mockResolvedValue({ ...ROW, reportStatus: 'reviewed' });
  mocks.send.mockResolvedValue({ ...ROW, reportStatus: 'sent' });
});

const actions = [
  ['generateMonthlyReport', () => generateMonthlyReport(PARAMS)],
  [
    'saveMonthlyReportNarrative',
    () => saveMonthlyReportNarrative({ ...PARAMS, narrative: 'x' }),
  ],
  ['reviewMonthlyReport', () => reviewMonthlyReport(PARAMS)],
  ['sendMonthlyReport', () => sendMonthlyReport(PARAMS)],
] as const;

describe('monthly report actions — server-side authorization', () => {
  it.each(actions)(
    '%s rejects an unauthenticated caller before reaching the service',
    async (_name, call) => {
      mocks.getSession.mockResolvedValue(null);

      const result = await call();

      expect(result).toEqual({
        success: false,
        message: 'Anda harus masuk untuk mengubah laporan',
      });
      expect(kidReportService.generateMonthlyReport).not.toHaveBeenCalled();
      expect(
        kidReportService.saveMonthlyReportNarrative
      ).not.toHaveBeenCalled();
      expect(kidReportService.markMonthlyReportReviewed).not.toHaveBeenCalled();
      expect(kidReportService.markMonthlyReportSent).not.toHaveBeenCalled();
    }
  );
});

describe('monthly report actions — owner-only', () => {
  it.each(actions)(
    '%s rejects an authenticated teacher before reaching the service',
    async (_name, call) => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'teacher-1', role: 'teacher' },
      });

      const result = await call();

      expect(result).toEqual({
        success: false,
        message: 'Akses ditolak. Hanya Owner yang dapat mengubah laporan.',
      });
      expect(kidReportService.generateMonthlyReport).not.toHaveBeenCalled();
      expect(
        kidReportService.saveMonthlyReportNarrative
      ).not.toHaveBeenCalled();
      expect(kidReportService.markMonthlyReportReviewed).not.toHaveBeenCalled();
      expect(kidReportService.markMonthlyReportSent).not.toHaveBeenCalled();
    }
  );
});

describe('sendMonthlyReport', () => {
  it('records the session user as sender — never a client-supplied id', async () => {
    await sendMonthlyReport({
      ...PARAMS,
      // A malicious caller smuggling an extra field.
      ...({ sentBy: 'someone-else' } as object),
    });

    expect(mocks.send).toHaveBeenCalledWith({
      ...PARAMS,
      sentBy: 'user-1',
    });
  });
});

describe('action result contract', () => {
  it('surfaces a service business error as a failed ActionResult', async () => {
    const { ReportNotReviewedError } = await import('@/lib/errors');
    mocks.send.mockRejectedValue(new ReportNotReviewedError());

    const result = await sendMonthlyReport(PARAMS);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe(
        'Laporan harus direview terlebih dahulu sebelum dikirim'
      );
    }
  });

  it('returns the saved report data on success', async () => {
    const result = await saveMonthlyReportNarrative({
      ...PARAMS,
      narrative: 'x',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(ROW);
    }
  });
});
