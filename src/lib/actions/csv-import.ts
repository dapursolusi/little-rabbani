'use server';

import { db } from '@/db';
import { activity, guardian, kid, user } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

import { requireOwner } from '@/lib/actions/utils';

export type CsvImportRowError = {
  line: number;
  message: string;
};

export type CsvImportResult = {
  success: boolean;
  importedCount: number;
  errors: CsvImportRowError[];
  warnings: CsvImportRowError[];
  message: string;
};

/**
 * CSV Import for Kids (name, dob, guardian_name, guardian_phone, guardian_email)
 * Creates guardian records on-the-fly if they don't exist.
 */
export async function importKidsCsv(
  rows: Array<Record<string, string>>
): Promise<CsvImportResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return {
      success: false,
      importedCount: 0,
      errors: [{ line: 0, message: auth.error }],
      warnings: [],
      message: auth.error,
    };
  }

  if (rows.length === 0) {
    return {
      success: false,
      importedCount: 0,
      errors: [],
      warnings: [],
      message: 'File CSV kosong',
    };
  }

  const errors: CsvImportRowError[] = [];
  const warnings: CsvImportRowError[] = [];
  let importedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const lineNum = i + 2; // +2 because row 1 is header
    const row = rows[i];
    const name = row.name?.trim();
    const dob = row.dob?.trim();
    const guardianName = row.guardian_name?.trim();
    const guardianPhone = row.guardian_phone?.trim();
    const guardianEmail = row.guardian_email?.trim();

    // Validate required fields
    if (!name) {
      errors.push({ line: lineNum, message: 'Nama murid kosong' });
      continue;
    }

    if (!dob) {
      errors.push({ line: lineNum, message: 'Tanggal lahir kosong' });
      continue;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dob)) {
      errors.push({
        line: lineNum,
        message: 'Format tanggal tidak valid (gunakan YYYY-MM-DD)',
      });
      continue;
    }

    if (!guardianName) {
      errors.push({ line: lineNum, message: 'Nama wali murid kosong' });
      continue;
    }

    if (!guardianPhone) {
      errors.push({ line: lineNum, message: 'Nomor telepon wali kosong' });
      continue;
    }

    // Check for duplicate kid name + dob
    const existingKid = await db.query.kid.findFirst({
      where: and(eq(kid.name, name), eq(kid.dob, dob)),
    });

    if (existingKid) {
      warnings.push({
        line: lineNum,
        message: `Nama dan tanggal lahir sudah ada — dilewati`,
      });
      continue;
    }

    // Find or create guardian
    let guardianId: string | null = null;

    // Try to find by exact name + phone
    const existingGuardian = await db.query.guardian.findFirst({
      where: and(
        eq(guardian.name, guardianName),
        eq(guardian.phone, guardianPhone)
      ),
    });

    if (existingGuardian) {
      guardianId = existingGuardian.id;
    } else {
      // Create new guardian
      try {
        const [newGuardian] = await db
          .insert(guardian)
          .values({
            name: guardianName,
            phone: guardianPhone,
            email: guardianEmail || null,
          })
          .returning();
        guardianId = newGuardian.id;
      } catch {
        errors.push({
          line: lineNum,
          message: 'Gagal membuat wali murid',
        });
        continue;
      }
    }

    // Create kid with waiting status
    try {
      await db.insert(kid).values({
        name,
        dob,
        guardianId,
        status: 'waiting',
      });
      importedCount++;
    } catch {
      errors.push({
        line: lineNum,
        message: 'Gagal membuat murid',
      });
    }
  }

  const importMsg = `${importedCount} murid berhasil diimpor`;
  const warningMsg =
    warnings.length > 0 ? `, ${warnings.length} peringatan (dilewati)` : '';
  const errorMsg = errors.length > 0 ? `, ${errors.length} baris error` : '';

  return {
    success: errors.length === 0 || importedCount > 0,
    importedCount,
    errors,
    warnings,
    message: `${importMsg}${warningMsg}${errorMsg}`,
  };
}

/**
 * CSV Import for Guardians (name, phone, email, second_contact_name, second_contact_phone)
 */
