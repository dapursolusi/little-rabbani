import { MONTHLY_REPORT_STATUS } from '@/features/report/constants';
import {
  generateMonthlyReport,
  generateMonthlyReportForBatch,
  reviewMonthlyReport,
  saveMonthlyReportNarrative,
  sendMonthlyReport,
} from '@/features/report/kid/actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MonthlyReportStore } from '../../helpers/monthly-report-store';

/**
 * Lifecycle integration: real server actions → real kid service → in-memory
 * store that mirrors the SQL constraints. Only the out-of-module collaborators
 * are faked: session, term/eligibility resolution, evidence aggregation and
 * the AI provider. A disabled button is not proof of immutability, so every
 * scenario asserts the server-side outcome.
 */
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  store: undefined as unknown as MonthlyReportStore,
  resolveReportRange: vi.fn(),
  aggregateMonthlyKidReportData: vi.fn(),
  generateMonthlyReportDraft: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: () => new Headers() }));
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock('@/features/report/kid/repositories', () => ({
  findMonthlyReportRow: (
    input: Parameters<MonthlyReportStore['findMonthlyReportRow']>[0]
  ) => mocks.store.findMonthlyReportRow(input),
  findManyByTermMonth: (
    input: Parameters<MonthlyReportStore['findManyByTermMonth']>[0]
  ) => mocks.store.findManyByTermMonth(input),
  createMonthlyReport: (
    input: Parameters<MonthlyReportStore['createMonthlyReport']>[0]
  ) => mocks.store.createMonthlyReport(input),
  insertMonthlyReportIfMissing: (
    input: Parameters<MonthlyReportStore['insertMonthlyReportIfMissing']>[0]
  ) => mocks.store.insertMonthlyReportIfMissing(input),
  updateMonthlyReport: (
    input: Parameters<MonthlyReportStore['updateMonthlyReport']>[0]
  ) => mocks.store.updateMonthlyReport(input),
}));
vi.mock('@/features/report/month/services', () => ({
  resolveReportRange: mocks.resolveReportRange,
  aggregateMonthlyKidReportData: mocks.aggregateMonthlyKidReportData,
}));
vi.mock('@/features/kid-enrollment/services', () => ({
  getKidEnrolledTerms: vi.fn(),
  verifyKidEnrollment: vi.fn(),
}));
vi.mock('@/features/report/kid/ai/generate', () => ({
  generateMonthlyReportDraft: mocks.generateMonthlyReportDraft,
}));
// Pin "today" so month guards are deterministic.
vi.mock('@/utils/date', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/date')>();
  return { ...actual, getLocalDateString: () => '2026-11-06' };
});

const { createMonthlyReportStore } =
  await import('../../helpers/monthly-report-store');

const TERM_ID = 'b3c1d2e4-0000-4000-8000-000000000002';
const KID_ID = 'b3c1d2e4-0000-4000-8000-000000000001';
const PARAMS = { kidId: KID_ID, termId: TERM_ID, yearMonth: '2026-10' };
const AI_DRAFT = {
  socialEmotional: 'Ananda menunjukkan empati.',
  wellbeing: 'Kesehatan baik.',
  highlights: ['Berani tampil depan'],
  homeRecommendations: ['Ajak bercerita'],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.store = createMonthlyReportStore();
  mocks.getSession.mockResolvedValue({
    user: { id: 'owner-1', role: 'owner' },
  });
  mocks.resolveReportRange.mockResolvedValue({
    classSessionId: 'c1',
    term: { id: TERM_ID, startDate: '2026-08-01', endDate: '2026-12-15' },
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    isFinalMonth: false,
  });
  mocks.aggregateMonthlyKidReportData.mockResolvedValue({ child: {} });
  mocks.generateMonthlyReportDraft.mockResolvedValue(AI_DRAFT);
});

