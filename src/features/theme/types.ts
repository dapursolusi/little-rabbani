import { subTheme, theme } from '@/db/schema';

export type Theme = typeof theme.$inferSelect;

export type SubTheme = typeof subTheme.$inferSelect & {
  theme: Theme | null;
};
