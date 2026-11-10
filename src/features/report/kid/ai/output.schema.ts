import { z } from 'zod';

export const monthlyReportOutputSchema = z.object({
  socialEmotional: z.string(),
  wellbeing: z.string(),
  highlights: z.array(z.string()),
  homeRecommendations: z.array(z.string()),
});

export type MonthlyReportOutput = z.infer<typeof monthlyReportOutputSchema>;
