// —————————— Monthly Report Status ——————————

export const MONTHLY_REPORT_STATUS = ['generated', 'edited', 'sent'] as const;
export type MonthlyReportStatus = (typeof MONTHLY_REPORT_STATUS)[number];
export const MONTHLY_REPORT_STATUS_LABELS: Record<MonthlyReportStatus, string> =
  {
    generated: 'AI Generated',
    edited: 'Diedit',
    sent: 'Terkirim',
  };
