import { db } from '@/db';
import { reportTemplate } from '@/db/schema/report';
import { eq } from 'drizzle-orm';

const DEFAULT_TEMPLATE = `Assalamualaikum Bunda {{nickName}}

Hari ini di Little Rabbani, ananda belajar tentang {{subThemeName}}.

{{description}}

📋 Ringkasan harian {{nickName}}:
• Suasana hati: {{mood}}
• Nafsu makan: {{appetite}}
• Kehadiran: {{attendance}}

{{#if notes}}📝 Catatan guru:
{{notes}}{{/if}}

Terima kasih atas kepercayaan Bunda.
— Bu Guru`;

export async function seedDefaultTemplate() {
  const existing = await db.query.reportTemplate.findFirst({
    where: eq(reportTemplate.name, 'default'),
  });
  if (existing) return existing;

  const [inserted] = await db
    .insert(reportTemplate)
    .values({ name: 'default', content: DEFAULT_TEMPLATE })
    .returning();
  return inserted;
}