export async function importGuardiansCsv(
  rows: Array<Record<string, string>>
): Promise<CsvImportResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return {
      success: false,
      importedCount: 0,
      errors: [{ line: 0, message: auth.error }],
      warnings: [],
      message: auth.error,
    };
  }

  if (rows.length === 0) {
    return {
      success: false,
      importedCount: 0,
      errors: [],
      warnings: [],
      message: 'File CSV kosong',
    };
  }

  const errors: CsvImportRowError[] = [];
  const warnings: CsvImportRowError[] = [];
  let importedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const lineNum = i + 2;
    const row = rows[i];
    const name = row.name?.trim();
    const phone = row.phone?.trim();
    const email = row.email?.trim();
    const secondContactName = row.second_contact_name?.trim();
    const secondContactPhone = row.second_contact_phone?.trim();

    if (!name) {
      errors.push({ line: lineNum, message: 'Nama wali murid kosong' });
      continue;
    }

    if (!phone) {
      errors.push({
        line: lineNum,
        message: 'Nomor telepon wali murid kosong',
      });
      continue;
    }

    // Check for duplicate guardian by phone
    const existingGuardian = await db.query.guardian.findFirst({
      where: eq(guardian.phone, phone),
    });

    if (existingGuardian) {
      warnings.push({
        line: lineNum,
        message: `Nomor telepon sudah ada (${phone}) — dilewati`,
      });
      continue;
    }

    try {
      await db.insert(guardian).values({
        name,
        phone,
        email: email || null,
        secondContactName: secondContactName || null,
        secondContactPhone: secondContactPhone || null,
      });
      importedCount++;
    } catch {
      errors.push({
        line: lineNum,
        message: 'Gagal membuat wali murid',
      });
    }
  }

  return {
    success: errors.length === 0 || importedCount > 0,
    importedCount,
    errors,
    warnings,
    message: `${importedCount} wali murid berhasil diimpor${warnings.length > 0 ? `, ${warnings.length} peringatan (dilewati)` : ''}${errors.length > 0 ? `, ${errors.length} baris error` : ''}`,
  };
}

/**
 * CSV Import for Teachers (name, email)
 * Creates user records with role=teacher for Google OAuth.
 */
export async function importTeachersCsv(
  rows: Array<Record<string, string>>
): Promise<CsvImportResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return {
      success: false,
      importedCount: 0,
      errors: [{ line: 0, message: auth.error }],
      warnings: [],
      message: auth.error,
    };
  }

  if (rows.length === 0) {
    return {
      success: false,
      importedCount: 0,
      errors: [],
      warnings: [],
      message: 'File CSV kosong',
    };
  }

  const errors: CsvImportRowError[] = [];
  const warnings: CsvImportRowError[] = [];
  let importedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const lineNum = i + 2;
    const row = rows[i];
    const name = row.name?.trim();
    const email = row.email?.trim();

    if (!name) {
      errors.push({ line: lineNum, message: 'Nama guru kosong' });
      continue;
    }

    if (!email) {
      errors.push({ line: lineNum, message: 'Email guru kosong' });
      continue;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({
        line: lineNum,
        message: 'Format email tidak valid',
      });
      continue;
    }

    // Check for duplicate email
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUser) {
      warnings.push({
        line: lineNum,
        message: `Email sudah terdaftar (${email}) — dilewati`,
      });
      continue;
    }

    try {
      await db.insert(user).values({
        id: crypto.randomUUID(),
        name,
        email,
        role: 'teacher',
        emailVerified: false,
      });
      importedCount++;
    } catch {
      errors.push({
        line: lineNum,
        message: 'Gagal membuat akun guru',
      });
    }
  }

  return {
    success: errors.length === 0 || importedCount > 0,
    importedCount,
    errors,
    warnings,
    message: `${importedCount} guru berhasil diimpor${warnings.length > 0 ? `, ${warnings.length} peringatan (dilewati)` : ''}${errors.length > 0 ? `, ${errors.length} baris error` : ''}`,
  };
}

/**
 * CSV Import for Waiting List Kids (name, dob, guardian_name, guardian_phone)
 * Creates kids with status=waiting
 */
