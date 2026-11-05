import { term } from '@/db/schema';
import { DbTableAuditFields } from '@/types';

import { Kid } from '../kid/types';

export interface TermWithEnrollments extends Term {
  kids: Kid[];
}

export type TermRecord = typeof term.$inferSelect;
export type TermData = Omit<TermRecord, keyof DbTableAuditFields>;
export type Term = TermData;
export type LeanTerm = Pick<Term, 'id' | 'name'>;
