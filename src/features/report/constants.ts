// —————————— Monthly Report Status ——————————

export const MONTHLY_REPORT_STATUS = {
  DRAFT: 'draft',
  REVIEWED: 'reviewed',
  SENT: 'sent',
} as const;
export type MonthlyReportStatus =
  (typeof MONTHLY_REPORT_STATUS)[keyof typeof MONTHLY_REPORT_STATUS];
export const MONTHLY_REPORT_STATUS_VALUES = Object.values(
  MONTHLY_REPORT_STATUS
) as [MonthlyReportStatus, ...MonthlyReportStatus[]];
export const MONTHLY_REPORT_STATUS_LABELS: Record<MonthlyReportStatus, string> =
  {
    [MONTHLY_REPORT_STATUS.DRAFT]: 'Draft',
    [MONTHLY_REPORT_STATUS.REVIEWED]: 'Direview',
    [MONTHLY_REPORT_STATUS.SENT]: 'Terkirim',
  };
