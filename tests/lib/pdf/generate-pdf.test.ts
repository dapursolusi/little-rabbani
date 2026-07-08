import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @react-pdf/renderer
const mockRenderToBuffer = vi.fn();
vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: (...args: unknown[]) => mockRenderToBuffer(...args),
}));

// Mock the quarterly report document
vi.mock('@/lib/pdf/quarterly-report', () => ({
  QuarterlyReportDocument: () => null,
}));

const { generateQuarterlyPdf } = await import('@/lib/pdf/generate-pdf');

describe('generateQuarterlyPdf', () => {
  const sampleParams = {
    kidName: 'Ahmad',
    termName: 'Semester 1 2025',
    termPeriod: 'Januari — Juni 2025',
    sections: {
      changes: 'Perubahan yang terjadi',
      improvements: 'Peningkatan yang terlihat',
      recommendations: 'Rekomendasi',
    },
    stats: {
      attendancePercent: 85,
      totalSchoolDays: 100,
      daysPresent: 85,
      moodDistribution: { 4: 5, 5: 3 },
      appetiteDistribution: { good: 6, moderate: 2 },
      activityParticipation: { Mewarnai: 8, Menggambar: 5 },
      totalObservations: 8,
    },
    previousTermName: 'Semester 2 2024',
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns buffer when renderToBuffer succeeds', async () => {
    const mockBuffer = Buffer.from('PDF content');
    mockRenderToBuffer.mockResolvedValue(mockBuffer);

    const result = await generateQuarterlyPdf(sampleParams);

    expect(result).toBeInstanceOf(Buffer);
    expect(result?.toString()).toBe('PDF content');
  });

  it('returns null when renderToBuffer throws (normal error)', async () => {
    mockRenderToBuffer.mockRejectedValue(new Error('Render failed'));

    const result = await generateQuarterlyPdf(sampleParams);

    expect(result).toBeNull();
  });

  it('returns null when renderToBuffer times out (30s timeout via Promise.race)', async () => {
    // Simulate renderToBuffer hanging forever (never resolves)
    mockRenderToBuffer.mockImplementation(
      () =>
        new Promise<never>((_resolve) => {
          // Never resolves — timeout should catch it
        })
    );

    // The timeout is 30s, so we use vi.advanceTimersByTime to fast-forward
    vi.useFakeTimers();

    const resultPromise = generateQuarterlyPdf(sampleParams);

    // Advance time by 31 seconds to trigger the timeout
    await vi.advanceTimersByTimeAsync(31_000);

    const result = await resultPromise;

    expect(result).toBeNull();

    vi.useRealTimers();
  });

  it('fallback to HTML (null return) when PDF times out engages catch block', async () => {
    // Verify the catch block returns null on timeout by checking
    // that the timeout rejection is caught and not thrown
    mockRenderToBuffer.mockImplementation(
      () =>
        new Promise<never>((_resolve) => {
          // Never resolves — timeout should trigger rejection
        })
    );

    vi.useFakeTimers();

    // Should not throw — should return null via catch
    const resultPromise = generateQuarterlyPdf(sampleParams);
    await vi.advanceTimersByTimeAsync(31_000);
    const result = await resultPromise;

    expect(result).toBeNull();

    vi.useRealTimers();
  });
});
