import { BaseDTOResponse } from '@/types';

import { ClassSession } from '../class-session/types';
import { LeanKid } from '../kid/types';
import { Term } from '../term/types';
import { KidEnrollmentInput, KidToBeEnrolled } from './validation';

export interface KidEnrollment extends BaseDTOResponse, LeanKidEnrollment {
  kid: LeanKid;
  classSession: Pick<ClassSession, 'name'>;
  term: Pick<Term, 'name'>;
}

export interface LeanKidEnrollment
  extends Omit<KidEnrollmentInput, 'kids'>, KidToBeEnrolled {}
