import * as sessionActions from '@/features/session/actions';
import * as termActions from '@/features/term/actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => {
  const mockChain = {
    from: vi.fn(() => mockChain),
    where: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockResolvedValue([]),
    returning: vi.fn().mockResolvedValue([]),
    set: vi.fn(() => mockChain),
    values: vi.fn(() => mockChain),
  };

  return {
    db: {
      select: vi.fn(() => mockChain),
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
        term: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        termSession: {
          findMany: vi.fn(),
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

function toFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

function mockOwnerSession() {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    user: {
      id: 'owner-1',
      role: 'owner',
      email: 'owner@littlerabbani.com',
      name: 'Owner',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: 'session-1',
      userId: 'owner-1',
      token: 'token-1',
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    },
  });
}

describe('Term Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOwnerSession();
  });

  // VAL-MASTER-019: Owner creates a Term
  describe('createTerm', () => {
    it('should create a term with required fields', async () => {
      const mockReturn = vi.fn().mockResolvedValue([
        {
          id: 'term-1',
          name: 'Semester 1 2025',
          startDate: '2025-01-01',
          endDate: '2025-06-30',
          isActive: false,
        },
      ]);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({ returning: mockReturn }),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await termActions.createTerm(
        toFormData({
          name: 'Semester 1 2025',
          startDate: '2025-01-01',
          endDate: '2025-06-30',
        })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Semester 1 2025');
        expect(result.data.isActive).toBe(false);
      }
    });

    it('should reject empty name', async () => {
      const result = await termActions.createTerm(
        toFormData({ name: '', startDate: '2025-01-01', endDate: '2025-06-30' })
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nama');
    });

    it('should reject empty dates', async () => {
      const result = await termActions.createTerm(
        toFormData({ name: 'Term 1', startDate: '', endDate: '' })
      );
      expect(result.success).toBe(false);
    });

    it('should reject non-owner', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: {
          id: 'teacher-1',
          role: 'teacher',
          email: 'teacher@test.com',
          name: 'Teacher',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: 's1',
          userId: 'teacher-1',
          token: 't1',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: null,
          userAgent: null,
        },
      });

      const result = await termActions.createTerm(
        toFormData({
          name: 'Semester 1',
          startDate: '2025-01-01',
          endDate: '2025-06-30',
        })
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Owner');
    });
  });

  // VAL-MASTER-020 + VAL-MASTER-021
  describe('activateTerm / single-active-term invariant', () => {
    it('should set a term as active', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([
                { id: 'term-1', name: 'Semester 1', isActive: true },
              ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await termActions.activateTerm('term-1');
      expect(result.success).toBe(true);
    });

    it('should deactivate previously active term when activating a new one', async () => {
      // First call to select returns existing active term
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 'term-0' }]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      // db.update called twice: first for deactivating old, then for activating new
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([
                { id: 'term-1', name: 'Semester 1', isActive: true },
              ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await termActions.activateTerm('term-1');
      expect(result.success).toBe(true);
    });
  });

  // VAL-MASTER-022: Owner updates a Term
  describe('updateTerm', () => {
    it('should update a term', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'term-1',
                name: 'Semester 1 2025 (Updated)',
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                isActive: false,
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await termActions.updateTerm(
        'term-1',
        toFormData({
          name: 'Semester 1 2025 (Updated)',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
        })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toContain('Updated');
      }
    });
  });

  // VAL-MASTER-023 + VAL-MASTER-024
  describe('deleteTerm', () => {
    it('should delete a term with no sessions', async () => {
      // Override where to return empty array (no sessions)
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
      };
      vi.mocked(db.select).mockReturnValue(
        mockSelectChain as unknown as ReturnType<typeof db.select>
      );
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      } as unknown as ReturnType<typeof db.delete>);

      const result = await termActions.deleteTerm('term-1');
      expect(result.success).toBe(true);
    });

    it('should block deletion if term has sessions', async () => {
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ id: 'ts-1' }]),
        orderBy: vi.fn().mockReturnThis(),
      };
      vi.mocked(db.select).mockReturnValue(
        mockSelectChain as unknown as ReturnType<typeof db.select>
      );

      const result = await termActions.deleteTerm('term-1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Hapus sesi');
    });
  });
});

