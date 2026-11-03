// —————————— Attendance ——————————
export const KID_ATTENDANCE = {
  PRESENT: 'present',
  ABSENT: 'absent',
  EXCUSED: 'excused',
  SICK: 'sick',
} as const;
export type KidAttendance =
  (typeof KID_ATTENDANCE)[keyof typeof KID_ATTENDANCE];
export const KID_ATTENDANCE_VALUES = Object.values(KID_ATTENDANCE) as [
  KidAttendance,
  ...KidAttendance[],
];
export const KID_ATTENDANCE_LABELS: Record<KidAttendance, string> = {
  [KID_ATTENDANCE.PRESENT]: '⭐ Hadir',
  [KID_ATTENDANCE.ABSENT]: '⛔ Absen',
  [KID_ATTENDANCE.EXCUSED]: '📝 Izin',
  [KID_ATTENDANCE.SICK]: '😷 Sakit',
};

// —————————— Observation ——————————
export const KID_MOOD = {
  HAPPY: 'happy',
  ANGRY: 'angry',
  SAD: 'sad',
  FEAR: 'fear',
  BORED: 'bored',
  SHY: 'shy',
} as const;
export type KidMood = (typeof KID_MOOD)[keyof typeof KID_MOOD];
export const KID_MOOD_VALUES = Object.values(KID_MOOD) as [
  KidMood,
  ...KidMood[],
];
export const KID_MOOD_LABELS: Record<KidMood, string> = {
  [KID_MOOD.HAPPY]: '😄 Senang',
  [KID_MOOD.ANGRY]: '😡 Marah',
  [KID_MOOD.SAD]: '😢 Sedih',
  [KID_MOOD.FEAR]: '😨 Takut',
  [KID_MOOD.BORED]: '😒 Bosan',
  [KID_MOOD.SHY]: '🥺 Malu',
};

// —————————— Eating ——————————
export const KID_APPETITE = {
  GOOD: 'good',
  FAIR: 'fair',
  SMALL: 'small',
  NONE: 'none',
} as const;
export type KidAppetite = (typeof KID_APPETITE)[keyof typeof KID_APPETITE];
export const KID_APPETITE_VALUES = Object.values(KID_APPETITE) as [
  KidAppetite,
  ...KidAppetite[],
];
export const KID_APPETITE_LABELS: Record<KidAppetite, string> = {
  [KID_APPETITE.GOOD]: '🍱 Banyak',
  [KID_APPETITE.FAIR]: '🥣 Cukup',
  [KID_APPETITE.SMALL]: '🥄 Sedikit',
  [KID_APPETITE.NONE]: '❌ Tidak',
};

// —————————— Report Status ——————————
export const REPORT_STATUS = {
  DRAFT: 'draft',
  TEMPLATE: 'template',
  EDITED: 'edited',
  SENT: 'sent',
} as const;
export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];
export const REPORT_STATUS_VALUES = Object.values(REPORT_STATUS) as [
  ReportStatus,
  ...ReportStatus[],
];
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [REPORT_STATUS.DRAFT]: 'Draft (Belum Disimpan)',
  [REPORT_STATUS.TEMPLATE]: 'Draft (Template)',
  [REPORT_STATUS.EDITED]: 'Draft (Telah Diedit)',
  [REPORT_STATUS.SENT]: 'Terkirim',
};
// —————————— Report Status Badge Colors ——————————
export const REPORT_STATUS_BADGE: Record<ReportStatus, string> = {
  [REPORT_STATUS.DRAFT]:
    'bg-slate-100 text-slate-500 dark:bg-slate-900/ dark:text-slate-400',
  [REPORT_STATUS.TEMPLATE]:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  [REPORT_STATUS.EDITED]:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  [REPORT_STATUS.SENT]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};
