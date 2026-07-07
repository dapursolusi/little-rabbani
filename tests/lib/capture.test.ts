import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as captureActions from '@/lib/actions/capture';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => {
  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockResolvedValue([]),
        })),
        where: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue([]),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([]),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
      query: {
        kid: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        observation: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        observationNote: {
          findMany: vi.fn(),
        },
        observationActivity: {
          findMany: vi.fn(),
        },
        dailyClassReport: {
          findFirst: vi.fn(),
        },
        dcrActivity: {
          findMany: vi.fn(),
        },
        termSession: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        term: {
          findFirst: vi.fn(),
        },
      },
    },
  };
});

vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Headers()),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

function mockTeacherSession() {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    user: {
      id: 'teacher-1',
      role: 'teacher',
      email: 'teacher@littlerabbani.com',
      name: 'Teacher',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: 'session-t1',
      userId: 'teacher-1',
      token: 'token-t1',
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    },
  });
}

function mockSession(
  overrides: Partial<{
    date: string;
    startTime: string;
    endTime: string;
    isHoliday: boolean;
  }> = {}
) {
  return {
    id: 'session-1',
    termId: 'term-1',
    date: overrides.date ?? '2026-07-08',
    startTime: overrides.startTime ?? '08:00',
    endTime: overrides.endTime ?? '10:00',
    label: 'Kelas Pagi',
    isHoliday: overrides.isHoliday ?? false,
    holidayReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('Capture Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-08T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─────────────── getSessionWithKids ───────────────

  describe('getSessionWithKids', () => {
    it('should return session with enrolled kids', async () => {
      mockTeacherSession();

      const mockKids = [
        {
          id: 'kid-1',
          name: 'Aisyah',
          dob: '2020-01-01',
          status: 'enrolled',
          guardianId: 'guardian-1',
          enrolledTermId: 'term-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          guardian: {
            id: 'guardian-1',
            name: 'Ibu Aisyah',
            phone: '08123456789',
            email: null,
            secondContactName: null,
            secondContactPhone: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: 'kid-2',
          name: 'Budi',
          dob: '2020-02-02',
          status: 'enrolled',
          guardianId: 'guardian-2',
          enrolledTermId: 'term-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          guardian: {
            id: 'guardian-2',
            name: 'Bapak Budi',
            phone: '08129876543',
            email: null,
            secondContactName: null,
            secondContactPhone: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      vi.mocked(db.query.termSession.findFirst).mockResolvedValue(
        mockSession() as any
      );

      vi.mocked(db.query.term.findFirst).mockResolvedValue({
        id: 'term-1',
        name: 'Semester 1 2026',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(db.query.kid.findMany).mockResolvedValue(mockKids as any);

      // No existing observations
      vi.mocked(db.query.observation.findMany).mockResolvedValue([]);

      const result = await captureActions.getSessionWithKids('session-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.session.id).toBe('session-1');
        expect(result.data.kids).toHaveLength(2);
        expect(result.data.kids[0].captureState).toBe('uncaptured');
      }
    });

    // VAL-CAPTURE-027: Session with zero enrolled kids shows empty roster
    it('should return empty kids array for session with no enrolled kids', async () => {
      mockTeacherSession();

      vi.mocked(db.query.termSession.findFirst).mockResolvedValue(
        mockSession() as any
      );

      vi.mocked(db.query.term.findFirst).mockResolvedValue({
        id: 'term-1',
        name: 'Semester 1 2026',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(db.query.kid.findMany).mockResolvedValue([]);

      const result = await captureActions.getSessionWithKids('session-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.kids).toHaveLength(0);
      }
    });

    // VAL-CAPTURE-028: Capture on holiday session is blocked
    it('should block capture on holiday session', async () => {
      mockTeacherSession();

      vi.mocked(db.query.termSession.findFirst).mockResolvedValue(
        mockSession({ isHoliday: true }) as any
      );

      const result = await captureActions.getSessionWithKids('session-1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('libur');
    });

    // VAL-CAPTURE-052: Teacher cannot capture before session starts
    it('should block capture before session start time', async () => {
      mockTeacherSession();
      vi.setSystemTime(new Date('2026-07-08T05:00:00')); // Before 08:00

      vi.mocked(db.query.termSession.findFirst).mockResolvedValue(
        mockSession({ startTime: '08:00' }) as any
      );

      const result = await captureActions.getSessionWithKids('session-1');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('belum dimulai');
      }
    });

    // VAL-CAPTURE-022: Pass 1 available anytime post-class
    it('should allow capture for sessions that ended recently', async () => {
      mockTeacherSession();
      vi.setSystemTime(new Date('2026-07-08T10:05:00')); // 5 min after 10:00

      vi.mocked(db.query.termSession.findFirst).mockResolvedValue(
        mockSession({ endTime: '10:00' }) as any
      );

      vi.mocked(db.query.term.findFirst).mockResolvedValue({
        id: 'term-1',
        name: 'Semester 1 2026',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(db.query.kid.findMany).mockResolvedValue([]);

      const result = await captureActions.getSessionWithKids('session-1');
      expect(result.success).toBe(true);
    });

    it('should allow capture for sessions that ended days ago', async () => {
      mockTeacherSession();

      vi.mocked(db.query.termSession.findFirst).mockResolvedValue(
        mockSession({
          date: '2026-07-05',
          endTime: '10:00',
        }) as any
      );

      vi.mocked(db.query.term.findFirst).mockResolvedValue({
        id: 'term-1',
        name: 'Semester 1 2026',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(db.query.kid.findMany).mockResolvedValue([]);

      const result = await captureActions.getSessionWithKids('session-1');
      expect(result.success).toBe(true);
    });

    it('should show existing capture state with check/cross', async () => {
      mockTeacherSession();

      vi.mocked(db.query.termSession.findFirst).mockResolvedValue(
        mockSession() as any
      );

      vi.mocked(db.query.term.findFirst).mockResolvedValue({
        id: 'term-1',
        name: 'Semester 1 2026',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(db.query.kid.findMany).mockResolvedValue([
        {
          id: 'kid-1',
          name: 'Aisyah',
          dob: '2020-01-01',
          status: 'enrolled',
          guardianId: 'guardian-1',
          enrolledTermId: 'term-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'kid-2',
          name: 'Budi',
          dob: '2020-02-02',
          status: 'enrolled',
          guardianId: 'guardian-2',
          enrolledTermId: 'term-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any);

      // One observation exists
      vi.mocked(db.query.observation.findMany).mockResolvedValue([
        {
          id: 'obs-1',
          kidId: 'kid-1',
          sessionId: 'session-1',
          teacherId: 'teacher-1',
          mood: 4,
          appetite: 'good',
          presence: 'present_full',
          absenceReason: null,
          version: 1,
          capturedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any);

      const result = await captureActions.getSessionWithKids('session-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.kids[0].captureState).toBe('captured');
        expect(result.data.kids[1].captureState).toBe('uncaptured');
      }
    });
  });

  // ─────────────── savePass1Observation ───────────────

  describe('savePass1Observation', () => {
    it('should save a new observation with all fields', async () => {
      mockTeacherSession();

      const newObservation = {
        id: 'obs-new',
        kidId: 'kid-1',
        sessionId: 'session-1',
        teacherId: 'teacher-1',
        mood: 4,
        appetite: 'good',
        presence: 'present_full',
        absenceReason: null,
        version: 0,
        capturedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.termSession.findFirst).mockResolvedValue(
        mockSession() as any
      );

      vi.mocked(db.query.observation.findFirst).mockResolvedValue(undefined);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newObservation]),
        }),
      } as any);

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('sessionId', 'session-1');
      formData.append('mood', '4');
      formData.append('appetite', 'good');
      formData.append('presence', 'present_full');
      formData.append('notes', 'Anak sangat bersemangat hari ini');

      const result = await captureActions.savePass1Observation(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('obs-new');
      }
    });

    // VAL-CAPTURE-019: Mood validated as 5-level scale
    it('should reject mood outside 1-5 range', async () => {
      mockTeacherSession();

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('sessionId', 'session-1');
      formData.append('mood', '6');
      formData.append('appetite', 'good');
      formData.append('presence', 'present_full');

      const result = await captureActions.savePass1Observation(formData);
      expect(result.success).toBe(false);
    });

    // VAL-CAPTURE-020: Appetite validated as 3-level scale
    it('should reject invalid appetite value', async () => {
      mockTeacherSession();

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('sessionId', 'session-1');
      formData.append('mood', '3');
      formData.append('appetite', 'invalid');
      formData.append('presence', 'present_full');

      const result = await captureActions.savePass1Observation(formData);
      expect(result.success).toBe(false);
    });

    // VAL-CAPTURE-021: Absence reason required when absent
    it('should require absence_reason when presence is absent', async () => {
      mockTeacherSession();

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('sessionId', 'session-1');
      formData.append('mood', '3');
      formData.append('appetite', 'good');
      formData.append('presence', 'absent');
      // No absence_reason

      const result = await captureActions.savePass1Observation(formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('wajib');
    });

    // VAL-CAPTURE-030: Update existing observation
    it('should update existing observation (re-capture)', async () => {
      mockTeacherSession();

      const existingObs = {
        id: 'obs-1',
        kidId: 'kid-1',
        sessionId: 'session-1',
        teacherId: 'teacher-1',
        mood: 3,
        appetite: 'good',
        presence: 'present_full',
        absenceReason: null,
        version: 0,
        capturedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.termSession.findFirst).mockResolvedValue(
        mockSession() as any
      );

      vi.mocked(db.query.observation.findFirst).mockResolvedValue(
        existingObs as any
      );

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ ...existingObs, mood: 5, version: 1 }]),
          }),
        }),
      } as any);

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('sessionId', 'session-1');
      formData.append('mood', '5');
      formData.append('appetite', 'good');
      formData.append('presence', 'present_full');

      const result = await captureActions.savePass1Observation(formData);
      expect(result.success).toBe(true);
    });

    // VAL-CAPTURE-053: Notes are append-only
    it('should create new note without deleting old ones', async () => {
      mockTeacherSession();

      const existingObs = {
        id: 'obs-1',
        kidId: 'kid-1',
        sessionId: 'session-1',
        teacherId: 'teacher-1',
        mood: 4,
        appetite: 'good',
        presence: 'present_full',
        absenceReason: null,
        version: 1,
        capturedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.termSession.findFirst).mockResolvedValue(
        mockSession() as any
      );

      vi.mocked(db.query.observation.findFirst).mockResolvedValue(
        existingObs as any
      );

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ ...existingObs, version: 2 }]),
          }),
        }),
      } as any);

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('sessionId', 'session-1');
      formData.append('mood', '4');
      formData.append('appetite', 'good');
      formData.append('presence', 'present_full');
      formData.append('notes', 'Suka bernyanyi');

      const result = await captureActions.savePass1Observation(formData);
      expect(result.success).toBe(true);
    });

    // VAL-CAPTURE-051: Late and early_pickup presence statuses handled correctly
    it('should accept late and early_pickup presence values', async () => {
      mockTeacherSession();

      const newObservation = {
        id: 'obs-2',
        kidId: 'kid-2',
        sessionId: 'session-1',
        teacherId: 'teacher-1',
        mood: 3,
        appetite: 'moderate',
        presence: 'late',
        absenceReason: null,
        version: 0,
        capturedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.termSession.findFirst).mockResolvedValue(
        mockSession() as any
      );

      vi.mocked(db.query.observation.findFirst).mockResolvedValue(undefined);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newObservation]),
        }),
      } as any);

      const formData = new FormData();
      formData.append('kidId', 'kid-2');
      formData.append('sessionId', 'session-1');
      formData.append('mood', '3');
      formData.append('appetite', 'moderate');
      formData.append('presence', 'late');

      const result = await captureActions.savePass1Observation(formData);
      expect(result.success).toBe(true);
    });

    it('should reject teacher without session', async () => {
      mockTeacherSession();

      vi.mocked(db.query.termSession.findFirst).mockResolvedValue(undefined);

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('sessionId', 'invalid-session');
      formData.append('mood', '3');
      formData.append('appetite', 'good');
      formData.append('presence', 'present_full');

      const result = await captureActions.savePass1Observation(formData);
      expect(result.success).toBe(false);
    });
  });

  // ─────────────── savePass2Observation ───────────────

  describe('savePass2Observation', () => {
    it('should save activity participation', async () => {
      mockTeacherSession();

      const existingObs = {
        id: 'obs-1',
        kidId: 'kid-1',
        sessionId: 'session-1',
        teacherId: 'teacher-1',
        mood: 4,
        appetite: 'good',
        presence: 'present_full',
        absenceReason: null,
        version: 1,
        capturedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.observation.findFirst).mockResolvedValue(
        existingObs as any
      );

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('sessionId', 'session-1');
      formData.append(
        'activities',
        JSON.stringify([
          { dcrActivityId: 'dca-1', participated: 'yes' },
          { dcrActivityId: 'dca-2', participated: 'no' },
        ])
      );

      const result = await captureActions.savePass2Observation(formData);
      expect(result.success).toBe(true);
    });

    it('should require existing observation (Pass 1 done first)', async () => {
      mockTeacherSession();

      vi.mocked(db.query.observation.findFirst).mockResolvedValue(undefined);

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('sessionId', 'session-1');
      formData.append('activities', '[]');

      const result = await captureActions.savePass2Observation(formData);
      expect(result.success).toBe(false);
    });
  });

  // ─────────────── getPass2Status ───────────────

  describe('getPass2Status', () => {
    it('should return locked when DCR not captured', async () => {
      mockTeacherSession();

      vi.mocked(db.query.dailyClassReport.findFirst).mockResolvedValue(
        undefined
      );

      const result = await captureActions.getPass2Status('session-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDcrCaptured).toBe(false);
      }
    });

    it('should return unlocked when DCR is captured', async () => {
      mockTeacherSession();

      vi.mocked(db.query.dailyClassReport.findFirst).mockResolvedValue({
        id: 'dcr-1',
        sessionId: 'session-1',
        capturedAt: new Date(),
      } as any);

      const result = await captureActions.getPass2Status('session-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDcrCaptured).toBe(true);
      }
    });
  });

  // ─────────────── getPass2Activities ───────────────

  describe('getPass2Activities', () => {
    it('should return DCR activities for Pass 2', async () => {
      mockTeacherSession();

      vi.mocked(db.query.dcrActivity.findMany).mockResolvedValue([
        {
          id: 'dca-1',
          dcrId: 'dcr-1',
          activityId: 'activity-1',
          activityNameOther: null,
          deviation: 'done',
          wasPlanned: true,
          createdAt: new Date(),
          activity: {
            id: 'activity-1',
            name: 'Mewarnai',
            category: 'seni',
            isDeleted: false,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ] as any);

      const result = await captureActions.getPass2Activities('session-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it('should return empty array when no activities', async () => {
      mockTeacherSession();

      vi.mocked(db.query.dcrActivity.findMany).mockResolvedValue([]);

      const result = await captureActions.getPass2Activities('session-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  // ─────────────── getTeacherSessions ───────────────

  describe('getTeacherSessions', () => {
    it('should return past and future sessions for teacher', async () => {
      mockTeacherSession();

      vi.mocked(db.query.termSession.findMany).mockResolvedValue([
        {
          id: 's-past',
          termId: 'term-1',
          date: '2026-07-05',
          startTime: '08:00',
          endTime: '10:00',
          label: 'Kelas Pagi',
          isHoliday: false,
          holidayReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          term: {
            id: 'term-1',
            name: 'Semester 1 2026',
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: 's-future',
          termId: 'term-1',
          date: '2026-07-10',
          startTime: '08:00',
          endTime: '10:00',
          label: 'Kelas Pagi',
          isHoliday: false,
          holidayReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          term: {
            id: 'term-1',
            name: 'Semester 1 2026',
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ] as any);

      const result = await captureActions.getTeacherSessions();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('should reject non-teacher/owner role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: {
          id: 'unknown-1',
          role: 'unknown',
          email: 'unknown@test.com',
          name: 'Unknown',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: 'session-u1',
          userId: 'unknown-1',
          token: 'token-u1',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: null,
          userAgent: null,
        },
      });

      const result = await captureActions.getTeacherSessions();
      expect(result.success).toBe(false);
    });
  });
});
