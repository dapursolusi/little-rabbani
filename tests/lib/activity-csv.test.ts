import { db } from '@/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as activityActions from '@/lib/actions/activity';
import * as csvImportActions from '@/lib/actions/csv-import';
import { auth } from '@/lib/auth';

// Mock the db module
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
        activity: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        guardian: {
          findFirst: vi.fn(),
        },
        kid: {
          findFirst: vi.fn(),
        },
        user: {
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
      id: 'session-2',
      userId: 'teacher-1',
      token: 'token-2',
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    },
  });
}

// Helper to mock db.insert for counting inserts
function setupInsertCounter() {
  let count = 0;
  const returningMock = vi.fn().mockImplementation(() => {
    count++;
    return Promise.resolve([{ id: `record-${count}` }]);
  });
  vi.mocked(db.insert).mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: returningMock,
    }),
  } as unknown as ReturnType<typeof db.insert>);
}

// ============ Activity CRUD Tests ============

describe('Activity CRUD (VAL-MASTER-035 to VAL-MASTER-042)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOwnerSession();
  });

  // VAL-MASTER-035
  describe('createActivity', () => {
    it('should create an activity with name and category', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'act-1',
              name: 'Mewarnai',
              category: 'seni',
              isDeleted: false,
              deletedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await activityActions.createActivity(
        toFormData({ name: 'Mewarnai', category: 'seni' })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Mewarnai');
      }
    });

    it('should default category to lainnya', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'act-2',
              name: 'Bermain Bebas',
              category: 'lainnya',
              isDeleted: false,
              deletedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await activityActions.createActivity(
        toFormData({ name: 'Bermain Bebas' })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('lainnya');
      }
    });

    // VAL-MASTER-042: validates required fields
    it('should reject empty name', async () => {
      const result = await activityActions.createActivity(
        toFormData({ name: '', category: 'seni' })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Nama');
      }
    });
  });

  // VAL-MASTER-036
  describe('getActivities', () => {
    it('should return all activities', async () => {
      const mockActivities = [
        {
          id: 'act-1',
          name: 'Mewarnai',
          category: 'seni' as const,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'act-2',
          name: 'Futsal',
          category: 'olahraga' as const,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.mocked(db.query.activity.findMany).mockResolvedValue(mockActivities);

      const result = await activityActions.getActivities();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('should return empty array when no activities exist', async () => {
      vi.mocked(db.query.activity.findMany).mockResolvedValue([]);

      const result = await activityActions.getActivities();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  // VAL-MASTER-037
  describe('updateActivity', () => {
    it('should update activity name and category', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'act-1',
                name: 'Mewarnai Updated',
                category: 'seni',
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await activityActions.updateActivity(
        'act-1',
        toFormData({ name: 'Mewarnai Updated', category: 'seni' })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Mewarnai Updated');
      }
    });
  });

  // VAL-MASTER-038: Soft delete
  describe('softDeleteActivity', () => {
    it('should soft-delete an activity', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'act-1',
                name: 'Mewarnai',
                isDeleted: true,
                deletedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await activityActions.softDeleteActivity('act-1');

      expect(result.success).toBe(true);
    });
  });

  // VAL-MASTER-041: Restore
  describe('restoreActivity', () => {
    it('should restore a soft-deleted activity', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'act-1',
                name: 'Mewarnai',
                isDeleted: false,
                deletedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await activityActions.restoreActivity('act-1');

      expect(result.success).toBe(true);
    });
  });

  // VAL-MASTER-058: Teacher role check
  describe('role check', () => {
    it('should reject teacher from creating activity', async () => {
      mockTeacherSession();
      const result = await activityActions.createActivity(
        toFormData({ name: 'Mewarnai', category: 'seni' })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Owner');
      }
    });

    it('should reject teacher from soft-deleting activity', async () => {
      mockTeacherSession();
      const result = await activityActions.softDeleteActivity('act-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Owner');
      }
    });
  });
});

// ============ CSV Import Tests ============

describe('CSV Import (VAL-MASTER-043 to VAL-MASTER-051)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOwnerSession();
  });

  // VAL-MASTER-050
  describe('empty CSV', () => {
    it('should reject empty CSV for kids import', async () => {
      const result = await csvImportActions.importKidsCsv([]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('kosong');
    });

    it('should reject empty CSV for guardians import', async () => {
      const result = await csvImportActions.importGuardiansCsv([]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('kosong');
    });

    it('should reject empty CSV for teachers import', async () => {
      const result = await csvImportActions.importTeachersCsv([]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('kosong');
    });

    it('should reject empty CSV for waiting list import', async () => {
      const result = await csvImportActions.importWaitingListCsv([]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('kosong');
    });

    it('should reject empty CSV for activities import', async () => {
      const result = await csvImportActions.importActivitiesCsv([]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('kosong');
    });
  });

  // VAL-MASTER-048: Per-row error handling
  describe('per-row error handling', () => {
    it('should skip bad rows in kids CSV and continue', async () => {
      const rows = [
        {
          name: 'Ani',
          dob: '2020-01-15',
          guardian_name: 'Siti',
          guardian_phone: '0811',
        },
        {
          name: '',
          dob: '2020-02-20',
          guardian_name: 'Budi',
          guardian_phone: '0812',
        },
        {
          name: 'Citra',
          dob: '2021-03-10',
          guardian_name: 'Dewi',
          guardian_phone: '0813',
        },
      ];

      vi.mocked(db.query.kid.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.guardian.findFirst).mockResolvedValue(undefined);
      setupInsertCounter();

      const result = await csvImportActions.importKidsCsv(rows);

      expect(result.importedCount).toBe(2);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].line).toBe(3);
      expect(result.errors[0].message).toContain('Nama');
    });

    it('should skip bad rows in activities CSV and continue', async () => {
      const rows = [
        { name: 'Mewarnai', category: 'seni' },
        { name: '', category: 'olahraga' },
        { name: 'Menyanyi', category: 'musik' },
      ];

      setupInsertCounter();

      const result = await csvImportActions.importActivitiesCsv(rows);

      expect(result.importedCount).toBe(2);
      expect(result.errors.length).toBe(1);
    });
  });

  // VAL-MASTER-049: Duplicate kid name+dob
  describe('duplicate kid detection', () => {
    it('should warn and skip duplicate kid name+dob', async () => {
      const rows = [
        {
          name: 'Ani',
          dob: '2020-01-15',
          guardian_name: 'Siti',
          guardian_phone: '0811',
        },
        {
          name: 'Ani',
          dob: '2020-01-15',
          guardian_name: 'Siti',
          guardian_phone: '0811',
        },
      ];

      vi.mocked(db.query.kid.findFirst)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          id: 'existing-kid',
          name: 'Ani',
          dob: '2020-01-15',
          status: 'waiting',
          guardianId: 'g1',
          enrolledTermId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        });

      vi.mocked(db.query.guardian.findFirst).mockResolvedValue(undefined);
      setupInsertCounter();

      const result = await csvImportActions.importKidsCsv(rows);

      expect(result.importedCount).toBe(1);
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0].message).toContain('sudah ada');
    });
  });

  // VAL-MASTER-043: Kids CSV import
  describe('importKidsCsv', () => {
    it('should import kids and create guardians on-the-fly', async () => {
      const rows = [
        {
          name: 'Ani',
          dob: '2020-01-15',
          guardian_name: 'Siti',
          guardian_phone: '0811',
          guardian_email: 'siti@test.com',
        },
        {
          name: 'Budi',
          dob: '2019-05-20',
          guardian_name: 'Agus',
          guardian_phone: '0812',
          guardian_email: '',
        },
      ];

      vi.mocked(db.query.kid.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.guardian.findFirst).mockResolvedValue(undefined);
      setupInsertCounter();

      const result = await csvImportActions.importKidsCsv(rows);
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(2);
    });
  });

  // VAL-MASTER-044: Guardians CSV import
  describe('importGuardiansCsv', () => {
    it('should import guardians', async () => {
      const rows: Array<Record<string, string>> = [
        { name: 'Siti Rahma', phone: '08123456789', email: 'siti@test.com' },
        { name: 'Agus Prasetyo', phone: '08123456790' },
      ];

      vi.mocked(db.query.guardian.findFirst).mockResolvedValue(undefined);
      setupInsertCounter();

      const result = await csvImportActions.importGuardiansCsv(rows);
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(2);
    });

    it('should skip duplicate phone numbers', async () => {
      const rows = [
        { name: 'Siti', phone: '08123456789' },
        { name: 'Siti Lain', phone: '08123456789' },
      ];

      vi.mocked(db.query.guardian.findFirst)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          id: 'g1',
          name: 'Siti',
          phone: '08123456789',
          email: null,
          secondContactName: null,
          secondContactPhone: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        });

      const result = await csvImportActions.importGuardiansCsv(rows);
      expect(result.importedCount).toBe(1);
      expect(result.warnings.length).toBe(1);
    });
  });

  // VAL-MASTER-045: Teachers CSV import
  describe('importTeachersCsv', () => {
    it('should import teachers with role=teacher', async () => {
      const rows = [
        { name: 'Bambang Sutrisno', email: 'bambang@littlerabbani.com' },
        { name: 'Dewi Sartika', email: 'dewi@littlerabbani.com' },
      ];

      vi.mocked(db.query.user.findFirst).mockResolvedValue(undefined);
      setupInsertCounter();

      const result = await csvImportActions.importTeachersCsv(rows);
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(2);
    });

    it('should reject invalid email format', async () => {
      const rows = [{ name: 'Test', email: 'not-an-email' }];

      const result = await csvImportActions.importTeachersCsv(rows);
      expect(result.importedCount).toBe(0);
      expect(result.errors.length).toBe(1);
    });
  });

  // VAL-MASTER-046: Activity Catalog CSV import
  describe('importActivitiesCsv', () => {
    it('should import activities from CSV', async () => {
      const rows = [
        { name: 'Mewarnai', category: 'seni' },
        { name: 'Futsal', category: 'olahraga' },
      ];

      setupInsertCounter();

      const result = await csvImportActions.importActivitiesCsv(rows);
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(2);
    });

    it('should normalize invalid category to lainnya', async () => {
      const rows = [{ name: 'Activity X', category: 'invalid-cat' }];

      setupInsertCounter();

      const result = await csvImportActions.importActivitiesCsv(rows);
      expect(result.importedCount).toBe(1);
    });
  });

  // VAL-MASTER-047: Waiting List CSV import
  describe('importWaitingListCsv', () => {
    it('should import kids with status=waiting', async () => {
      const rows = [
        {
          name: 'Citra',
          dob: '2021-03-10',
          guardian_name: 'Dewi',
          guardian_phone: '0811',
        },
      ];

      vi.mocked(db.query.kid.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.guardian.findFirst).mockResolvedValue(undefined);
      setupInsertCounter();

      const result = await csvImportActions.importWaitingListCsv(rows);
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
    });
  });

  // VAL-MASTER-058 + Server Action role check for CSV import
  describe('CSV import role check', () => {
    it('should reject teacher from importing kids CSV', async () => {
      mockTeacherSession();
      const result = await csvImportActions.importKidsCsv([
        {
          name: 'Test',
          dob: '2020-01-01',
          guardian_name: 'Guard',
          guardian_phone: '0811',
        },
      ]);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].message).toContain('Owner');
    });
  });
});
