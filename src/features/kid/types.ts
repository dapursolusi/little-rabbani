import { guardian, kid } from '@/db/schema';

// ponytail: lean subset of Kid (id, name) for guardian kids badges — not full Kid objects
export type LeanKid = Pick<Kid, 'id' | 'name'>;

export type Guardian = typeof guardian.$inferSelect & {
  kids: Kid[] | null;
};

export type Kid = typeof kid.$inferSelect & {
  guardian: Guardian | null;
};
