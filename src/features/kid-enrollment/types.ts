import { kidEnrollment } from '@/db/schema';
import { DbTableAuditFields } from '@/types';

import { LeanClassSession } from '../class-session/types';
import { LeanKid } from '../kid/types';
import { LeanTerm } from '../term/types';

export type KidEnrollmentRecord = typeof kidEnrollment.$inferSelect;
export type KidEnrollmentData = Omit<
  KidEnrollmentRecord,
  keyof DbTableAuditFields
>;
export type KidEnrollment = KidEnrollmentData;
export type KidEnrollmentWithKid = KidEnrollment & { kid: LeanKid };
export type KidEnrollmentInsert = typeof kidEnrollment.$inferInsert;
export type KidEnrollmentWithRelations = KidEnrollment & {
  kid: LeanKid;
  classSession: LeanClassSession;
  term: LeanTerm;
};
