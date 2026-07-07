import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock env.mjs before importing ai.ts (it uses the same relative path)
vi.mock('../../env.mjs', () => ({
  env: {
    OPENROUTER_API_KEY: 'test-key-12345',
    OPENROUTER_MODEL: 'deepseek/deepseek-v4-flash',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocking
const { generateNarrative } = await import('@/lib/ai');

describe('generateNarrative', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const sampleContext = {
    kidName: 'Ahmad',
    mood: 4,
    appetite: 'good' as const,
    activities: ['Mewarnai', 'Bermain bola', 'Menyanyi'],
    notes: 'Ahmad sangat bersemangat hari ini',
  };

  const openRouterSuccessResponse = {
    choices: [
      {
        message: {
          content:
            'Bu/Pak, hari ini Ananda Ahmad bersekolah dengan penuh semangat. Mood Ahmad sangat baik dengan tingkat 4 dari 5. Beliau mengikuti kegiatan mewarnai, bermain bola, dan menyanyi dengan antusias.\n\nNafsu makan Ahmad hari ini baik. Beliau menghabiskan bekalnya dengan lahap.\n\nGuru mencatat bahwa Ahmad sangat bersemangat hari ini. Kami bersyukur melihat perkembangan positif pada Ananda Ahmad. Semoga Ananda Ahmad tetap sehat dan bersemangat belajar.',
        },
      },
    ],
  };

  it('returns a Bahasa Indonesia narrative when API succeeds', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(openRouterSuccessResponse),
    });

    const result = await generateNarrative(sampleContext);

    expect(result).toBeTruthy();
    expect(result).toContain('Ahmad');
    expect(result.length).toBeGreaterThan(50);

    // Verify fetch was called with correct OpenRouter API
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[0]).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(callArgs[1].method).toBe('POST');
    expect(callArgs[1].headers.Authorization).toContain('Bearer ');
  });

  it('includes kid context data in the API prompt', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(openRouterSuccessResponse),
    });

    await generateNarrative(sampleContext);

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages.find(
      (m: { role: string }) => m.role === 'user'
    ).content;

    expect(userMessage).toContain('Ahmad');
    expect(userMessage).toContain('4');
    expect(userMessage).toContain('baik');
    expect(userMessage).toContain('Mewarnai');
    expect(userMessage).toContain('Bermain bola');
    expect(userMessage).toContain('sangat bersemangat');

    // The system message should include language instruction
    const systemMessage = requestBody.messages.find(
      (m: { role: string }) => m.role === 'system'
    ).content;
    expect(systemMessage).toContain('Bahasa Indonesia');
    expect(systemMessage).toContain('2-3 paragraf');
    expect(systemMessage).toContain('wali murid');
  });

  it('returns empty string on API failure (graceful fallback)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await generateNarrative(sampleContext);

    expect(result).toBe('');
  });

  it('returns empty string on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const result = await generateNarrative(sampleContext);

    expect(result).toBe('');
  });

  it('tries fallback model when primary model fails', async () => {
    // Primary fails, fallback succeeds
    mockFetch
      .mockRejectedValueOnce(new Error('Primary model failed'))
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content:
                    'Bu/Pak, berikut laporan Ananda Ahmad untuk hari ini...',
                },
              },
            ],
          }),
      });

    const result = await generateNarrative(sampleContext);

    expect(result).toBeTruthy();
    expect(result).toContain('Ahmad');
    // Verify fallback was called with a different model
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('returns empty string when all models in fallback chain fail', async () => {
    // All models fail
    mockFetch.mockRejectedValue(new Error('API unavailable'));

    const result = await generateNarrative(sampleContext);

    expect(result).toBe('');
  });

  it('handles empty activities gracefully', async () => {
    const contextWithoutActivities = {
      ...sampleContext,
      activities: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content:
                  'Bu/Pak, hari ini Ananda Ahmad hadir dengan mood yang baik...',
              },
            },
          ],
        }),
    });

    const result = await generateNarrative(contextWithoutActivities);

    expect(result).toBeTruthy();
    // The prompt should still be constructed even without activities
    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages.find(
      (m: { role: string }) => m.role === 'user'
    ).content;
    expect(userMessage).toContain('Ahmad');
  });

  it('handles absent kids appropriately', async () => {
    const absentContext = {
      ...sampleContext,
      presence: 'absent' as const,
      absenceReason: 'sick' as const,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content:
                  'Bu/Pak, hari ini Ananda Ahmad tidak dapat hadir dikarenakan sakit...',
              },
            },
          ],
        }),
    });

    const result = await generateNarrative(absentContext);

    expect(result).toBeTruthy();
    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages.find(
      (m: { role: string }) => m.role === 'user'
    ).content;
    expect(userMessage).toContain('tidak hadir');
    expect(userMessage).toContain('sakit');
  });

  it('uses the model from OPENROUTER_MODEL env var in API request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(openRouterSuccessResponse),
    });

    await generateNarrative(sampleContext);

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.model).toBe('deepseek/deepseek-v4-flash');
  });

  it('uses OPENROUTER_API_KEY in authorization header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(openRouterSuccessResponse),
    });

    await generateNarrative(sampleContext);

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer test-key-12345');
    expect(headers['HTTP-Referer']).toBe('http://localhost:3000');
    expect(headers['X-Title']).toBeTruthy();
  });
});
