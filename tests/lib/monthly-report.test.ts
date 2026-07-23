import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  generateMonthlyReport,
  getActiveTerm,
  getEnrolledKids,
  getMonthOptions,
  getMonthlyReport,
  getMonthlyReportForKidMonth,
  markMonthlyReportFinal,
  unlockObservationsForReport,
  updateMonthlyReportNarrative,
} from '@/lib/actions/monthly-report';
import { requireOwner } from '@/lib/actions/utils';

// Mock requireOwner
vi.mock('@/lib/actions/utils', () => ({
  requireOwner: vi.fn(),
}));

// Mock AI module
const mockGenerateNarrative = vi.fn();
vi.mock('@/lib/ai', () => ({
  generateNarrative: (...args: unknown[]) => mockGenerateNarrative(...args),
  default: {
    generateNarrative: (...args: unknown[]) => mockGenerateNarrative(...args),
  },
  __esModule: true,
}));

// Mock the database
vi.mock('@/lib/db', () => {
  return {
    db: {
      query: {
        term: { findFirst: vi.fn() },
        kid: { findMany: vi.fn(), findFirst: vi.fn() },
        monthlyReportSnapshot: { findFirst: vi.fn(), findMany: vi.fn() },
        dailyReportSnapshot: { findMany: vi.fn() },
        observation: { findMany: vi.fn(), findFirst: vi.fn() },
        observationActivity: { findMany: vi.fn() },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(),
          })),
        })),
      })),
    },
  };
});

