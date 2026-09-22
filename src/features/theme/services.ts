import * as themeRepo from './repositories';
import { SubThemeInput, ThemeInput } from './schema';

export async function getThemes(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const { search, limit = 50, offset = 0 } = params ?? {};
    const { items, total } = await themeRepo.findManyWithCount({
      search,
      limit,
      offset,
    });
    return { success: true as const, data: items, total };
  } catch (error) {
    console.error('getThemes', error);
    return { success: false as const, error: 'Gagal mengambil data tema' };
  }
}

export async function getTheme(id: string) {
  try {
    const result = await themeRepo.findById(id);
    if (!result) {
      return { success: false as const, error: 'Tema tidak ditemukan' };
    }
    return { success: true as const, data: result };
  } catch (error) {
    console.error('getTheme', error);
    return { success: false as const, error: 'Gagal mengambil data tema' };
  }
}

export async function createTheme(input: ThemeInput) {
  try {
    const newItem = await themeRepo.insert(input);
    return { success: true as const, data: newItem };
  } catch (error) {
    console.error('createTheme', error);
    return { success: false as const, error: 'Gagal membuat tema' };
  }
}

export async function updateTheme(id: string, input: ThemeInput) {
  try {
    const updated = await themeRepo.update(id, input);
    if (!updated) {
      return { success: false as const, error: 'Tema tidak ditemukan' };
    }
    return { success: true as const, data: updated };
  } catch (error) {
    console.error('updateTheme', error);
    return { success: false as const, error: 'Gagal memperbarui tema' };
  }
}

export async function deleteTheme(id: string) {
  try {
    const deleted = await themeRepo.remove(id);
    if (!deleted) {
      return { success: false as const, error: 'Tema tidak ditemukan' };
    }
    return { success: true as const, data: deleted };
  } catch (error) {
    console.error('deleteTheme', error);
    return { success: false as const, error: 'Gagal menghapus tema' };
  }
}

export async function getActiveThemes() {
  try {
    const items = await themeRepo.findMany();
    return { success: true as const, data: items };
  } catch (error) {
    console.error('getActiveThemes', error);
    return { success: false as const, error: 'Gagal mengambil data tema' };
  }
}

// ──────── SubTheme services ────────

export async function getSubThemes(params?: { themeId?: string }) {
  try {
    const items = await themeRepo.findSubThemes(params);
    return { success: true as const, data: items };
  } catch (error) {
    console.error('getSubThemes', error);
    return { success: false as const, error: 'Gagal mengambil data sub tema' };
  }
}

export async function getSubTheme(id: string) {
  try {
    const result = await themeRepo.findSubThemeById(id);
    if (!result) {
      return { success: false as const, error: 'Sub tema tidak ditemukan' };
    }
    return { success: true as const, data: result };
  } catch (error) {
    console.error('getSubTheme', error);
    return { success: false as const, error: 'Gagal mengambil data sub tema' };
  }
}

export async function createSubTheme(input: SubThemeInput) {
  try {
    const newItem = await themeRepo.insertSubTheme(input);
    return { success: true as const, data: newItem };
  } catch (error) {
    console.error('createSubTheme', error);
    return { success: false as const, error: 'Gagal membuat sub tema' };
  }
}

export async function updateSubTheme(id: string, input: SubThemeInput) {
  try {
    const updated = await themeRepo.updateSubTheme(id, input);
    if (!updated) {
      return { success: false as const, error: 'Sub tema tidak ditemukan' };
    }
    return { success: true as const, data: updated };
  } catch (error) {
    console.error('updateSubTheme', error);
    return { success: false as const, error: 'Gagal memperbarui sub tema' };
  }
}

export async function deleteSubTheme(id: string) {
  try {
    const deleted = await themeRepo.removeSubTheme(id);
    if (!deleted) {
      return { success: false as const, error: 'Sub tema tidak ditemukan' };
    }
    return { success: true as const, data: deleted };
  } catch (error) {
    console.error('deleteSubTheme', error);
    return { success: false as const, error: 'Gagal menghapus sub tema' };
  }
}

export async function getActiveSubThemes(params?: {
  themeId?: string;
  withTheme?: boolean;
}) {
  try {
    const items = await themeRepo.findActiveSubThemes(params);
    return { success: true as const, data: items };
  } catch (error) {
    console.error('getActiveSubThemes', error);
    return { success: false as const, error: 'Gagal mengambil data sub tema' };
  }
}
