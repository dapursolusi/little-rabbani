import { subTheme, theme } from '@/db/schema';

export type Theme = typeof theme.$inferSelect & {
  subThemes?: SubTheme[] | null;
};

export type SubTheme = typeof subTheme.$inferSelect & {
  theme?: Theme | null;
};
