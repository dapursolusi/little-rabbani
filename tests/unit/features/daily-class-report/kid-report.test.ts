import {
  markReportAsSent,
  saveReportNarrative,
} from '@/features/daily-class-report/services/kid-report';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findObservationWithKid: vi.fn(),
  findDcrWithReportData: vi.fn(),
  findExistingReport: vi.fn(),
  insertReport: vi.fn(),
  updateReport: vi.fn(),
  removeReport: vi.fn(),
  findTemplate: vi.fn(),
}));

vi.mock('@/features/daily-class-report/repositories', () => ({
  dcrRepo: { findByIdWithReportData: mocks.findDcrWithReportData },
  dailyKidReportRepo: {
    findByDcrObservationId: mocks.findExistingReport,
    insert: mocks.insertReport,
    update: mocks.updateReport,
    remove: mocks.removeReport,
  },
  observationRepo: { findByIdWithKid: mocks.findObservationWithKid },
}));

vi.mock('@/features/daily-class-report/repositories/report-template', () => ({
  findDefault: mocks.findTemplate,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// Fixtures — chosen so the default narrative is deterministic.
// Template placeholders map 1:1 to fixture strings, so the rendered
// default is exactly DEFAULT (renderDailyReportTemplate runs for real).
const TEMPLATE = {
  id: 'T1',
  name: 'default',
  content: '{{nickName}}|{{description}}|{{subThemeName}}|{{notes}}',
};
const OBS = {
  id: 'OBS1',
  dcrId: 'DCR1',
  attendance: 'present',
  notes: 'Baik sekali',
  kid: { name: 'Dodi Ananda', nickName: 'Dodi' },
};
const DCR = { description: 'Kegiatan hari ini', subTheme: { name: 'Air' } };
// cleanseText appends a trailing period to description/notes during render,
// so the rendered default carries that punctuation.
const DEFAULT = 'Dodi|Kegiatan hari ini.|Air|Baik sekali.';
const EDITED = `${DEFAULT} (diedit)`;
const FIXED_NOW = new Date('2026-10-22T09:00:00Z');

const EDITED_ROW = {
  id: 'R1',
  dcrObservationId: 'OBS1',
  narrative: EDITED,
  reportStatus: 'edited' as const,
  sentAt: null as Date | null,
};
const SENT_ROW = {
  id: 'R1',
  dcrObservationId: 'OBS1',
  narrative: DEFAULT,
  reportStatus: 'sent' as const,
  sentAt: FIXED_NOW,
};

function seedContext({
  existing,
}: {
  existing?: typeof EDITED_ROW | typeof SENT_ROW;
}) {
  mocks.findObservationWithKid.mockResolvedValue(OBS);
  mocks.findDcrWithReportData.mockResolvedValue(DCR);
  mocks.findExistingReport.mockResolvedValue(existing);
  mocks.findTemplate.mockResolvedValue(TEMPLATE);
}

beforeEach(() => {
  mocks.insertReport.mockResolvedValue(EDITED_ROW);
  mocks.updateReport.mockResolvedValue(EDITED_ROW);
  mocks.removeReport.mockResolvedValue(undefined);
});

afterEach(() => vi.clearAllMocks());

describe('saveReportNarrative', () => {
  const editedInput = {
    dcrObservationId: 'OBS1',
    narrative: EDITED,
    reportStatus: 'edited',
    sentAt: null,
  } as const;
  const defaultInput = { ...editedInput, narrative: DEFAULT };

  it('rule 1: edited narrative + no existing report → inserts with status edited', async () => {
    seedContext({});

    const result = await saveReportNarrative(editedInput);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(EDITED_ROW);
    expect(mocks.insertReport).toHaveBeenCalledWith({
      dcrObservationId: 'OBS1',
      narrative: EDITED,
      reportStatus: 'edited',
    });
    expect(mocks.updateReport).not.toHaveBeenCalled();
    expect(mocks.removeReport).not.toHaveBeenCalled();
  });

  it('rule 2: edited narrative + existing report → updates with status edited', async () => {
    seedContext({ existing: EDITED_ROW });

    const result = await saveReportNarrative(editedInput);

    expect(result.success).toBe(true);
    expect(mocks.updateReport).toHaveBeenCalledWith('R1', {
      narrative: EDITED,
      reportStatus: 'edited',
    });
    expect(mocks.insertReport).not.toHaveBeenCalled();
    expect(mocks.removeReport).not.toHaveBeenCalled();
  });

  it('rule 3: default narrative + existing report → removes the report row', async () => {
    seedContext({ existing: EDITED_ROW });

    const result = await saveReportNarrative(defaultInput);

    expect(result).toEqual({
      success: true,
      message: 'Data sama dengan template',
      data: null,
    });
    expect(mocks.removeReport).toHaveBeenCalledWith('R1');
    expect(mocks.insertReport).not.toHaveBeenCalled();
    expect(mocks.updateReport).not.toHaveBeenCalled();
  });

  it('rule 4: default narrative + no existing report → no-op success', async () => {
    seedContext({});

    const result = await saveReportNarrative(defaultInput);

    expect(result).toEqual({
      success: true,
      message: 'Data sama dengan template',
      data: null,
    });
    expect(mocks.insertReport).not.toHaveBeenCalled();
    expect(mocks.updateReport).not.toHaveBeenCalled();
    expect(mocks.removeReport).not.toHaveBeenCalled();
  });

  it('rule 5: existing report already sent → rejects', async () => {
    seedContext({ existing: SENT_ROW });

    const result = await saveReportNarrative(editedInput);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.message).toContain('terkirim');
    expect(mocks.insertReport).not.toHaveBeenCalled();
    expect(mocks.updateReport).not.toHaveBeenCalled();
    expect(mocks.removeReport).not.toHaveBeenCalled();
  });
});

describe('markReportAsSent', () => {
  it('rule 6: no existing report → inserts with status sent + sentAt', async () => {
    seedContext({});
    mocks.insertReport.mockResolvedValue(SENT_ROW);

    const result = await markReportAsSent({
      dcrObservationId: 'OBS1',
      now: FIXED_NOW,
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(SENT_ROW);
    expect(mocks.insertReport).toHaveBeenCalledWith({
      dcrObservationId: 'OBS1',
      narrative: DEFAULT,
      reportStatus: 'sent',
      sentAt: FIXED_NOW,
    });
    expect(mocks.updateReport).not.toHaveBeenCalled();
  });

  it('rule 7: existing report edited → updates to sent + sentAt, keeps narrative', async () => {
    const editedRow = {
      id: 'R1',
      dcrObservationId: 'OBS1',
      narrative: 'custom draft narasi',
      reportStatus: 'edited' as const,
      sentAt: null,
    };
    seedContext({ existing: editedRow });

    const result = await markReportAsSent({
      dcrObservationId: 'OBS1',
      now: FIXED_NOW,
    });

    expect(result.success).toBe(true);
    // narrative: undefined → Drizzle skips the column, so the stored
    // edited narrative survives the transition to sent.
    expect(mocks.updateReport).toHaveBeenCalledWith('R1', {
      narrative: undefined,
      reportStatus: 'sent',
      sentAt: FIXED_NOW,
    });
    expect(mocks.insertReport).not.toHaveBeenCalled();
  });

  it('rule 8: existing report sent → idempotent no-op', async () => {
    seedContext({ existing: SENT_ROW });

    const result = await markReportAsSent({
      dcrObservationId: 'OBS1',
      now: FIXED_NOW,
    });

    expect(result).toEqual({
      success: true,
      message: 'Status laporan sudah terkirim sebelumnya',
      data: SENT_ROW,
    });
    expect(mocks.insertReport).not.toHaveBeenCalled();
    expect(mocks.updateReport).not.toHaveBeenCalled();
  });

  it('rule 9a: missing observation → fails with the right message', async () => {
    seedContext({});
    mocks.findObservationWithKid.mockResolvedValue(undefined);

    const result = await markReportAsSent({ dcrObservationId: 'OBS1' });

    expect(result).toEqual({
      success: false,
      message: 'Data observasi tidak ditemukan. Isi observasi terlebih dahulu',
    });
    expect(mocks.insertReport).not.toHaveBeenCalled();
    expect(mocks.updateReport).not.toHaveBeenCalled();
  });

  it('rule 9b: missing DCR → fails with the right message', async () => {
    seedContext({});
    mocks.findDcrWithReportData.mockResolvedValue(undefined);

    const result = await markReportAsSent({ dcrObservationId: 'OBS1' });

    expect(result).toEqual({
      success: false,
      message: 'Data laporan harian kelas tidak ditemukan',
    });
    expect(mocks.insertReport).not.toHaveBeenCalled();
    expect(mocks.updateReport).not.toHaveBeenCalled();
  });

  it('rule 9c: missing template → fails with the right message', async () => {
    seedContext({});
    mocks.findTemplate.mockResolvedValue(undefined);

    const result = await markReportAsSent({ dcrObservationId: 'OBS1' });

    expect(result).toEqual({
      success: false,
      message: 'Belum ada template yang disimpan',
    });
    expect(mocks.insertReport).not.toHaveBeenCalled();
    expect(mocks.updateReport).not.toHaveBeenCalled();
  });
});
