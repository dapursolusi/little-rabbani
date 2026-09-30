import { db } from '@/db';
import { subTheme } from '@/db/schema';
import { TemplateData, expandTemplate } from '@/utils/template';
import { eq } from 'drizzle-orm';

import {
  KID_APPETITE_LABELS,
  KID_ATTENDANCE_LABELS,
  KID_MOOD_LABELS,
} from '../constants';
import * as templateRepo from '../repositories/report-template';
import { DailyClassReport } from '../types';

export type GeneratedReport = {
  kidId: string;
  kidName: string;
  narrative: string;
};

export async function generateReportsForDCR(
  dcr: DailyClassReport
): Promise<GeneratedReport[]> {
  const tmpl = await templateRepo.findDefault();
  if (!tmpl) {
    throw new Error('Template laporan belum diatur.');
  }

  // Resolve sub-theme name
  let subThemeName = '';
  if (dcr.subThemeId) {
    const st = await db.query.subTheme.findFirst({
      where: eq(subTheme.id, dcr.subThemeId),
      columns: { name: true },
    });
    subThemeName = st?.name ?? '';
  }

  const template = tmpl.content;
  const results: GeneratedReport[] = [];

  for (const obs of dcr.observations) {
    if (obs.attendance !== 'present') continue;

    const data: TemplateData = {
      nickName: obs.kid.nickName ?? obs.kid.name,
      fullName: obs.kid.name,
      subThemeName,
      description: dcr.description ?? '',
      mood: obs.mood ? KID_MOOD_LABELS[obs.mood] : '',
      appetite: obs.appetite ? KID_APPETITE_LABELS[obs.appetite] : '',
      attendance: KID_ATTENDANCE_LABELS[obs.attendance],
      notes: obs.notes ?? '',
    };

    const narrative = expandTemplate(template, data);
    results.push({ kidId: obs.kidId, kidName: obs.kid.name, narrative });
  }

  return results;
}
