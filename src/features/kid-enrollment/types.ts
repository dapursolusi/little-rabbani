import { BaseDTOResponse } from '@/types';

import { ClassSession } from '../class-session/types';
import { Kid } from '../kid/types';
import { Term } from '../term/types';
import { KidEnrollmentInput, KidToBeEnrolled } from './schema';

export interface KidEnrollment extends BaseDTOResponse, LeanKidEnrollment {
  kid: Pick<Kid, 'id' | 'name'>;
  classSession: Pick<ClassSession, 'name'>;
  term: Pick<Term, 'name'>;
}

export interface LeanKidEnrollment
  extends Omit<KidEnrollmentInput, 'kids'>, KidToBeEnrolled {}
