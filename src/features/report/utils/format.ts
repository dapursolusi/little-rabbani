import { MonthlyReportOutput } from '@/features/report/kid/ai/output.schema';

/**
 * Format a structured AI report output into the narrative text persisted in
 * `monthly_kid_report.narrative` and rendered in the editor textarea.
 */
export function formatDraft(draft: MonthlyReportOutput): string {
  return [
    draft.socialEmotional,
    '',
    draft.wellbeing,
    '',
    'Sorotan:',
    ...draft.highlights.map((h) => `- ${h}`),
    '',
    'Rekomendasi di rumah:',
    ...draft.homeRecommendations.map((r) => `- ${r}`),
  ].join('\n');
}
