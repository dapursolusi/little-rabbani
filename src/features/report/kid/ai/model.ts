import { openrouter } from '@/lib/ai/provider';

export const generateReportModel = openrouter(
  process.env.OPENROUTER_DEFAULT_MODEL ?? 'openai/gpt-6-luna',
  {
    extraBody: {
      provider: {
        data_collection: 'deny',
        zdr: true,
        require_parameters: true,
      },
    },
  }
);
