import { dailyClassReport, dcrObservation } from '@/db/schema';

import { Kid } from '../kid/types';

export type DailyClassReport = typeof dailyClassReport.$inferSelect & {
  observations: DCRObservation[];
};

export type DCRObservation = typeof dcrObservation.$inferSelect & {
  kid: Partial<Kid>;
};
