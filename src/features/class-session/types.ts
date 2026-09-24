import { BaseDTOResponse } from '@/types';

import { ClassSessionInput } from './validation';

export interface ClassSession extends BaseDTOResponse, ClassSessionInput {}
