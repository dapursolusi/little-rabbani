export const ENROLLMENT_STATUS = {
  WAITING: 'waiting',
  ENROLLED: 'enrolled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type EnrollmentStatus =
  (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];
export const ENROLLMENT_STATUS_VALUES = Object.values(ENROLLMENT_STATUS) as [
  EnrollmentStatus,
  ...EnrollmentStatus[],
];
export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  [ENROLLMENT_STATUS.WAITING]: 'Dalam Waiting List',
  [ENROLLMENT_STATUS.ENROLLED]: 'Terdaftar',
  [ENROLLMENT_STATUS.COMPLETED]: 'Selesai',
  [ENROLLMENT_STATUS.CANCELLED]: 'Dibatalkan',
};
