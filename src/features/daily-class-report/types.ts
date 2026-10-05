import { dailyClassReport, dailyKidReport, dcrObservation } from '@/db/schema';

import { Kid } from '../kid/types';

export type DailyClassReport = typeof dailyClassReport.$inferSelect & {
  observations: DCRObservation[];
};

export type DCRObservation = typeof dcrObservation.$inferSelect & {
  kid: Pick<Kid, 'id' | 'name' | 'nickName'>;
  kidReport?: DailyKidReport;
};

export type DailyKidReport = typeof dailyKidReport.$inferSelect;
