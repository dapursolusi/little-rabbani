import { openrouter } from '@/lib/ai/provider';

// Must match the variable `env.mjs` registers — an unregistered name is
// silently absent in production and swaps the model without any error.
const DEFAULT_MODEL = 'deepseek/deepseek-v4-flash';

export const generateReportModel = openrouter(
  process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
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