export async function importWaitingListCsv(
  rows: Array<Record<string, string>>
): Promise<CsvImportResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return {
      success: false,
      importedCount: 0,
      errors: [{ line: 0, message: auth.error }],
      warnings: [],
      message: auth.error,
    };
  }

  if (rows.length === 0) {
    return {
      success: false,
      importedCount: 0,
      errors: [],
      warnings: [],
      message: 'File CSV kosong',
    };
  }

  const errors: CsvImportRowError[] = [];
  const warnings: CsvImportRowError[] = [];
  let importedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const lineNum = i + 2;
    const row = rows[i];
    const name = row.name?.trim();
    const dob = row.dob?.trim();
    const guardianName = row.guardian_name?.trim();
    const guardianPhone = row.guardian_phone?.trim();

    if (!name) {
      errors.push({ line: lineNum, message: 'Nama murid kosong' });
      continue;
    }

    if (!dob) {
      errors.push({ line: lineNum, message: 'Tanggal lahir kosong' });
      continue;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dob)) {
      errors.push({
        line: lineNum,
        message: 'Format tanggal tidak valid (gunakan YYYY-MM-DD)',
      });
      continue;
    }

    if (!guardianName) {
      errors.push({ line: lineNum, message: 'Nama wali murid kosong' });
      continue;
    }

    if (!guardianPhone) {
      errors.push({ line: lineNum, message: 'Nomor telepon wali kosong' });
      continue;
    }

    // Check for duplicate kid name + dob
    const existingKid = await db.query.kid.findFirst({
      where: and(eq(kid.name, name), eq(kid.dob, dob)),
    });

    if (existingKid) {
      warnings.push({
        line: lineNum,
        message: `Nama dan tanggal lahir sudah ada — dilewati`,
      });
      continue;
    }

    // Find or create guardian
    let guardianId: string | null = null;

    const existingGuardian = await db.query.guardian.findFirst({
      where: and(
        eq(guardian.name, guardianName),
        eq(guardian.phone, guardianPhone)
      ),
    });

    if (existingGuardian) {
      guardianId = existingGuardian.id;
    } else {
      try {
        const [newGuardian] = await db
          .insert(guardian)
          .values({
            name: guardianName,
            phone: guardianPhone,
          })
          .returning();
        guardianId = newGuardian.id;
      } catch {
        errors.push({
          line: lineNum,
          message: 'Gagal membuat wali murid',
        });
        continue;
      }
    }

    try {
      await db.insert(kid).values({
        name,
        dob,
        guardianId,
        status: 'waiting',
      });
      importedCount++;
    } catch {
      errors.push({
        line: lineNum,
        message: 'Gagal membuat murid',
      });
    }
  }

  return {
    success: errors.length === 0 || importedCount > 0,
    importedCount,
    errors,
    warnings,
    message: `${importedCount} murid (waiting list) berhasil diimpor${warnings.length > 0 ? `, ${warnings.length} peringatan (dilewati)` : ''}${errors.length > 0 ? `, ${errors.length} baris error` : ''}`,
  };
}

/**
 * CSV Import for Activity Catalog (name, category)
 */
export async function importActivitiesCsv(
  rows: Array<Record<string, string>>
): Promise<CsvImportResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return {
      success: false,
      importedCount: 0,
      errors: [{ line: 0, message: auth.error }],
      warnings: [],
      message: auth.error,
    };
  }

  if (rows.length === 0) {
    return {
      success: false,
      importedCount: 0,
      errors: [],
      warnings: [],
      message: 'File CSV kosong',
    };
  }

  const VALID_CATEGORIES = [
    'seni',
    'olahraga',
    'musik',
    'bahasa',
    'matematika',
    'sains',
    'agama',
    'bermain',
    'outing',
    'lainnya',
  ] as const;

  const errors: CsvImportRowError[] = [];
  const warnings: CsvImportRowError[] = [];
  let importedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const lineNum = i + 2;
    const row = rows[i];
    const name = row.name?.trim();
    const category = (row.category?.trim() || 'lainnya').toLowerCase();

    if (!name) {
      errors.push({ line: lineNum, message: 'Nama aktivitas kosong' });
      continue;
    }

    const normalizedCategory = (VALID_CATEGORIES as readonly string[]).includes(
      category
    )
      ? category
      : 'lainnya';

    if (category !== normalizedCategory && category !== 'lainnya') {
      warnings.push({
        line: lineNum,
        message: `Kategori "${row.category}" tidak valid, menggunakan "Lainnya"`,
      });
    }

    try {
      await db.insert(activity).values({
        name,
        category: normalizedCategory as (typeof VALID_CATEGORIES)[number],
      });
      importedCount++;
    } catch {
      errors.push({
        line: lineNum,
        message: 'Gagal membuat aktivitas',
      });
    }
  }

  return {
    success: errors.length === 0 || importedCount > 0,
    importedCount,
    errors,
    warnings,
    message: `${importedCount} aktivitas berhasil diimpor${warnings.length > 0 ? `, ${warnings.length} peringatan` : ''}${errors.length > 0 ? `, ${errors.length} baris error` : ''}`,
  };
}
