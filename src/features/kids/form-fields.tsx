import { GENDER_LABELS, GUARDIAN_RELATIONSHIP_LABELS } from '@/db/schema';
import { GuardianSearchResult } from '@/features/kids/actions';
import GuardianPicker from '@/features/kids/components/guardian-picker';
import { FormField } from '@/types/field';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type GuardianMode = 'new' | 'existing';

const GUARDIAN_MODE_TABS: { value: GuardianMode; label: string }[] = [
  { value: 'new', label: 'Daftar Wali Baru' },
  { value: 'existing', label: 'Pilih Wali yang Sudah Ada' },
];

const guardianModeField = (watch: (name: string) => unknown): FormField => {
  const mode = (watch('guardianMode') ?? 'new') as GuardianMode;
  return {
    type: 'custom',
    name: 'guardianMode',
    fullWidth: true,
    render: (ctx) => (
      <Tabs value={mode} onValueChange={(value) => ctx.field.onChange(value)}>
        <TabsList className="w-full!">
          {GUARDIAN_MODE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    ),
  };
};

export const kidFormFields = (
  watch: (name: string) => unknown,
  summary?: GuardianSearchResult
): FormField[] => {
  const mode = (watch('guardianMode') ?? 'new') as GuardianMode;

  const guardianFields: FormField[] =
    mode === 'existing'
      ? [
          {
            type: 'custom',
            name: 'guardianId',
            label: 'Wali yang sudah ada',
            fullWidth: true,
            render: (ctx) => (
              <GuardianPicker
                value={ctx.field.value as string | undefined}
                onChange={(id) => ctx.field.onChange(id)}
                invalid={ctx.fieldState.invalid}
                summary={summary}
              />
            ),
          },
        ]
      : [
          {
            name: 'guardian.name',
            label: 'Nama Wali/Orang Tua',
            type: 'text',
            required: true,
            fullWidth: true,
          },
          {
            name: 'guardian.phone',
            label: 'No. Telepon Wali/Orang Tua',
            type: 'text',
            required: true,
          },
          {
            name: 'guardian.email',
            label: 'Email Wali/Orang Tua',
            type: 'text',
            required: false,
          },
          {
            name: 'guardian.secondContactName',
            label: 'Nama Kontak Kedua Wali/Orang Tua',
            type: 'text',
            required: false,
          },
          {
            name: 'guardian.secondContactPhone',
            label: 'No. Telepon Kontak Kedua Wali/Orang Tua',
            type: 'text',
            required: false,
          },
        ];

  return [
    {
      groupLabel: 'Data Wali/Orang Tua',
    },
    guardianModeField(watch),
    ...guardianFields,
    {
      groupLabel: 'Data Murid/Anak',
    },
    {
      name: 'kid.name',
      label: 'Nama Lengkap Murid/Anak',
      type: 'text',
      required: true,
      fullWidth: true,
    },
    {
      name: 'kid.nickName',
      label: 'Nama Panggilan Murid/Anak',
      type: 'text',
      required: false,
    },
    {
      name: 'kid.gender',
      label: 'Jenis Kelamin Murid/Anak',
      type: 'select',
      selectOptions: Object.entries(GENDER_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      required: true,
    },
    {
      name: 'kid.dob',
      label: 'Tanggal Lahir Murid/Anak',
      type: 'date',
      required: true,
    },
    {
      name: 'kid.relationship',
      label: 'Hubungan dengan Murid/Anak',
      type: 'select',
      selectOptions: Object.entries(GUARDIAN_RELATIONSHIP_LABELS).map(
        ([value, label]) => ({
          value,
          label,
        })
      ),
      required: true,
    },
  ];
};
