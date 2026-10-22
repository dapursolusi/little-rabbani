export const ENROLLMENT_STATUS = [
  'waiting',
  'enrolled',
  'completed',
  'cancelled',
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUS)[number];
export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  waiting: 'Dalam Waiting List',
  enrolled: 'Terdaftar',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};
