import { Output, generateText } from 'ai';

import { generateReportModel } from './model';
import { monthlyReportOutputSchema } from './output.schema';
import { monthlyReportInstructions } from './prompt';

// Vercel functions default to 300s; the batch client calls this once per
// child, so the whole request (DB reads + provider + write) must stay well
// inside that budget. A hung provider is worse than a failed child — the
// batch records the failure and the teacher retries it.
const PROVIDER_TIMEOUT_MS = 90_000;

export async function generateMonthlyReportDraft(evidence: unknown) {
  const { output } = await generateText({
    model: generateReportModel,
    instructions: monthlyReportInstructions,
    prompt: JSON.stringify(evidence),
    output: Output.object({
      schema: monthlyReportOutputSchema,
    }),
    // Attempt + one retry, all bounded by the total timeout above.
    maxRetries: 1,
    timeout: { totalMs: PROVIDER_TIMEOUT_MS },
  });

  return output;
}
