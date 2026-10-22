import {
  dailyClassReport,
  dailyKidReport,
  dcrObservation,
  reportTemplate,
} from '@/db/schema';
import { DbTableAuditFields } from '@/types';

import { Kid, LeanKid } from '../kid/types';
import { SubTheme } from '../theme/types';
import { dcrRepo } from './repositories';

export type DailyClassReport = typeof dailyClassReport.$inferSelect & {
  observations?: DCRObservation[];
  subTheme?: SubTheme | null;
};

export type DailyClassReportRecord = typeof dailyClassReport.$inferSelect;
export type DailyClassReportData = Omit<
  DailyClassReportRecord,
  keyof DbTableAuditFields
>;

export type DCRObservation = typeof dcrObservation.$inferSelect & {
  kid?: Kid | null;
  kidReport?: DailyKidReport | null;
};

export type DcrObservationRecord = typeof dcrObservation.$inferSelect;
export type DcrObservationData = Omit<
  DcrObservationRecord,
  keyof DbTableAuditFields
>;
export type DcrWithKidObservation = DailyClassReportData & {
  observations: DcrObservationData[] & { kid: LeanKid }[];
};

export type DailyKidReport = typeof dailyKidReport.$inferSelect;

export type ReportTemplate = typeof reportTemplate.$inferSelect;

export type DailyClassReportList = Awaited<ReturnType<typeof dcrRepo.findMany>>;

export type DailyClassReportItem = DailyClassReportList[number];

export type DcrObservationList = DailyClassReportItem['observations'];

export type DcrObservationItem = DcrObservationList[number];
export type DailyKidReportItem = NonNullable<DcrObservationItem['kidReport']>;
