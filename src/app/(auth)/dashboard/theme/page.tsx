import { getSubThemes, getThemes } from '@/features/theme/actions';
import { ThemeListClient } from '@/features/theme/components/client';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Tema' };

export default async function ThemeListPage() {
  const [themeResult, subThemeResult] = await Promise.all([
    getThemes(),
    getSubThemes(),
  ]);

  if (!themeResult.success || !subThemeResult.success) {
    return (
      <section className="p-4 text-center text-destructive">
        {!themeResult.success && themeResult.message}
        {!subThemeResult.success && subThemeResult.message}
      </section>
    );
  }

  return (
    <ThemeListClient
      themes={themeResult.data ?? []}
      subThemes={subThemeResult.data ?? []}
    />
  );
}
