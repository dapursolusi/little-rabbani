import { BaseDTOResponse } from '@/types';

import { Kid } from '../kid/types';
import { TermInput } from './validation';

export interface Term extends BaseDTOResponse, TermInput {
  isAutoCreated: boolean;
}

export interface TermWithEnrollments extends Term {
  kids: Kid[];
}
