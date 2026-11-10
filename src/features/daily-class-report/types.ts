import {
  dailyClassReport,
  dailyKidReport,
  dcrObservation,
  reportTemplate,
} from '@/db/schema';
import { DbTableAuditFields } from '@/types';

import { dcrRepo } from './repositories';

// Daily Class Report Types

export type DailyClassReportRecord = typeof dailyClassReport.$inferSelect;
export type DailyClassReportData = Omit<
  DailyClassReportRecord,
  keyof DbTableAuditFields
>;
export type DailyClassReport = Awaited<
  ReturnType<typeof dcrRepo.findMany>
>[number];

// DCR Observation Types

export type DcrObservationRecord = typeof dcrObservation.$inferSelect;
export type DcrObservationData = Omit<
  DcrObservationRecord,
  keyof DbTableAuditFields
>;
export type DcrObservation = DailyClassReport['observations'][number];
export type DcrObservationCaptureFields = Omit<
  DcrObservationData,
  'id' | 'kidId' | 'dcrId' | 'notes'
>;

// Daily Kid Report Types

export type DailyKidReportRecord = typeof dailyKidReport.$inferSelect;
export type DailyKidReportData = Omit<
  DailyKidReportRecord,
  keyof DbTableAuditFields
>;
export type DailyKidReport = NonNullable<DcrObservation['kidReport']>;

// Report Template Types

export type ReportTemplateRecord = typeof reportTemplate.$inferSelect;
export type ReportTemplateData = Omit<
  ReportTemplateRecord,
  keyof DbTableAuditFields
>;
export type ReportTemplate = ReportTemplateData;
