// —————————— Attendance ——————————
export const KID_ATTENDANCE = ['present', 'absent', 'excused', 'sick'] as const;
export type KidAttendance = (typeof KID_ATTENDANCE)[number];
export const KID_ATTENDANCE_LABELS: Record<KidAttendance, string> = {
  present: '⭐ Hadir',
  absent: '⛔ Absen',
  excused: '📝 Izin',
  sick: '😷 Sakit',
};

// —————————— Observation ——————————
export const KID_MOOD = [
  'happy',
  'angry',
  'sad',
  'fear',
  'bored',
  'shy',
] as const;
export type KidMood = (typeof KID_MOOD)[number];
export const KID_MOOD_LABELS: Record<KidMood, string> = {
  happy: '😄 Senang',
  angry: '😡 Marah',
  sad: '😢 Sedih',
  fear: '😨 Takut',
  bored: '😒 Bosan',
  shy: '🥺 Malu',
};

// —————————— Eating ——————————
export const KID_APPETITE = ['good', 'fair', 'small', 'none'] as const;
export type KidAppetite = (typeof KID_APPETITE)[number];
export const KID_APPETITE_LABELS: Record<KidAppetite, string> = {
  good: '🍱 Banyak',
  fair: '🥣 Cukup',
  small: '🥄 Sedikit',
  none: '❌ Tidak',
};

// —————————— Report Status ——————————
export const REPORT_STATUS = ['empty', 'ready', 'draft', 'sent'] as const;
export type ReportStatus = (typeof REPORT_STATUS)[number];
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  empty: 'Kosong',
  ready: 'Siap Dibuat',
  draft: 'Draft',
  sent: 'Terkirim',
};
// —————————— Report Status Badge Colors ——————————
export const REPORT_STATUS_BADGE: Record<ReportStatus, string> = {
  empty: 'bg-slate-200 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400',
  ready: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  sent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};
