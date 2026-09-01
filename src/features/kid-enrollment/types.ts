import { BaseDTOResponse } from '@/types';

import { ClassSession } from '../class-session/types';
import { Kid } from '../kid/types';
import { Term } from '../term/types';
import { UpdateKidEnrollmentInput } from './schema';

export interface KidEnrollment
  extends BaseDTOResponse, InsertDbKidEnrollmentInput {
  kid: Pick<Kid, 'name'>;
  classSession: Pick<ClassSession, 'name'>;
  term: Pick<Term, 'name'>;
}

export type InsertDbKidEnrollmentInput = UpdateKidEnrollmentInput;
