// —————————— Monthly Report Status ——————————

export const MONTHLY_REPORT_STATUS = {
  GENERATED: 'generated',
  EDITED: 'edited',
  SENT: 'sent',
} as const;
export type MonthlyReportStatus =
  (typeof MONTHLY_REPORT_STATUS)[keyof typeof MONTHLY_REPORT_STATUS];
export const MONTHLY_REPORT_STATUS_VALUES = Object.values(
  MONTHLY_REPORT_STATUS
) as [MonthlyReportStatus, ...MonthlyReportStatus[]];
export const MONTHLY_REPORT_STATUS_LABELS: Record<MonthlyReportStatus, string> =
  {
    [MONTHLY_REPORT_STATUS.GENERATED]: 'AI Generated',
    [MONTHLY_REPORT_STATUS.EDITED]: 'Diedit',
    [MONTHLY_REPORT_STATUS.SENT]: 'Terkirim',
  };
