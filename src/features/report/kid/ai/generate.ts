import { Output, generateText } from 'ai';

import { generateReportModel } from './model';
import { monthlyReportOutputSchema } from './output.schema';
import { monthlyReportInstructions } from './prompt';

export async function generateMonthlyReportDraft(evidence: unknown) {
  const { output } = await generateText({
    model: generateReportModel,
    instructions: monthlyReportInstructions,
    prompt: JSON.stringify(evidence),
    output: Output.object({
      schema: monthlyReportOutputSchema,
    }),
  });

  return output;
}
