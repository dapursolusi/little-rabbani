import { beforeEach, describe, expect, it, vi } from 'vitest';

// The provider boundary is the seam: this test proves the runtime contract
// that keeps one generation request inside the deployed function budget.
const mocks = vi.hoisted(() => ({
  generateText: vi.fn(),
}));

vi.mock('ai', () => ({
  generateText: mocks.generateText,
  Output: { object: (config: unknown) => config },
}));
vi.mock('@/features/report/kid/ai/model', () => ({
  generateReportModel: { modelId: 'test-model' },
}));

const AI_DRAFT = {
  socialEmotional: 'Ananda menunjukkan empati.',
  wellbeing: 'Kesehatan baik.',
  highlights: ['Berani tampil depan'],
  homeRecommendations: ['Ajak bercerita'],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.generateText.mockResolvedValue({ output: AI_DRAFT });
});

describe('generateMonthlyReportDraft — bounded provider call', () => {
  it('passes the evidence as the prompt and returns the structured output', async () => {
    const { generateMonthlyReportDraft } =
      await import('@/features/report/kid/ai/generate');

    const result = await generateMonthlyReportDraft({ child: { name: 'A' } });

    expect(result).toEqual(AI_DRAFT);
    expect(mocks.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: JSON.stringify({ child: { name: 'A' } }),
      })
    );
  });

  it('bounds the provider call with a total timeout inside the function budget', async () => {
    const { generateMonthlyReportDraft } =
      await import('@/features/report/kid/ai/generate');

    await generateMonthlyReportDraft({ child: {} });

    const options = mocks.generateText.mock.calls[0][0];
    expect(options.timeout.totalMs).toBeGreaterThan(0);
    // Vercel fluid compute default is 300s; leave room for DB work and retries.
    expect(options.timeout.totalMs).toBeLessThanOrEqual(120_000);
  });

  it('caps retries so a failing provider cannot multiply the request time', async () => {
    const { generateMonthlyReportDraft } =
      await import('@/features/report/kid/ai/generate');

    await generateMonthlyReportDraft({ child: {} });

    const options = mocks.generateText.mock.calls[0][0];
    expect(options.maxRetries).toBeLessThanOrEqual(1);
  });
});
