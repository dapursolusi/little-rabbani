import { Guardian } from '@/features/guardian/types';
import { Term } from '@/features/term/types';
import { BaseDataResponse } from '@/types';

import { KidFormData } from './schema';

export interface Kid extends BaseDataResponse, KidFormData {
  guardian: Guardian;
  enrolledTerm: Term | null;
}