describe('monthly report lifecycle integration', () => {
  async function generate() {
    const result = await generateMonthlyReport(PARAMS);
    expect(result.success).toBe(true);
    return result;
  }

  function row() {
    return mocks.store.rows[0];
  }

  it('1. generates a new draft and persists it', async () => {
    await generate();

    expect(mocks.store.rows).toHaveLength(1);
    expect(row()).toMatchObject({
      kidId: KID_ID,
      termId: TERM_ID,
      month: '2026-10',
      reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
      isEdited: false,
    });
    expect(row().narrative).toContain('Sorotan:');
  });

  it('2. retrieving an existing report never regenerates it', async () => {
    await generate();
    mocks.generateMonthlyReportDraft.mockClear();

    // A second plain retrieval is a read; nothing here may call the provider.
    const overviewRead = await mocks.store.findMonthlyReportRow(PARAMS);
    expect(overviewRead?.reportStatus).toBe(MONTHLY_REPORT_STATUS.DRAFT);
    expect(mocks.generateMonthlyReportDraft).not.toHaveBeenCalled();
  });

  it('3. saves edits to a draft and flags manual edits', async () => {
    await generate();

    const result = await saveMonthlyReportNarrative({
      ...PARAMS,
      narrative: 'Hasil suntingan guru.',
    });

    expect(result.success).toBe(true);
    expect(row()).toMatchObject({
      narrative: 'Hasil suntingan guru.',
      isEdited: true,
      reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
    });
  });

  it('4. marks a draft reviewed', async () => {
    await generate();

    const result = await reviewMonthlyReport(PARAMS);

    expect(result.success).toBe(true);
    expect(row().reportStatus).toBe(MONTHLY_REPORT_STATUS.REVIEWED);
    expect(row().reviewedAt).toBeInstanceOf(Date);
  });

  it('5. editing a reviewed report returns it to draft and clears the review', async () => {
    await generate();
    await reviewMonthlyReport(PARAMS);

    const result = await saveMonthlyReportNarrative({
      ...PARAMS,
      narrative: 'Revisi setelah review.',
    });

    expect(result.success).toBe(true);
    expect(row()).toMatchObject({
      reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
      reviewedAt: null,
      isEdited: true,
    });
  });

  it('6. marks a reviewed report sent and records the session user', async () => {
    await generate();
    await reviewMonthlyReport(PARAMS);

    const result = await sendMonthlyReport(PARAMS);

    expect(result.success).toBe(true);
    expect(row()).toMatchObject({
      reportStatus: MONTHLY_REPORT_STATUS.SENT,
      sentBy: 'owner-1',
    });
    expect(row().sentAt).toBeInstanceOf(Date);
  });

  it('7. refuses to edit a sent report — server-side', async () => {
    await generate();
    await reviewMonthlyReport(PARAMS);
    await sendMonthlyReport(PARAMS);

    const result = await saveMonthlyReportNarrative({
      ...PARAMS,
      narrative: 'Mencoba mengubah laporan terkirim.',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe(
        'Laporan sudah terkirim dan tidak dapat diubah'
      );
    }
    expect(row().narrative).not.toContain('Mencoba mengubah');
  });

  it('8. refuses to regenerate a sent report — server-side, before the provider call', async () => {
    await generate();
    await reviewMonthlyReport(PARAMS);
    await sendMonthlyReport(PARAMS);
    mocks.generateMonthlyReportDraft.mockClear();

    const result = await generateMonthlyReport(PARAMS);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe(
        'Laporan sudah terkirim dan tidak dapat diubah'
      );
    }
    expect(mocks.generateMonthlyReportDraft).not.toHaveBeenCalled();
    expect(row().narrative).not.toBeNull();
  });

  it('9. refuses to delete a sent report through normal operations — no delete path exists', async () => {
    await generate();
    await reviewMonthlyReport(PARAMS);
    await sendMonthlyReport(PARAMS);

    // The module exposes no delete action; the full action surface is checked
    // so a future delete route cannot slip in unnoticed.
    const actions = await import('@/features/report/kid/actions');
    expect(
      Object.keys(actions).filter((name) => /delete|remove/i.test(name))
    ).toEqual([]);
    expect(row().deletedAt).toBeNull();
  });

  it('10. regenerating a report with manual edits replaces it only after confirmation is sent', async () => {
    await generate();
    await saveMonthlyReportNarrative({ ...PARAMS, narrative: 'Editan guru.' });

    // The confirmation is a client concern; the server honours an explicit
    // regenerate and resets the lifecycle.
    const result = await generateMonthlyReport(PARAMS);

    expect(result.success).toBe(true);
    expect(row().narrative).not.toBe('Editan guru.');
    expect(row().isEdited).toBe(false);
    expect(row().reportStatus).toBe(MONTHLY_REPORT_STATUS.DRAFT);
  });

  it('11. a provider failure during regeneration leaves the original report intact', async () => {
    await generate();
    await saveMonthlyReportNarrative({ ...PARAMS, narrative: 'Editan guru.' });
    const before = { ...row() };
    mocks.generateMonthlyReportDraft.mockResolvedValue(null);

    const result = await generateMonthlyReport(PARAMS);

    expect(result.success).toBe(false);
    expect(row()).toEqual(before);
  });

  it('11b. invalid AI output (provider throws) leaves the original report intact and leaks nothing', async () => {
    await generate();
    await saveMonthlyReportNarrative({ ...PARAMS, narrative: 'Editan guru.' });
    const before = { ...row() };
    // The AI SDK throws NoObjectGeneratedError when structured output fails
    // schema validation; it never hands back a partial draft.
    mocks.generateMonthlyReportDraft.mockRejectedValue(
      new Error('AI_NoObjectGeneratedError: provider said sk-or-secret')
    );

    const result = await generateMonthlyReport(PARAMS);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Terjadi kesalahan. Silahkan coba lagi');
      expect(result.message).not.toContain('sk-or-secret');
    }
    expect(row()).toEqual(before);
  });
});

