import { dailyClassReport, dcrObservation } from '@/db/schema';

export type DailyClassReport = typeof dailyClassReport.$inferSelect & {
  observations: DCRObservation[];
};

export type DCRObservation = typeof dcrObservation.$inferSelect;
