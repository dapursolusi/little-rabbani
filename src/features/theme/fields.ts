import type { Theme } from '@/features/theme/types';
import type { FormField } from '@/types/field';

export const themeFields: FormField[] = [
  { name: 'name', label: 'Nama Tema', type: 'text', required: true },
];

export function subThemeFields(themes: Theme[]): FormField[] {
  return [
    {
      name: 'themeId',
      label: 'Tema',
      type: 'select',
      required: true,
      selectOptions: themes.map((t) => ({ value: t.id, label: t.name })),
    },
    { name: 'name', label: 'Nama Sub Tema', type: 'text', required: true },
  ];
}
