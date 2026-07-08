import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  generateQuarterlyReport,
  getEnrolledKidsForTerm,
  getQuarterlyReport,
  getQuarterlyReportById,
  getTerms,
  markQuarterlyReportFinal,
  updateQuarterlySections,
} from '@/lib/actions/quarterly-report';
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
        term: { findFirst: vi.fn(), findMany: vi.fn() },
        termSession: { findMany: vi.fn(), findFirst: vi.fn() },
        kid: { findMany: vi.fn(), findFirst: vi.fn() },
        quarterlyReportSnapshot: { findFirst: vi.fn(), findMany: vi.fn() },
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

const { db } = await import('@/lib/db');
const mockDb = db as unknown as {
  query: {
    term: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    termSession: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
    kid: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
    quarterlyReportSnapshot: {
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

describe('Quarterly Report - Server Actions', () => {
  const ownerUserId = 'owner-123';
  const mockAuth = { authorized: true as const, userId: ownerUserId };

  const termId = 'term-1';
  const termId2 = 'term-2';
  const kidId1 = 'kid-123';
  const reportId = 'report-1';
  const previousReportId = 'prev-report-1';

  const mockTerm = {
    id: termId,
    name: 'Semester 1 2025',
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    isActive: true,
  };

  const mockTerm2 = {
    id: termId2,
    name: 'Semester 2 2025',
    startDate: '2025-07-01',
    endDate: '2025-12-31',
    isActive: false,
  };

  const mockKid1 = {
    id: kidId1,
    name: 'Ahmad',
    guardianId: 'guardian-1',
    status: 'enrolled',
    enrolledTermId: termId,
  };

  const mockSession1 = { id: 'session-1', date: '2025-01-06' };
  const mockSession2 = { id: 'session-2', date: '2025-01-08' };
  const mockSession3 = { id: 'session-3', date: '2025-01-13' };

  beforeEach(() => {
    vi.resetAllMocks();
    (requireOwner as ReturnType<typeof vi.fn>).mockResolvedValue(mockAuth);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getTerms', () => {
    it('returns all terms', async () => {
      mockDb.query.term.findMany.mockResolvedValue([mockTerm, mockTerm2]);

      const result = await getTerms();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].name).toBe('Semester 1 2025');
      }
    });

    it('returns empty list if no terms', async () => {
      mockDb.query.term.findMany.mockResolvedValue([]);

      const result = await getTerms();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe('getEnrolledKidsForTerm', () => {
    it('returns enrolled kids for a term', async () => {
      mockDb.query.kid.findMany.mockResolvedValue([
        {
          ...mockKid1,
          guardian: { name: 'Ibu Siti' },
        },
      ]);

      const result = await getEnrolledKidsForTerm(termId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('Ahmad');
      }
    });
  });

  describe('generateQuarterlyReport', () => {
    beforeEach(() => {
      // Mock kid exists
      mockDb.query.kid.findFirst.mockResolvedValue(mockKid1);

      // Mock no existing report
      mockDb.query.quarterlyReportSnapshot.findFirst.mockResolvedValue(null);

      // Mock sessions in term
      mockDb.query.termSession.findMany.mockResolvedValue([
        mockSession1,
        mockSession2,
        mockSession3,
      ]);

      // Mock term info
      mockDb.query.term.findFirst.mockResolvedValue(mockTerm);

      // Mock observations
      mockDb.query.observation.findMany.mockResolvedValue([
        { id: 'obs-1', mood: 4, appetite: 'good', presence: 'present_full' },
        { id: 'obs-2', mood: 5, appetite: 'good', presence: 'present_full' },
        { id: 'obs-3', mood: 4, appetite: 'moderate', presence: 'late' },
      ]);

      // Mock daily report narratives
      mockDb.query.dailyReportSnapshot.findMany.mockResolvedValue([
        {
          narrativeFinal: 'Ananda Ahmad bersemangat hari ini.',
          narrativeAiDraft: null,
          session: { date: '2025-01-06' },
        },
        {
          narrativeFinal: 'Ananda Ahmad belajar dengan baik.',
          narrativeAiDraft: null,
          session: { date: '2025-01-08' },
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

    it('generates quarterly report with stats and AI sections for first term', async () => {
      // Mock AI generation returning parsed sections
      mockGenerateNarrative.mockResolvedValue(
        '===PERUBAHAN===\nAnanda Ahmad menunjukkan perubahan positif dalam partisipasi kegiatan.\n\n===PENINGKATAN===\nKehadiran Ahmad sangat baik dengan partisipasi aktif dalam mewarnai dan menggambar.\n\n===REKOMENDASI===\nDisarankan untuk terus mendukung minat Ahmad dalam kegiatan seni.'
      );

      // Mock insert result
      mockDb.insert.mockReturnValue({
        values: () => ({
          returning: vi.fn().mockResolvedValue([{ id: reportId }]),
        }),
      });

      const result = await generateQuarterlyReport(kidId1, termId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reportId).toBe(reportId);
        expect(result.data.status).toBe('draft');

        // Verify stats
        const stats = result.data.stats;
        expect(stats.attendancePercent).toBe(100); // 3/3 present (late counts as present)
        expect(stats.totalSchoolDays).toBe(3);
        expect(stats.daysPresent).toBe(3);

        // Mood distribution: mood 4 appears 2 times, mood 5 appears 1 time
        expect(stats.moodDistribution[4]).toBe(2);
        expect(stats.moodDistribution[5]).toBe(1);

        // Appetite: good appears 2 times, moderate 1 time
        expect(stats.appetiteDistribution.good).toBe(2);
        expect(stats.appetiteDistribution.moderate).toBe(1);

        // Verify sections were parsed
        expect(result.data.sections.changes).toContain('perubahan positif');
        expect(result.data.sections.improvements).toContain('Kehadiran');
        expect(result.data.sections.recommendations).toContain('Disarankan');

        // First term — no previousSnapshotId
        expect(result.data.previousSnapshotId).toBeNull();
      }
    });

    it('returns error when report already exists (draft)', async () => {
      // VAL-QUARTERLY-003: First-term generates without delta is tested by previousSnapshotId being null

      // Mock existing report with draft status
      mockDb.query.quarterlyReportSnapshot.findFirst.mockResolvedValue({
        id: reportId,
        status: 'draft',
      });

      const result = await generateQuarterlyReport(kidId1, termId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('sudah ada');
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

      const result = await generateQuarterlyReport(kidId1, termId);

      expect(result.success).toBe(true);
      if (result.success) {
        // Stats should still be present
        expect(result.data.stats.attendancePercent).toBe(100);
        // Sections should be empty (structured-only fallback)
        expect(result.data.sections.changes).toBe('');
        expect(result.data.sections.improvements).toBe('');
        expect(result.data.sections.recommendations).toBe('');
      }
    });

    it('returns error when no daily reports exist for the term', async () => {
      // Mock no observations
      mockDb.query.observation.findMany.mockResolvedValue([]);
      mockDb.query.dailyReportSnapshot.findMany.mockResolvedValue([]);
      mockDb.query.observationActivity.findMany.mockResolvedValue([]);

      const result = await generateQuarterlyReport(kidId1, termId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Belum ada data');
      }
    });

    it('uses previous snapshot for delta when available', async () => {
      // VAL-QUARTERLY-002: PDF uses previous-term snapshot for delta

      // Mock existing previous snapshot
      mockDb.query.quarterlyReportSnapshot.findFirst
        .mockResolvedValueOnce(null) // First call: no existing report for this term
        .mockResolvedValueOnce({
          // Second call: find previous snapshot
          id: previousReportId,
          sectionsJson: {
            changes: 'Perubahan dari term sebelumnya',
            improvements: 'Peningkatan dari term sebelumnya',
            recommendations: 'Rekomendasi dari term sebelumnya',
          },
          status: 'final',
          termId: termId2,
          term: { name: 'Semester 2 2024' },
        });

      // Set kid to be enrolled in termId2
      mockDb.query.kid.findFirst.mockResolvedValue({
        ...mockKid1,
        enrolledTermId: termId2,
      });

      // Mock term info for termId2
      mockDb.query.term.findFirst.mockResolvedValue({
        id: termId2,
        name: 'Semester 2 2025',
        startDate: '2025-07-01',
        endDate: '2025-12-31',
      });

      // Mock AI generation
      mockGenerateNarrative.mockResolvedValue(
        '===PERUBAHAN===\nDibandingkan semester lalu, Ahmad menunjukkan peningkatan dalam fokus.\n\n===PENINGKATAN===\nPartisipasi Ahmad meningkat signifikan.\n\n===REKOMENDASI===\nLanjutkan dukungan yang sudah diberikan.'
      );

      mockDb.insert.mockReturnValue({
        values: () => ({
          returning: vi.fn().mockResolvedValue([{ id: reportId }]),
        }),
      });

      const result = await generateQuarterlyReport(kidId1, termId2);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should have reference to previous snapshot
        expect(result.data.previousSnapshotId).toBe(previousReportId);

        // AI should have been called with the prompt containing delta context
        const aiCallArgs = mockGenerateNarrative.mock.calls[0][0];
        expect(aiCallArgs.notes).toContain('trivulanan');
      }
    });

    it('handles kid graduated mid-term scenario', async () => {
      // VAL-QUARTERLY-011: Mid-term graduation

      // Mock kid as alumni
      mockDb.query.kid.findFirst.mockResolvedValue({
        ...mockKid1,
        status: 'alumni',
      });

      // Mock observations (only 2 sessions have observations — mid-term graduation)
      mockDb.query.observation.findMany
        .mockResolvedValueOnce([
          // First call: get observations by kidId (for session filtering)
          { sessionId: 'session-1' },
          { sessionId: 'session-2' },
        ])
        .mockResolvedValueOnce([
          // Second call: get observations for stats
          { id: 'obs-1', mood: 4, appetite: 'good', presence: 'present_full' },
          { id: 'obs-2', mood: 5, appetite: 'good', presence: 'present_full' },
        ]);

      // Only 2 sessions pass through (instead of 3)
      mockDb.query.termSession.findMany.mockResolvedValue([
        mockSession1,
        mockSession2,
        mockSession3,
      ]);

      mockGenerateNarrative.mockResolvedValue(
        '===PERUBAHAN===\nPerubahan selama periode ini.\n\n===PENINGKATAN===\nPeningkatan selama periode ini.\n\n===REKOMENDASI===\nRekomendasi untuk ke depannya.'
      );

      mockDb.query.observationActivity.findMany.mockResolvedValue([]);
      mockDb.query.dailyReportSnapshot.findMany.mockResolvedValue([]);

      mockDb.insert.mockReturnValue({
        values: () => ({
          returning: vi.fn().mockResolvedValue([{ id: reportId }]),
        }),
      });

      const result = await generateQuarterlyReport(kidId1, termId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats.totalSchoolDays).toBe(2); // Only 2 sessions with data
        expect(result.data.stats.daysPresent).toBe(2);
      }
    });
  });

  describe('updateQuarterlySections', () => {
    it('updates sections and keeps draft status', async () => {
      mockDb.query.quarterlyReportSnapshot.findFirst.mockResolvedValue({
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
              },
            ]),
          }),
        }),
      });

      const result = await updateQuarterlySections(reportId, {
        changes: 'Perubahan yang diedit...',
        improvements: 'Peningkatan yang diedit...',
        recommendations: 'Rekomendasi yang diedit...',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('draft');
      }
    });

    it('transitions from final to stale on edit', async () => {
      mockDb.query.quarterlyReportSnapshot.findFirst.mockResolvedValue({
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

      const result = await updateQuarterlySections(reportId, {
        changes: 'Perubahan baru',
        improvements: 'Peningkatan baru',
        recommendations: 'Rekomendasi baru',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('stale');
      }
    });

    it('returns error when report not found', async () => {
      mockDb.query.quarterlyReportSnapshot.findFirst.mockResolvedValue(null);

      const result = await updateQuarterlySections(reportId, {
        changes: 'Test',
        improvements: 'Test',
        recommendations: 'Test',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Laporan');
      }
    });
  });

  describe('markQuarterlyReportFinal', () => {
    it('marks draft report as final', async () => {
      mockDb.query.quarterlyReportSnapshot.findFirst.mockResolvedValue({
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

      const result = await markQuarterlyReportFinal(reportId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('final');
      }
    });

    it('returns error when already final', async () => {
      mockDb.query.quarterlyReportSnapshot.findFirst.mockResolvedValue({
        id: reportId,
        status: 'final',
        narrativeFinal: 'Some narrative',
      });

      const result = await markQuarterlyReportFinal(reportId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('sudah difinalisasi');
      }
    });
  });

  describe('getQuarterlyReport', () => {
    it('returns report for existing kid+term combination', async () => {
      mockDb.query.quarterlyReportSnapshot.findFirst.mockResolvedValue({
        id: reportId,
        kidId: kidId1,
        termId,
        status: 'draft',
        sectionsJson: {
          changes: 'Test',
          improvements: 'Test',
          recommendations: 'Test',
        },
        narrativeAiDraft: 'Narasi',
        narrativeFinal: null,
        statsJson: { attendancePercent: 100 },
        kid: { id: kidId1, name: 'Ahmad' },
        term: { id: termId, name: 'Semester 1 2025' },
      });

      const result = await getQuarterlyReport(kidId1, termId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toBeNull();
        expect(result.data?.status).toBe('draft');
        expect(result.data?.kid?.name).toBe('Ahmad');
      }
    });

    it('returns null when no report exists', async () => {
      mockDb.query.quarterlyReportSnapshot.findFirst.mockResolvedValue(null);

      const result = await getQuarterlyReport(kidId1, termId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('getQuarterlyReportById', () => {
    it('returns report by ID', async () => {
      mockDb.query.quarterlyReportSnapshot.findFirst.mockResolvedValue({
        id: reportId,
        kidId: kidId1,
        termId,
        status: 'draft',
        sectionsJson: {
          changes: 'Test',
          improvements: 'Test',
          recommendations: 'Test',
        },
        narrativeAiDraft: 'Narasi',
        narrativeFinal: null,
        statsJson: { attendancePercent: 100 },
        kid: { id: kidId1, name: 'Ahmad' },
        term: { id: termId, name: 'Semester 1 2025' },
      });

      const result = await getQuarterlyReportById(reportId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(reportId);
        expect(result.data.kid?.name).toBe('Ahmad');
      }
    });

    it('returns error when report not found', async () => {
      mockDb.query.quarterlyReportSnapshot.findFirst.mockResolvedValue(null);

      const result = await getQuarterlyReportById(reportId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Laporan');
      }
    });
  });
});
