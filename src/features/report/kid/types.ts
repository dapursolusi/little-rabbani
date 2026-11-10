import { MonthlyReportOutput } from '@/features/report/kid/ai/output.schema';
import * as kidReportRepo from '@/features/report/kid/repositories';
import type * as kidReportService from '@/features/report/kid/services';

export type MonthlyKidReportDetail = Awaited<
  ReturnType<typeof kidReportRepo.findMonthlyReport>
>;

/** The page read's editor evidence — DCRs in the month plus the final-month flag. */
export type MonthlyAcademicDetails = Awaited<
  ReturnType<typeof kidReportService.getKidMonthlyReportPage>
>['academicDetails'];

export type { MonthlyReportOutput };
