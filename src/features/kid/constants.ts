export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];
export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Laki-laki',
  female: 'Perempuan',
};

export const GUARDIAN_RELATIONSHIPS = [
  'mother',
  'father',
  'older_sibling',
  'grandparent',
  'aunt_uncle',
  'other',
] as const;
export type GuardianRelationship = (typeof GUARDIAN_RELATIONSHIPS)[number];

export const GUARDIAN_RELATIONSHIP_LABELS: Record<
  GuardianRelationship,
  string
> = {
  mother: 'Ibu',
  father: 'Ayah',
  older_sibling: 'Kakak',
  grandparent: 'Kakek / Nenek',
  aunt_uncle: 'Bibi / Paman',
  other: 'Wali',
};