describe('Session Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOwnerSession();
  });

  // VAL-MASTER-026
  describe('createSession', () => {
    it('should create a single session', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'ts-1',
              termId: 'term-1',
              date: '2025-01-15',
              startTime: '08:00',
              endTime: '10:00',
              label: 'Morning Class',
              isHoliday: false,
              holidayReason: null,
            },
          ]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await sessionActions.createSession(
        toFormData({
          termId: 'term-1',
          date: '2025-01-15',
          startTime: '08:00',
          endTime: '10:00',
          label: 'Morning Class',
        })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.label).toBe('Morning Class');
        expect(result.data.isHoliday).toBe(false);
      }
    });

    it('should reject empty required fields', async () => {
      const result = await sessionActions.createSession(
        toFormData({
          termId: '',
          date: '',
          startTime: '',
          endTime: '',
          label: '',
        })
      );
      expect(result.success).toBe(false);
    });
  });

  // VAL-MASTER-027
  describe('generateRecurringSessions', () => {
    it('should generate sessions for selected days-of-week', async () => {
      vi.mocked(db.query.term.findFirst).mockResolvedValue({
        id: 'term-1',
        name: 'Semester 1',
        startDate: '2025-01-06',
        endDate: '2025-01-19',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue([
              { id: 'ts-1' },
              { id: 'ts-2' },
              { id: 'ts-3' },
            ]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await sessionActions.generateRecurringSessions('term-1', {
        daysOfWeek: ['monday', 'wednesday', 'friday'],
        startTime: '08:00',
        endTime: '10:00',
        label: 'Regular Class',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBeGreaterThan(0);
      }
    });

    it('should reject if term not found', async () => {
      vi.mocked(db.query.term.findFirst).mockResolvedValue(undefined);
      const result = await sessionActions.generateRecurringSessions(
        'term-nonexistent',
        {
          daysOfWeek: ['monday'],
          startTime: '08:00',
          endTime: '10:00',
          label: 'Class',
        }
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak ditemukan');
    });
  });

  // VAL-MASTER-028
  describe('updateSession', () => {
    it('should update a session', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'ts-1',
                date: '2025-01-16',
                startTime: '09:00',
                endTime: '11:00',
                label: 'Updated Class',
                isHoliday: false,
                holidayReason: null,
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await sessionActions.updateSession(
        'ts-1',
        toFormData({
          termId: 'term-1',
          date: '2025-01-16',
          startTime: '09:00',
          endTime: '11:00',
          label: 'Updated Class',
        })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.label).toContain('Updated');
      }
    });
  });

  // VAL-MASTER-029
  describe('deleteSession', () => {
    it('should delete a session', async () => {
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      } as unknown as ReturnType<typeof db.delete>);
      const result = await sessionActions.deleteSession('ts-1');
      expect(result.success).toBe(true);
    });
  });

  // VAL-MASTER-030 + VAL-MASTER-031
  describe('holiday override', () => {
    it('should mark session as holiday', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'ts-1',
                date: '2025-01-17',
                startTime: '08:00',
                endTime: '10:00',
                label: 'Hari Libur Nasional',
                isHoliday: true,
                holidayReason: 'Hari Libur Nasional',
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await sessionActions.updateSessionHoliday('ts-1', {
        isHoliday: true,
        holidayReason: 'Hari Libur Nasional',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isHoliday).toBe(true);
        expect(result.data.holidayReason).toBe('Hari Libur Nasional');
      }
    });

    it('should remove holiday override', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'ts-1',
                date: '2025-01-17',
                isHoliday: false,
                holidayReason: null,
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await sessionActions.updateSessionHoliday('ts-1', {
        isHoliday: false,
        holidayReason: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isHoliday).toBe(false);
        expect(result.data.holidayReason).toBeNull();
      }
    });
  });
});

// VAL-MASTER-032 + VAL-MASTER-033 + VAL-MASTER-034
describe('Cohort Assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOwnerSession();
  });

  describe('bulkEnrollKids', () => {
    it('should enroll waiting-list kids into a term', async () => {
      vi.mocked(db.query.term.findFirst).mockResolvedValue({
        id: 'term-1',
        name: 'Semester 1',
        startDate: '2025-01-01',
        endDate: '2025-06-30',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      vi.mocked(db.update).mockReturnValue({
        set: vi
          .fn()
          .mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await termActions.bulkEnrollKids('term-1', [
        'kid-1',
        'kid-2',
        'kid-3',
      ]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(3);
      }
    });

    it('should reject enrollment if term is not active', async () => {
      vi.mocked(db.query.term.findFirst).mockResolvedValue({
        id: 'term-1',
        name: 'Semester 1',
        startDate: '2025-01-01',
        endDate: '2025-06-30',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const result = await termActions.bulkEnrollKids('term-1', ['kid-1']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Aktifkan');
    });

    it('should reject if term not found', async () => {
      vi.mocked(db.query.term.findFirst).mockResolvedValue(undefined);
      const result = await termActions.bulkEnrollKids('term-nonexistent', [
        'kid-1',
      ]);
      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak ditemukan');
    });

    it('should reject empty kid list', async () => {
      const result = await termActions.bulkEnrollKids('term-1', []);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Pilih');
    });
  });
});
