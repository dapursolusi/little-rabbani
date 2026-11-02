import { ActionResult } from '@/types';

import { logger } from '@/lib/logger';

import { seedDefaultTemplate } from '../../../db/seeds/report-template';
import { reportTemplateRepo } from '../repositories';
import { ReportTemplate } from '../types';

export async function getDefaultTemplate() {
  await seedDefaultTemplate();

  const tmpl = await reportTemplateRepo.findDefault();
  if (!tmpl) {
    throw new Error('Template laporan belum diatur.');
  }
  return tmpl;
}

export async function getTemplateById(
  id: string
): Promise<ActionResult<Pick<ReportTemplate, 'name' | 'content'>>> {
  try {
    const template = await reportTemplateRepo.findById(id);
    if (!template)
      return {
        success: false as const,
        message: 'Template tidak ditemukan',
      };
    return {
      success: true as const,
      data: template,
    };
  } catch (error) {
    logger.error({ err: error }, 'getTemplateById');
    return {
      success: false as const,
      message: 'Gagal memuat template laporan',
    };
  }
}

export async function saveTemplate(input: { content: string }) {
  try {
    const tmpl = await reportTemplateRepo.upsert({
      name: 'default',
      content: input.content,
    });
    return { success: true as const, data: tmpl };
  } catch (error) {
    logger.error({ err: error }, 'saveTemplate');
    return { success: false as const, message: 'Gagal menyimpan template.' };
  }
}
