import {
  dailyClassReport,
  dailyKidReport,
  dcrObservation,
  reportTemplate,
} from '@/db/schema';

import { Kid } from '../kid/types';
import { SubTheme } from '../theme/types';

export type DailyClassReport = typeof dailyClassReport.$inferSelect & {
  observations?: DCRObservation[];
  subTheme?: SubTheme | null;
};

export type DCRObservation = typeof dcrObservation.$inferSelect & {
  kid?: Kid | null;
  kidReport?: DailyKidReport | null;
};

export type DailyKidReport = typeof dailyKidReport.$inferSelect;

export type ReportTemplate = typeof reportTemplate.$inferSelect;
