import {
  dailyClassReport,
  dailyKidReport,
  dcrObservation,
  reportTemplate,
} from '@/db/schema';

import { Kid } from '../kid/types';
import { SubTheme } from '../theme/types';
import { dcrRepo } from './repositories';

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

export type DailyClassReportList = Awaited<ReturnType<typeof dcrRepo.findMany>>;

export type DailyClassReportItem = DailyClassReportList[number];

export type DcrObservationList = DailyClassReportItem['observations'];

export type DcrObservationItem = DcrObservationList[number];
export type DailyKidReportItem = NonNullable<DcrObservationItem['kidReport']>;
