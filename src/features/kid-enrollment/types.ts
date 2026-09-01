import { EnrollmentStatus } from '@/db/schema';
import { BaseDTOResponse } from '@/types';

import { ClassSession } from '../class-session/types';
import { Kid } from '../kid/types';
import { KidEnrollmentInput } from './schema';

export interface KidEnrollment
  extends BaseDTOResponse, Omit<KidEnrollmentInput, 'kids'> {
  kidId: string;
  status: EnrollmentStatus;
  kid: Kid;
  classSession: ClassSession;
}
