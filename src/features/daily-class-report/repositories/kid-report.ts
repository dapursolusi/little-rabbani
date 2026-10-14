import { db } from '@/db';
import { dailyKidReport } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { DailyKidReportInput } from '../validation';

// Insert

export async function insert(input: DailyKidReportInput) {
  const [inserted] = await db.insert(dailyKidReport).values(input).returning({
    id: dailyKidReport.id,
    dcrObservationId: dailyKidReport.dcrObservationId,
    narrative: dailyKidReport.narrative,
    reportStatus: dailyKidReport.reportStatus,
    sentAt: dailyKidReport.sentAt,
  });
  return inserted;
}

// Find

export async function findByDcrObservationId(id: string) {
  return db.query.dailyKidReport.findFirst({
    where: eq(dailyKidReport.dcrObservationId, id),
    columns: { id: true, narrative: true, reportStatus: true },
  });
}

// Update

export async function update(
  id: string,
  input: Pick<DailyKidReportInput, 'narrative' | 'reportStatus' | 'sentAt'>
) {
  const [updated] = await db
    .update(dailyKidReport)
    .set(input)
    .where(eq(dailyKidReport.id, id))
    .returning({
      id: dailyKidReport.id,
      dcrObservationId: dailyKidReport.dcrObservationId,
      narrative: dailyKidReport.narrative,
      reportStatus: dailyKidReport.reportStatus,
      sentAt: dailyKidReport.sentAt,
    });
  return updated;
}

// Remove

export async function remove(id: string) {
  await db.delete(dailyKidReport).where(eq(dailyKidReport.id, id));
}
