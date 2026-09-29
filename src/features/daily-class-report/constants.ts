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
