export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
} as const;
export type Gender = (typeof GENDER)[keyof typeof GENDER];
export const GENDER_VALUES = Object.values(GENDER) as [Gender, ...Gender[]];
export const GENDER_LABELS: Record<Gender, string> = {
  [GENDER.MALE]: 'Laki-laki',
  [GENDER.FEMALE]: 'Perempuan',
};

export const GUARDIAN_RELATIONSHIP = {
  MOTHER: 'mother',
  FATHER: 'father',
  OLDER_SIBLING: 'older_sibling',
  GRANDPARENT: 'grandparent',
  AUNT_UNCLE: 'aunt_uncle',
  OTHER: 'other',
} as const;
export type GuardianRelationship =
  (typeof GUARDIAN_RELATIONSHIP)[keyof typeof GUARDIAN_RELATIONSHIP];
export const GUARDIAN_RELATIONSHIP_VALUES = Object.values(
  GUARDIAN_RELATIONSHIP
) as [GuardianRelationship, ...GuardianRelationship[]];
export const GUARDIAN_RELATIONSHIP_LABELS: Record<
  GuardianRelationship,
  string
> = {
  [GUARDIAN_RELATIONSHIP.MOTHER]: 'Ibu',
  [GUARDIAN_RELATIONSHIP.FATHER]: 'Ayah',
  [GUARDIAN_RELATIONSHIP.OLDER_SIBLING]: 'Kakak',
  [GUARDIAN_RELATIONSHIP.GRANDPARENT]: 'Kakek / Nenek',
  [GUARDIAN_RELATIONSHIP.AUNT_UNCLE]: 'Bibi / Paman',
  [GUARDIAN_RELATIONSHIP.OTHER]: 'Wali',
};

export const ACTIVE_STATUS = {
  REGISTERED: 'registered',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;
export type ActiveStatus = (typeof ACTIVE_STATUS)[keyof typeof ACTIVE_STATUS];
export const ACTIVE_STATUS_VALUES = Object.values(ACTIVE_STATUS) as [
  ActiveStatus,
  ...ActiveStatus[],
];
export const ACTIVE_STATUS_LABELS: Record<ActiveStatus, string> = {
  [ACTIVE_STATUS.REGISTERED]: 'Terdaftar',
  [ACTIVE_STATUS.ACTIVE]: 'Aktif',
  [ACTIVE_STATUS.INACTIVE]: 'Tidak Aktif',
};
