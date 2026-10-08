import { db } from '@/db';
import { reportTemplate } from '@/db/schema/report';
import { and, eq, isNull } from 'drizzle-orm';

export async function findDefault() {
  return await db.query.reportTemplate.findFirst({
    where: eq(reportTemplate.name, 'default'),
  });
}

export async function findById(id: string) {
  return await db.query.reportTemplate.findFirst({
    where: and(isNull(reportTemplate.deletedAt), eq(reportTemplate.id, id)),
    columns: {
      name: true,
      content: true,
    },
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
