import * as kidReportService from '@/features/report/kid/services';
import { Console } from '@hugeicons/core-free-icons';

import { handleActionError } from '@/lib/action/action-error';

import { MonthlyKidReportParams } from '../types';

export async function generateMonthlyReport(input: MonthlyKidReportParams) {
  try {
    const reportDraft = await kidReportService.generateMonthlyReport(input);
    return {
      success: true as const,
      data: reportDraft,
      message: 'Berhasil membuat laporan dengan AI',
    };
  } catch (error) {
    handleActionError(error);
  }
}
