import { classSession } from '@/db/schema';
import { DbTableAuditFields } from '@/types';

export type ClassSessionRecord = typeof classSession.$inferSelect;
export type ClassSessionData = Omit<
  ClassSessionRecord,
  keyof DbTableAuditFields
>;
export type ClassSession = ClassSessionData;
export type LeanClassSession = Pick<ClassSession, 'id' | 'name'>;
