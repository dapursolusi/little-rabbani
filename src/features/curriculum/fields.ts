import type { SubTheme } from '@/features/theme/types';
import type { FormField } from '@/types/field';

export function curriculumFields(subThemes: SubTheme[]): FormField[] {
  return [
    {
      name: 'subThemeId',
      label: 'Sub Tema',
      type: 'select',
      required: true,
      selectOptions: subThemes.map((st) => ({
        value: st.id,
        label: st.theme ? `${st.theme.name} — ${st.name}` : st.name,
      })),
    },
    { name: 'name', label: 'Nama Aktivitas', type: 'text', required: true },
    { name: 'objective', label: 'Tujuan', type: 'text', required: false },
    {
      name: 'indoor',
      label: 'Lokasi',
      type: 'select',
      required: false,
      selectOptions: [
        { value: 'false', label: 'Outdoor' },
        { value: 'true', label: 'Indoor' },
      ],
    },
    {
      name: 'itemsToBring',
      label: 'Perlengkapan',
      type: 'text',
      required: false,
    },
  ];
}
