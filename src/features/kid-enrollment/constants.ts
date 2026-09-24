export const ENROLLMENT_STATUS = ['waiting', 'enrolled'] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUS)[number];
export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  waiting: 'Dalam Waiting List',
  enrolled: 'Terdaftar',
};
