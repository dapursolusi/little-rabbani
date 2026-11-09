import { afterEach, describe, expect, it, vi } from 'vitest';

// The model id is a deployment input: it must come from the variable that
// `env.mjs` registers and `.env.example` documents. A typo here silently
// swaps in a model the provider does not serve.
const REGISTERED_VAR = 'OPENROUTER_MODEL';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('generateReportModel configuration', () => {
  it('reads the registered OPENROUTER_MODEL variable', async () => {
    vi.stubEnv(REGISTERED_VAR, 'vendor/model-from-env');
    vi.resetModules();

    const { generateReportModel } =
      await import('@/features/report/kid/ai/model');

    expect(generateReportModel.modelId).toBe('vendor/model-from-env');
  });

  it('falls back to the documented default model, never the unregistered variable', async () => {
    vi.stubEnv(REGISTERED_VAR, '');
    vi.stubEnv('OPENROUTER_DEFAULT_MODEL', '');
    vi.resetModules();

    const { generateReportModel } =
      await import('@/features/report/kid/ai/model');

    // Same default as env.mjs / .env.example.
    expect(generateReportModel.modelId).toBe('deepseek/deepseek-v4-flash');
  });
});
