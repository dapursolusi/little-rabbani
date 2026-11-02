import { subTheme, theme } from '@/db/schema';
import { DbTableAuditFields } from '@/types';

export type ThemeRecord = typeof theme.$inferSelect;
export type ThemeData = Omit<ThemeRecord, keyof DbTableAuditFields>;
export type Theme = ThemeData;
export type ThemeWithSubThemes = Theme & {
  subThemes: SubTheme[];
};

export type SubThemeRecord = typeof subTheme.$inferSelect;
export type SubThemeData = Omit<SubThemeRecord, keyof DbTableAuditFields>;
export type SubTheme = SubThemeData;
export type SubThemeList = SubTheme[];
export type SubThemeWithTheme = SubTheme & {
  theme: Theme;
};
