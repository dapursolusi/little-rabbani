import type { Theme } from '@/features/theme/types';
import type { FormField } from '@/types/field';

export function themeFields(): FormField[] {
  return [
    { name: 'name', label: 'Nama Tema', type: 'text', required: true },
    { name: 'color', label: 'Warna', type: 'color', required: false },
  ];
}

export function subThemeFields(themes: Theme[]): FormField[] {
  return [
    { name: 'name', label: 'Nama Sub Tema', type: 'text', required: true },
    {
      name: 'themeId',
      label: 'Tema',
      type: 'select',
      required: true,
      selectOptions: themes.map((t) => ({ value: t.id, label: t.name })),
    },
  ];
}
