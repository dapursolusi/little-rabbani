import { db } from '@/db';
import { reportTemplate } from '@/db/schema/report-template';
import { eq } from 'drizzle-orm';

export async function findDefault() {
  return await db.query.reportTemplate.findFirst({
    where: eq(reportTemplate.name, 'default'),
  });
}

export async function upsert(input: { name: string; content: string }) {
  const existing = await findDefault();
  if (existing) {
    const [updated] = await db
      .update(reportTemplate)
      .set({ content: input.content, updatedAt: new Date() })
      .where(eq(reportTemplate.id, existing.id))
      .returning();
    return updated;
  }
  const [inserted] = await db.insert(reportTemplate).values(input).returning();
  return inserted;
}
