import { ThemeListClient } from '@/features/theme/components/client';
import * as themeService from '@/features/theme/services';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Tema' };

export default async function ThemeListPage() {
  const [themes, subThemes] = await Promise.all([
    themeService.getThemesWithSubThemes(),
    themeService.getSubThemesWithTheme(),
  ]);

  return <ThemeListClient themes={themes} subThemes={subThemes} />;
}