const { db } = await import('@/db');
const mockDb = db as unknown as {
  query: {
    term: { findFirst: ReturnType<typeof vi.fn> };
    kid: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
    monthlyReportSnapshot: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    dailyReportSnapshot: { findMany: ReturnType<typeof vi.fn> };
    observation: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
    observationActivity: { findMany: ReturnType<typeof vi.fn> };
  };
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

describe('Monthly Report - Server Actions', () => {
  const ownerUserId = 'owner-123';
  const mockAuth = { authorized: true as const, userId: ownerUserId };

  const termId = 'term-1';
  const kidId1 = 'kid-123';
  const month = '2025-06';
  const reportId = 'report-1';

  const mockTerm = {
    id: termId,
    name: 'Semester 1 2025',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    isActive: true,
  };

  const mockKid1 = { id: kidId1, name: 'Ahmad', guardianId: 'guardian-1' };

  beforeEach(() => {
    vi.resetAllMocks();
    (requireOwner as ReturnType<typeof vi.fn>).mockResolvedValue(mockAuth);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getActiveTerm', () => {
    it('returns the active term', async () => {
      mockDb.query.term.findFirst.mockResolvedValue(mockTerm);

      const result = await getActiveTerm();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Semester 1 2025');
        expect(result.data.isActive).toBe(true);
      }
    });

    it('returns error when no active term', async () => {
      mockDb.query.term.findFirst.mockResolvedValue(null);

      const result = await getActiveTerm();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Aktifkan term');
      }
    });
  });

  describe('getEnrolledKids', () => {
    it('returns enrolled kids for the term', async () => {
      mockDb.query.kid.findMany.mockResolvedValue([
        {
          ...mockKid1,
          guardian: { name: 'Ibu Siti' },
        },
      ]);

      const result = await getEnrolledKids(termId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('Ahmad');
      }
    });

    it('returns empty list if no enrolled kids', async () => {
      mockDb.query.kid.findMany.mockResolvedValue([]);

      const result = await getEnrolledKids(termId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe('getMonthOptions', () => {
    it('returns month options for the term date range', async () => {
      mockDb.query.term.findFirst.mockResolvedValue({
        startDate: '2025-01-15',
        endDate: '2025-03-20',
      });

      const result = await getMonthOptions(termId);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should cover Jan, Feb, Mar 2025
        expect(result.data.length).toBeGreaterThanOrEqual(3);
        expect(result.data[0].value).toBe('2025-01');
        expect(result.data[0].label).toBe('2025-01');
      }
    });
  });

  describe('generateMonthlyReport', () => {
    beforeEach(() => {
      // Mock kid exists
      mockDb.query.kid.findFirst.mockResolvedValue(mockKid1);

      // Mock no existing report
      mockDb.query.monthlyReportSnapshot.findFirst.mockResolvedValue(null);

      // Mock observations in month (first call: getObservationDaysInMonth)
      mockDb.query.observation.findMany
        .mockResolvedValueOnce([
          { date: '2025-06-03' },
          { date: '2025-06-05' },
          { date: '2025-06-10' },
        ])
        // Second call: computeMonthlyStats
        .mockResolvedValueOnce([
          {
            id: 'obs-1',
            date: '2025-06-03',
            mood: 4,
            appetite: 'good',
            presence: 'present_full',
          },
          {
            id: 'obs-2',
            date: '2025-06-05',
            mood: 5,
            appetite: 'good',
            presence: 'present_full',
          },
          {
            id: 'obs-3',
            date: '2025-06-10',
            mood: 4,
            appetite: 'moderate',
            presence: 'present_full',
          },
        ])
        // Third call: locked observations
        .mockResolvedValueOnce([
          { id: 'obs-1' },
          { id: 'obs-2' },
          { id: 'obs-3' },
        ]);

      // Mock daily report narratives
      mockDb.query.dailyReportSnapshot.findMany.mockResolvedValue([
        {
          narrativeFinal: 'Ananda Ahmad bersemangat hari ini.',
          narrativeAiDraft: null,
          date: '2025-06-03',
        },
        {
          narrativeFinal: 'Ananda Ahmad belajar dengan baik.',
          narrativeAiDraft: null,
          date: '2025-06-05',
        },
      ]);

      // Mock observation activities
      mockDb.query.observationActivity.findMany.mockResolvedValue([
        {
          participated: 'yes',
          dcrActivity: {
            activity: { name: 'Mewarnai' },
            activityNameOther: null,
          },
        },
        {
          participated: 'yes',
          dcrActivity: {
            activity: { name: 'Mewarnai' },
            activityNameOther: null,
          },
        },
        {
          participated: 'yes',
          dcrActivity: {
            activity: { name: 'Menggambar' },
            activityNameOther: null,
          },
        },
      ]);
    });

    it('generates monthly report with stats and AI narrative', async () => {
      // Mock AI generation
      mockGenerateNarrative.mockResolvedValue(
        'Bu/Pak, Ananda Ahmad menunjukkan perkembangan yang baik selama bulan ini...'
      );

      // Mock insert result
      mockDb.insert.mockReturnValue({
        values: () => ({
          returning: vi.fn().mockResolvedValue([{ id: reportId }]),
        }),
      });

      const result = await generateMonthlyReport(kidId1, termId, month);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reportId).toBe(reportId);
        expect(result.data.status).toBe('draft');

        // Verify stats
        const stats = result.data.stats;
        expect(stats.attendancePercent).toBe(100); // 3/3 present = 100%
        expect(stats.totalSchoolDays).toBe(3);
        expect(stats.daysPresent).toBe(3);

        // Mood distribution: mood 4 appears 2 times, mood 5 appears 1 time
        expect(stats.moodDistribution[4]).toBe(2);
        expect(stats.moodDistribution[5]).toBe(1);

        // Appetite distribution: good appears 2 times, moderate 1 time
        expect(stats.appetiteDistribution.good).toBe(2);
        expect(stats.appetiteDistribution.moderate).toBe(1);

        // Activity participation: Mewarnai 2 times, Menggambar 1 time
        expect(stats.activityParticipation.Mewarnai).toBe(2);
        expect(stats.activityParticipation.Menggambar).toBe(1);
      }
    });

    it('returns error for concurrent generation', async () => {
      // Mock existing report with draft status (generation in progress)
      mockDb.query.monthlyReportSnapshot.findFirst.mockResolvedValue({
        id: reportId,
        status: 'draft',
        generatedAt: new Date(),
      });

      const result = await generateMonthlyReport(kidId1, termId, month);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('sedang berlangsung');
      }
    });

    it('handles AI failure with structured-only fallback', async () => {
      // Mock AI generation failure
      mockGenerateNarrative.mockRejectedValue(new Error('AI service down'));

      // Mock insert result
      mockDb.insert.mockReturnValue({
        values: () => ({
          returning: vi.fn().mockResolvedValue([{ id: reportId }]),
        }),
      });

      const result = await generateMonthlyReport(kidId1, termId, month);

      expect(result.success).toBe(true);
      if (result.success) {
        // Stats should still be present
        expect(result.data.stats.attendancePercent).toBe(100);
        // Narrative should be empty (structured-only fallback)
        expect(result.data.narrativeAiDraft).toBe('');
      }
    });

    it('returns error when no daily reports exist for the month', async () => {
      // Mock no observations
      mockDb.query.observation.findMany.mockReset();
      mockDb.query.observation.findMany.mockResolvedValue([]);
      mockDb.query.dailyReportSnapshot.findMany.mockResolvedValue([]);
      mockDb.query.observationActivity.findMany.mockResolvedValue([]);

      const result = await generateMonthlyReport(kidId1, termId, month);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Tidak ada data');
      }
    });

    it('passes concatenated daily narratives and reportType: monthly to AI (VAL-MONTHLY-003)', async () => {
      // Mock AI generation
      mockGenerateNarrative.mockResolvedValue(
        'Bu/Pak, selama bulan ini Ananda Ahmad menunjukkan perkembangan yang baik...'
      );

      // Mock insert result
      mockDb.insert.mockReturnValue({
        values: () => ({
          returning: vi.fn().mockResolvedValue([{ id: reportId }]),
        }),
      });

      await generateMonthlyReport(kidId1, termId, month);

      // Verify generateNarrative was called with the right arguments
      expect(mockGenerateNarrative).toHaveBeenCalledTimes(1);
      const callArgs = mockGenerateNarrative.mock.calls[0][0];

      // Should include reportType: 'monthly'
      expect(callArgs.reportType).toBe('monthly');

      // Should include concatenated daily narratives
      expect(callArgs.notes).toContain('[2025-06-03]');
      expect(callArgs.notes).toContain('Ananda Ahmad bersemangat hari ini.');
      expect(callArgs.notes).toContain('[2025-06-05]');
      expect(callArgs.notes).toContain('Ananda Ahmad belajar dengan baik.');

      // Should NOT use the old summary string
      expect(callArgs.notes).not.toContain('Ringkasan bulanan');
    });
  });

  describe('updateMonthlyReportNarrative', () => {
    it('updates narrative and keeps draft status', async () => {
      mockDb.query.monthlyReportSnapshot.findFirst.mockResolvedValue({
        id: reportId,
        status: 'draft',
      });

      mockDb.update.mockReturnValue({
        set: () => ({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: reportId,
                status: 'draft',
                narrativeFinal: 'Narasi yang diedit...',
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      });

      const result = await updateMonthlyReportNarrative(
        reportId,
        'Narasi yang diedit...'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('draft');
      }
    });

    it('transitions from final to stale on edit', async () => {
      mockDb.query.monthlyReportSnapshot.findFirst.mockResolvedValue({
        id: reportId,
        status: 'final',
      });

      mockDb.update.mockReturnValue({
        set: () => ({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: reportId,
                status: 'stale',
                narrativeFinal: 'Edited narrative',
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      });

      const result = await updateMonthlyReportNarrative(
        reportId,
        'Edited narrative'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('stale');
      }
    });

    it('returns error when report not found', async () => {
      mockDb.query.monthlyReportSnapshot.findFirst.mockResolvedValue(null);

      const result = await updateMonthlyReportNarrative(reportId, 'Narasi');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Laporan');
      }
    });
  });

  describe('markMonthlyReportFinal', () => {
    it('marks draft report as final', async () => {
      mockDb.query.monthlyReportSnapshot.findFirst.mockResolvedValue({
        id: reportId,
        status: 'draft',
        narrativeFinal: null,
      });

      mockDb.update.mockReturnValue({
        set: () => ({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: reportId,
                status: 'final',
              },
            ]),
          }),
        }),
      });

      const result = await markMonthlyReportFinal(reportId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('final');
      }
    });

    it('returns error when already final', async () => {
      mockDb.query.monthlyReportSnapshot.findFirst.mockResolvedValue({
        id: reportId,
        status: 'final',
        narrativeFinal: 'Some narrative',
      });

      const result = await markMonthlyReportFinal(reportId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('sudah difinalisasi');
      }
    });
  });

  describe('unlockObservationsForReport', () => {
    it('clears locked observations and marks stale', async () => {
      mockDb.query.monthlyReportSnapshot.findFirst.mockResolvedValue({
        id: reportId,
        status: 'final',
      });

      mockDb.update.mockReturnValue({
        set: () => ({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: reportId,
                status: 'stale',
              },
            ]),
          }),
        }),
      });

      const result = await unlockObservationsForReport(reportId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('stale');
      }
    });

    it('returns error when report not found', async () => {
      mockDb.query.monthlyReportSnapshot.findFirst.mockResolvedValue(null);

      const result = await unlockObservationsForReport(reportId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Laporan');
      }
    });
  });

  describe('getMonthlyReportForKidMonth', () => {
    it('returns report for existing kid+month combination', async () => {
      mockDb.query.monthlyReportSnapshot.findFirst.mockResolvedValue({
        id: reportId,
        kidId: kidId1,
        month,
        status: 'draft',
        narrativeAiDraft: 'Narasi',
        narrativeFinal: null,
        statsJson: { attendancePercent: 100 },
        kid: { id: kidId1, name: 'Ahmad' },
        term: { id: termId, name: 'Semester 1 2025' },
      });

      const result = await getMonthlyReportForKidMonth(kidId1, month);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toBeNull();
        expect(result.data?.status).toBe('draft');
      }
    });

    it('returns null when no report exists', async () => {
      mockDb.query.monthlyReportSnapshot.findFirst.mockResolvedValue(null);

      const result = await getMonthlyReportForKidMonth(kidId1, month);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('getMonthlyReport', () => {
    it('returns report by ID', async () => {
      mockDb.query.monthlyReportSnapshot.findFirst.mockResolvedValue({
        id: reportId,
        kidId: kidId1,
        month,
        status: 'draft',
        narrativeAiDraft: 'Narasi',
        narrativeFinal: null,
        statsJson: { attendancePercent: 100 },
        kid: { id: kidId1, name: 'Ahmad' },
        term: { id: termId, name: 'Semester 1 2025' },
      });

      const result = await getMonthlyReport(reportId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(reportId);
        expect(result.data.kid?.name).toBe('Ahmad');
      }
    });
  });
});
