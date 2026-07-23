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

vi.mock('@/lib/actions/utils', () => ({
  requireOwner: vi.fn(),
}));

vi.mock('@/lib/db', () => {
  return {
    db: {
      query: {
        sessionType: { findMany: vi.fn() },
        dailyReportSnapshot: { findFirst: vi.fn(), findMany: vi.fn() },
        kid: { findMany: vi.fn() },
        observation: { findFirst: vi.fn(), findMany: vi.fn() },
      },
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const { db } = await import('@/db');
const mockDb = db as unknown as {
  query: {
    sessionType: { findMany: ReturnType<typeof vi.fn> };
    dailyReportSnapshot: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    kid: { findMany: ReturnType<typeof vi.fn> };
    observation: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

describe('Daily Report - Server Actions', () => {
  const ownerUserId = 'owner-123';
  const mockAuth = { authorized: true as const, userId: ownerUserId };
  const date = '2025-06-10';
  const kidId1 = 'kid-123';
  const kidId2 = 'kid-456';

  beforeEach(() => {
    vi.resetAllMocks();
    (requireOwner as ReturnType<typeof vi.fn>).mockResolvedValue(mockAuth);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getDailyReportsForSession', () => {
    it('returns reports for all kids on a date', async () => {
      mockDb.query.kid.findMany.mockResolvedValue([
        { id: kidId1, name: 'Ahmad' },
        { id: kidId2, name: 'Budi' },
      ]);
      mockDb.query.dailyReportSnapshot.findMany.mockResolvedValue([]);

      const result = await getDailyReportsForSession(date, 'st-1');
      expect(result.success).toBe(true);
    });
  });

  describe('generateDailyReports', () => {
    it('generates reports for multiple kids', async () => {
      mockDb.query.kid.findMany.mockResolvedValue([
        { id: kidId1, name: 'Ahmad' },
        { id: kidId2, name: 'Budi' },
      ]);

      let obsCallCount = 0;
      mockDb.query.observation.findFirst.mockImplementation(async () => {
        obsCallCount++;
        if (obsCallCount <= 1) {
          return {
            id: 'obs-1',
            kidId: kidId1,
            mood: 4,
            appetite: 'good',
            presence: 'present_full',
            absenceReason: null,
            activities: [],
            notes: [],
          };
        }
        return null;
      });

      mockDb.query.dailyReportSnapshot.findFirst.mockResolvedValue(null);
      mockGenerateNarrative.mockResolvedValue('Narasi untuk hari ini...');

      const mockReturning = [{ id: 'new-report' }];
      mockDb.insert.mockReturnValue({
        values: () => ({ returning: vi.fn().mockResolvedValue(mockReturning) }),
      });

      const result = await generateDailyReports(date, 'st-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
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

      const result = await getDailyReportStatus(kidId1, date);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.status).toBe('sent');
      }
    });
  });

  describe('updateDailyReportNarrative', () => {
    it('updates narrative and persists changes', async () => {
      mockDb.query.dailyReportSnapshot.findFirst.mockResolvedValue({
        id: 'report-1',
        kidId: kidId1,
        status: 'draft',
        narrativeAiDraft: 'Narasi AI',
        narrativeFinal: null,
      });

      mockDb.update.mockReturnValue({
        set: () => ({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'report-1',
                kidId: kidId1,
                status: 'draft',
                narrativeFinal: 'Narasi yang sudah diedit...',
                editedBy: ownerUserId,
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      });

      const result = await updateDailyReportNarrative(
        kidId1,
        date,
        'Narasi yang sudah diedit...'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('markDailyReportSent', () => {
    it('marks draft report as sent', async () => {
      mockDb.query.dailyReportSnapshot.findFirst.mockResolvedValue({
        id: 'report-1',
        kidId: kidId1,
        status: 'draft',
        narrativeAiDraft: 'Narasi AI',
        narrativeFinal: null,
      });

      mockDb.update.mockReturnValue({
        set: () => ({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'report-1',
                kidId: kidId1,
                status: 'sent',
                narrativeFinal: null,
                editedBy: ownerUserId,
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      });

      const result = await markDailyReportSent(kidId1, date);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('sent');
      }
    });
  });
});
