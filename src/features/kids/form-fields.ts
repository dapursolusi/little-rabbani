import { GENDER_LABELS, GUARDIAN_RELATIONSHIP_LABELS } from '@/db/schema';
import { FormField } from '@/types/field';

export const kidFormFields = (): FormField[] => {
  return [
    {
      groupLabel: 'Data Wali/Orang Tua',
    },
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