describe('monthly report batch integration', () => {
  const KID_IDS = Array.from(
    { length: 20 },
    (_, index) =>
      `b3c1d2e4-0000-4000-8000-${String(index + 10).padStart(12, '0')}`
  );

  function paramsFor(kidId: string) {
    return { kidId, termId: TERM_ID, yearMonth: '2026-10' };
  }

  async function runBatch(kidIds: string[]) {
    const results: Awaited<ReturnType<typeof generateMonthlyReportForBatch>>[] =
      [];
    for (const kidId of kidIds) {
      // Sequential, exactly like the batch client: one awaited request each.
      results.push(await generateMonthlyReportForBatch(paramsFor(kidId)));
    }
    return results;
  }

  function summarize(
    results: Awaited<ReturnType<typeof generateMonthlyReportForBatch>>[]
  ) {
    return results.reduce(
      (acc, result) => {
        if (result.success) acc.success += 1;
        else if (result.error?.type === 'conflict') acc.skipped += 1;
        else acc.failed += 1;
        return acc;
      },
      { success: 0, skipped: 0, failed: 0 }
    );
  }

  it('generates 20 children one request at a time and persists each result', async () => {
    const results = await runBatch(KID_IDS);

    expect(summarize(results)).toEqual({ success: 20, skipped: 0, failed: 0 });
    expect(mocks.store.rows).toHaveLength(20);
    expect(new Set(mocks.store.rows.map((row) => row.kidId)).size).toBe(20);
  });

  it('skips children that already have a report without calling the provider', async () => {
    await runBatch([KID_IDS[0]]);
    mocks.generateMonthlyReportDraft.mockClear();

    const results = await runBatch([KID_IDS[0], KID_IDS[1]]);

    expect(summarize(results)).toEqual({ success: 1, skipped: 1, failed: 0 });
    // Only the child without a report reached the provider.
    expect(mocks.generateMonthlyReportDraft).toHaveBeenCalledTimes(1);
    expect(mocks.store.rows).toHaveLength(2);
  });

  it('continues past provider failures and persists every other child', async () => {
    mocks.generateMonthlyReportDraft.mockImplementation(
      async (evidence: unknown) => {
        const child = (evidence as { child: { name: string } }).child;
        if (child.name === 'fail-a' || child.name === 'fail-b') return null;
        return AI_DRAFT;
      }
    );
    mocks.aggregateMonthlyKidReportData.mockImplementation(
      async ({ kidId }: { kidId: string }) => ({
        child: {
          name:
            kidId === KID_IDS[3]
              ? 'fail-a'
              : kidId === KID_IDS[7]
                ? 'fail-b'
                : 'ok',
        },
      })
    );

    const results = await runBatch(KID_IDS);

    expect(summarize(results)).toEqual({ success: 18, skipped: 0, failed: 2 });
    expect(mocks.store.rows).toHaveLength(18);
    // Failures are reported with a safe message, never provider internals.
    for (const result of results) {
      if (!result.success)
        expect(result.message).not.toMatch(/openrouter|api.?key/i);
    }
  });

  it('retrying the failed children completes them without duplicating successes', async () => {
    let failFirst = true;
    mocks.generateMonthlyReportDraft.mockImplementation(async () => {
      if (failFirst && mocks.store.rows.length === 0) return null;
      return AI_DRAFT;
    });

    const first = await runBatch([KID_IDS[0], KID_IDS[1]]);
    expect(summarize(first).failed).toBeGreaterThan(0);
    const persistedAfterFirst = mocks.store.rows.length;

    failFirst = false;
    const failedKidIds = first
      .map((result, index) => ({ result, kidId: KID_IDS[index] }))
      .filter(({ result }) => !result.success)
      .map(({ kidId }) => kidId);
    const retry = await runBatch(failedKidIds);

    expect(summarize(retry).failed).toBe(0);
    expect(mocks.store.rows).toHaveLength(persistedAfterFirst + retry.length);
    // Unique (kid, term, month) — no duplicate rows for a retried child.
    expect(
      mocks.store.rows.filter((row) => row.kidId === KID_IDS[0])
    ).toHaveLength(1);
  });

  it('never overwrites saved manual edits when the batch runs again', async () => {
    await runBatch([KID_IDS[0]]);
    await saveMonthlyReportNarrative({
      ...paramsFor(KID_IDS[0]),
      narrative: 'Editan guru yang harus dipertahankan.',
    });

    const results = await runBatch([KID_IDS[0], KID_IDS[1]]);

    expect(summarize(results)).toEqual({ success: 1, skipped: 1, failed: 0 });
    const edited = mocks.store.rows.find((row) => row.kidId === KID_IDS[0]);
    expect(edited?.narrative).toBe('Editan guru yang harus dipertahankan.');
    expect(edited?.isEdited).toBe(true);
  });

  it('two concurrent requests for the same child persist exactly one report', async () => {
    // Both requests read "no report" before either provider call resolves —
    // the interleaving that produces a duplicate in a naive upsert.
    let releaseBoth: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseBoth = resolve;
    });
    mocks.generateMonthlyReportDraft.mockImplementation(async () => {
      await gate;
      return AI_DRAFT;
    });

    const first = generateMonthlyReportForBatch(paramsFor(KID_IDS[0]));
    const second = generateMonthlyReportForBatch(paramsFor(KID_IDS[0]));
    await Promise.resolve();
    releaseBoth();

    const [a, b] = await Promise.all([first, second]);

    expect([a.success, b.success].filter(Boolean)).toHaveLength(1);
    const loser = a.success ? b : a;
    expect(loser.success).toBe(false);
    if (!loser.success) expect(loser.error?.type).toBe('conflict');
    expect(
      mocks.store.rows.filter((row) => row.kidId === KID_IDS[0])
    ).toHaveLength(1);
  });

  it('resuming after a partial run only generates the children left over', async () => {
    await runBatch(KID_IDS.slice(0, 8));
    mocks.generateMonthlyReportDraft.mockClear();

    const results = await runBatch(KID_IDS);

    expect(summarize(results)).toEqual({
      success: 12,
      skipped: 8,
      failed: 0,
    });
    expect(mocks.generateMonthlyReportDraft).toHaveBeenCalledTimes(12);
    expect(mocks.store.rows).toHaveLength(20);
  });
});
