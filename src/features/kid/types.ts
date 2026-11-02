import { guardian, kid } from '@/db/schema';
import { DbTableAuditFields } from '@/types';

// Kid Type Definitions

export type KidRecord = typeof kid.$inferSelect;
export type KidData = Omit<KidRecord, keyof DbTableAuditFields>;
export type Kid = KidData;
export type LeanKid = Pick<Kid, 'id' | 'name' | 'nickName'>;
export type KidWithGuardian = Kid & { guardian: Guardian };

// Guardian Type Definitions

export type GuardianRecord = typeof guardian.$inferSelect;
export type GuardianData = Omit<GuardianRecord, keyof DbTableAuditFields>;
export type Guardian = GuardianData;
export type GuardianWithKids = Guardian & { kids: LeanKid[] | null };
