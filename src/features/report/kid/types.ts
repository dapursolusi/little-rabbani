import { MonthlyReportOutput } from '@/features/report/kid/ai/output.schema';
import * as kidReportRepo from '@/features/report/kid/repositories';
import * as monthlyReportService from '@/features/report/month/services';

export type MonthlyKidReportDetail = Awaited<
  ReturnType<typeof kidReportRepo.findMonthlyReport>
>;
export type MonthlyAcademicDetails =
  | Extract<
      Awaited<
        ReturnType<typeof monthlyReportService.getMonthlyAcademicDetails>
      >,
      { success: true }
    >['data']
  | undefined;

export type { MonthlyReportOutput };
