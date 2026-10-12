import { db } from '@/db';
import { dailyKidReport } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { DailyKidReportInput } from '../validation';

// Insert

export async function insert(input: DailyKidReportInput) {
  await db.insert(dailyKidReport).values(input);
}

// Find
export async function findByDcrObservationId(id: string) {
  return db.query.dailyKidReport.findFirst({
    where: eq(dailyKidReport.dcrObservationId, id),
    columns: { id: true },
  });
}

// Update

export async function update(
  id: string,
  input: Pick<DailyKidReportInput, 'narrative' | 'reportStatus' | 'sentAt'>
) {
  await db.update(dailyKidReport).set(input).where(eq(dailyKidReport.id, id));
}

// Remove

export async function remove(id: string) {
  await db.delete(dailyKidReport).where(eq(dailyKidReport.id, id));
}
