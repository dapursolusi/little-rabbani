import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  generateDailyReports,
  getDailyReportStatus,
  getDailyReportsForSession,
  markDailyReportSent,
  updateDailyReportNarrative,
} from '@/lib/actions/daily-report';
import { requireOwner } from '@/lib/actions/utils';

// Mock the AI module
const mockGenerateNarrative = vi.fn();
vi.mock('@/lib/ai', () => ({
  generateNarrative: (...args: unknown[]) => mockGenerateNarrative(...args),
}));

// Mock requireOwner
vi.mock('@/lib/actions/utils', () => ({
  requireOwner: vi.fn(),
}));

// Mock the database
vi.mock('@/lib/db', () => {
  return {
    db: {
      query: {
        termSession: { findMany: vi.fn(), findFirst: vi.fn() },
        dailyReportSnapshot: { findFirst: vi.fn(), findMany: vi.fn() },
        kid: { findMany: vi.fn() },
        observation: { findFirst: vi.fn(), findMany: vi.fn() },
        dailyClassReport: { findMany: vi.fn(), findFirst: vi.fn() },
      },
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
});

// We'll get the mocked db module
const { db } = await import('@/lib/db');
const mockDb = db as unknown as {
  query: {
    termSession: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
    dailyReportSnapshot: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    kid: { findMany: ReturnType<typeof vi.fn> };
    observation: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    dailyClassReport: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
  };
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe('Daily Report - Server Actions', () => {
  const ownerUserId = 'owner-123';
  const mockAuth = { authorized: true as const, userId: ownerUserId };

  const sessionId = 'session-123';
  const kidId1 = 'kid-123';
  const kidId2 = 'kid-456';
  const kidId3 = 'kid-789';

  const mockSession = {
    id: sessionId,
    termId: 'term-1',
    date: '2025-06-10',
    startTime: '08:00',
    endTime: '10:00',
    label: 'Pagi',
    isHoliday: false,
    holidayReason: null,
  };

  const mockKid1 = { id: kidId1, name: 'Ahmad' };
  const mockKid2 = { id: kidId2, name: 'Budi' };
  const mockKid3 = { id: kidId3, name: 'Citra' };

  const mockObservation = {
    id: 'obs-1',
    kidId: kidId1,
    sessionId,
    mood: 4,
    appetite: 'good',
    presence: 'present_full',
    absenceReason: null,
    notes: [{ text: 'Anak bersemangat' }],
    activities: [
      {
        participated: 'yes',
        dcrActivity: { activity: { name: 'Mewarnai' } },
      },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (requireOwner as ReturnType<typeof vi.fn>).mockResolvedValue(mockAuth);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getDailyReportsForSession', () => {
    it('returns reports for all kids in a session', async () => {
      const mockReports = [
        {
          id: 'report-1',
          kidId: kidId1,
          sessionId,
          structuredJson: '{}',
          narrativeAiDraft: 'Narasi Ahmad',
          narrativeFinal: null,
          status: 'draft',
          generatedAt: new Date(),
          kid: { id: kidId1, name: 'Ahmad' },
        },
        {
          id: 'report-2',
          kidId: kidId2,
          sessionId,
          structuredJson: '{}',
          narrativeAiDraft: 'Narasi Budi',
          narrativeFinal: null,
          status: 'draft',
          generatedAt: new Date(),
          kid: { id: kidId2, name: 'Budi' },
        },
      ];

      mockDb.query.termSession.findFirst.mockResolvedValue(mockSession);
      mockDb.query.kid.findMany.mockResolvedValue([mockKid1, mockKid2]);
      mockDb.query.dailyReportSnapshot.findMany.mockResolvedValue(mockReports);

      const result = await getDailyReportsForSession(sessionId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reports).toHaveLength(2);
        expect(result.data.kids).toHaveLength(2);
      }
    });

    it('returns error when session not found', async () => {
      mockDb.query.termSession.findFirst.mockResolvedValue(null);

      const result = await getDailyReportsForSession(sessionId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Sesi');
      }
    });

    it('returns error when not authorized as owner', async () => {
      (requireOwner as ReturnType<typeof vi.fn>).mockResolvedValue({
        authorized: false,
        error: 'Akses ditolak',
      });

      const result = await getDailyReportsForSession(sessionId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Akses ditolak');
      }
    });
  });

  describe('generateDailyReports', () => {
    beforeEach(() => {
      mockDb.query.termSession.findFirst.mockResolvedValue(mockSession);
      mockDb.query.kid.findMany.mockResolvedValue([
        mockKid1,
        mockKid2,
        mockKid3,
      ]);
    });

    it('generates reports for multiple kids', async () => {
      // Mock observation.findFirst - returns data for first 2 calls, null for rest (no observations)
      let obsCallCount = 0;
      mockDb.query.observation.findFirst.mockImplementation(async () => {
        obsCallCount++;
        if (obsCallCount <= 2) {
          return { ...mockObservation };
        }
        return null;
      });

      // Mock upsert - no existing report
      mockDb.query.dailyReportSnapshot.findFirst.mockResolvedValue(null);

      // Mock AI generation
      mockGenerateNarrative.mockResolvedValue('Narasi untuk hari ini...');

      // Mock insert returning
      const mockReturning = [{ id: 'new-report' }];
      mockDb.insert.mockReturnValue({
        values: () => ({ returning: vi.fn().mockResolvedValue(mockReturning) }),
      });

      const result = await generateDailyReports(sessionId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        // At least one kid should have been successful and at least one skipped
        const successes = result.data.filter((r) => r.status === 'success');
        const skips = result.data.filter((r) => r.status === 'skipped');
        expect(successes.length).toBeGreaterThanOrEqual(1);
        expect(skips.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('returns error when session not found', async () => {
      mockDb.query.termSession.findFirst.mockResolvedValue(null);

      const result = await generateDailyReports(sessionId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('getDailyReportStatus', () => {
    it('returns the correct status for a report', async () => {
      mockDb.query.dailyReportSnapshot.findFirst.mockResolvedValue({
        status: 'sent',
        narrativeAiDraft: 'Narasi',
        narrativeFinal: 'Narasi final',
      });

      const result = await getDailyReportStatus(kidId1, sessionId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.status).toBe('sent');
      }
    });

    it('returns null when no report exists', async () => {
      mockDb.query.dailyReportSnapshot.findFirst.mockResolvedValue(null);

      const result = await getDailyReportStatus(kidId1, sessionId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('updateDailyReportNarrative', () => {
    const mockReport = {
      id: 'report-1',
      kidId: kidId1,
      sessionId,
      status: 'draft',
      narrativeAiDraft: 'Narasi AI',
      narrativeFinal: null,
    };

    beforeEach(() => {
      mockDb.update.mockReturnValue({
        set: () => ({ where: vi.fn().mockResolvedValue(undefined) }),
      });
    });

    it('updates narrative and persists changes', async () => {
      mockDb.query.dailyReportSnapshot.findFirst.mockResolvedValue(mockReport);

      const result = await updateDailyReportNarrative(
        kidId1,
        sessionId,
        'Narasi yang sudah diedit...'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('draft');
      }
    });

    it('changes status from sent to stale on edit', async () => {
      mockDb.query.dailyReportSnapshot.findFirst.mockResolvedValue({
        ...mockReport,
        status: 'sent',
      });

      const result = await updateDailyReportNarrative(
        kidId1,
        sessionId,
        'Edited narrative'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('stale');
      }
    });

    it('returns error when report not found', async () => {
      mockDb.query.dailyReportSnapshot.findFirst.mockResolvedValue(null);

      const result = await updateDailyReportNarrative(
        kidId1,
        sessionId,
        'Narasi'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Laporan');
      }
    });
  });

  describe('markDailyReportSent', () => {
    const mockReport = {
      id: 'report-1',
      kidId: kidId1,
      sessionId,
      status: 'draft',
      narrativeAiDraft: 'Narasi AI',
      narrativeFinal: null,
    };

    beforeEach(() => {
      mockDb.update.mockReturnValue({
        set: () => ({ where: vi.fn().mockResolvedValue(undefined) }),
      });
    });

    it('marks draft report as sent', async () => {
      mockDb.query.dailyReportSnapshot.findFirst.mockResolvedValue(mockReport);

      const result = await markDailyReportSent(kidId1, sessionId);

      expect(result.success).toBe(true);
    });

    it('returns error when report not in draft status', async () => {
      mockDb.query.dailyReportSnapshot.findFirst.mockResolvedValue({
        ...mockReport,
        status: 'sent',
      });

      const result = await markDailyReportSent(kidId1, sessionId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('sudah ditandai terkirim');
      }
    });

    it('returns error when report not found', async () => {
      mockDb.query.dailyReportSnapshot.findFirst.mockResolvedValue(null);

      const result = await markDailyReportSent(kidId1, sessionId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Laporan');
      }
    });
  });
});
