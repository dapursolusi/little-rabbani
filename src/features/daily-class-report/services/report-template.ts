import { ActionResult } from '@/types';

import { seedDefaultTemplate } from '../../../db/seeds/report-template';
import { reportTemplateRepo } from '../repositories';
import * as repo from '../repositories/report-template';
import { ReportTemplate } from '../types';

export async function getDefaultTemplate() {
  try {
    // Seed default on first read if not exists
    await seedDefaultTemplate();

    const tmpl = await repo.findDefault();
    if (!tmpl) {
      return {
        success: false as const,
        error: 'Template laporan belum diatur.',
      };
    }
    return { success: true as const, data: tmpl };
  } catch (error) {
    console.error('getDefaultTemplate:', error);
    return { success: false as const, error: 'Gagal memuat template laporan.' };
  }
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
    console.error('getTemplateByid: ', error);
    return {
      success: false as const,
      message: 'Gagal memuat template laporan',
    };
  }
}

export async function saveTemplate(input: { content: string }) {
  try {
    const tmpl = await repo.upsert({ name: 'default', content: input.content });
    return { success: true as const, data: tmpl };
  } catch (error) {
    console.error('saveTemplate:', error);
    return { success: false as const, message: 'Gagal menyimpan template.' };
  }
}
