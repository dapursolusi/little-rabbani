import * as repo from '../repositories/report-template';
import { seedDefaultTemplate } from './seed-template';

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

export async function saveTemplate(input: { content: string }) {
  try {
    const tmpl = await repo.upsert({ name: 'default', content: input.content });
    return { success: true as const, data: tmpl };
  } catch (error) {
    console.error('saveTemplate:', error);
    return { success: false as const, error: 'Gagal menyimpan template.' };
  }
}
