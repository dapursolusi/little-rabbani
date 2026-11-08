import { MONTHLY_REPORT_STATUS } from '@/features/report/constants';
import KidReportClient from '@/features/report/kid/components/client';
import { MonthlyKidReportDetail } from '@/features/report/kid/types';
import { Term } from '@/features/term/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const PLACEHOLDER = 'Buat draft dengan AI, atau tulis manual di sini';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/features/report/kid/actions', () => ({
  generateMonthlyReport: vi.fn(),
  saveMonthlyReportNarrative: vi.fn(),
  reviewMonthlyReport: vi.fn(),
  sendMonthlyReport: vi.fn(),
}));
vi.mock('@/contexts/ongoing-term', () => ({
  useOngoingTerm: () => ({ ongoingTerm: null, isLoading: false }),
}));

const TERM: Term = {
  id: 't1',
  name: 'Term 1',
  startDate: '2026-08-01',
  endDate: '2026-10-31',
  isAutoCreated: false,
};

// Only the fields the client reads are populated; the rest is what the query
// shape guarantees but this UI never touches.
const KID_DETAILS = {
  id: 'k1',
  name: 'Ananda',
  nickName: 'Anda',
  enrollments: [],
  dcrObservations: [],
  monthlyReports: [],
} as unknown as MonthlyKidReportDetail;

const ACADEMIC_DETAILS = { dcrs: [], isFinalMonth: false };

function renderClient(props: Partial<Parameters<typeof KidReportClient>[0]>) {
  return render(
    <KidReportClient
      currentKidId="k1"
      currentTermId={TERM.id}
      currentMonth="2026-09"
      prevMonth="2026-08"
      nextMonth="2026-10"
      terms={[TERM]}
      isFinalMonth={false}
      kidDetails={KID_DETAILS}
      academicDetails={ACADEMIC_DETAILS}
      initialReport={null}
      {...props}
    />
  );
}

describe('KidReportClient month picker', () => {
  it('disables previous navigation at the earliest eligible month', () => {
    renderClient({ prevMonth: null });

    expect(screen.getByLabelText('Bulan sebelumnya')).toHaveAttribute(
      'disabled'
    );
  });

  it('disables next navigation at the latest eligible month', () => {
    renderClient({ nextMonth: null });

    expect(screen.getByLabelText('Bulan berikutnya')).toHaveAttribute(
      'disabled'
    );
  });

  it('enables both directions when history exists on either side', () => {
    renderClient({});

    expect(screen.getByLabelText('Bulan sebelumnya')).not.toHaveAttribute(
      'disabled'
    );
    expect(screen.getByLabelText('Bulan berikutnya')).not.toHaveAttribute(
      'disabled'
    );
  });
});

describe('KidReportClient term final month', () => {
  it('hides the monthly narrative editor and generation controls', () => {
    renderClient({
      isFinalMonth: true,
      nextMonth: null,
      initialReport: {
        id: 'r1',
        narrative: 'draft',
        reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
        isEdited: false,
        sentAt: null,
      },
    });

    expect(
      screen.queryByPlaceholderText(
        'Buat draft dengan AI, atau tulis manual di sini'
      )
    ).toBeNull();
    expect(screen.queryByText('Regenerate')).toBeNull();
    expect(screen.queryByText('Simpan')).toBeNull();
  });

  it('links to the termly report instead', () => {
    renderClient({ isFinalMonth: true, nextMonth: null });

    const link = screen.getByText('Create termly report');
    expect(link.closest('a')?.getAttribute('href')).toBe(
      `/dashboard/report/quarterly/k1?termId=${TERM.id}`
    );
  });

  it('keeps observations visible in the final month', () => {
    renderClient({ isFinalMonth: true, nextMonth: null });

    expect(screen.getByText('Riwayat Observasi Bulan Ini')).toBeDefined();
  });

  it('shows the monthly editor for a non-final month', () => {
    renderClient({ isFinalMonth: false });

    expect(
      screen.getByPlaceholderText(
        'Buat draft dengan AI, atau tulis manual di sini'
      )
    ).toBeDefined();
    expect(screen.getByText('Buat Draft dengan AI')).toBeDefined();
  });
});

describe('KidReportClient term selector', () => {
  it('locks the selector when only one term is eligible for the month', () => {
    renderClient({ terms: [TERM] });

    expect(screen.getByRole('combobox')).toHaveAttribute('disabled');
  });

  it('enables the selector when multiple terms are eligible', () => {
    const second: Term = { ...TERM, id: 't2', name: 'Term 2' };
    renderClient({ terms: [TERM, second] });

    expect(screen.getByRole('combobox')).not.toHaveAttribute('disabled');
  });
});

const DRAFT_REPORT = {
  id: 'r1',
  narrative: 'Paragraf pertama laporan.\n\nSorotan:\n- Berani tampil',
  reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
  isEdited: false,
  sentAt: null,
};

describe('KidReportClient dirty state', () => {
  it('blocks regeneration while the editor has unsaved changes', () => {
    renderClient({ initialReport: DRAFT_REPORT });
    // An existing report opens on the readable preview.
    fireEvent.click(screen.getByText('Editor'));

    fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), {
      target: { value: `${DRAFT_REPORT.narrative} tambahan` },
    });

    expect(screen.getByText('Regenerate')).toHaveAttribute('disabled');
    expect(
      screen.getByText(/Simpan atau batalkan perubahan di editor/)
    ).toBeDefined();
    // Review/send require the edited content to be saved first.
    expect(screen.getByText('Tandai Direview')).toHaveAttribute('disabled');
    expect(screen.getByText('Kirim Laporan')).toHaveAttribute('disabled');
  });

  it('enables regeneration when the editor matches saved content', () => {
    renderClient({ initialReport: DRAFT_REPORT });

    expect(screen.getByText('Regenerate')).not.toHaveAttribute('disabled');
  });
});

describe('KidReportClient lifecycle badges and actions', () => {
  it('shows the manual-edit indication for a saved edit', () => {
    renderClient({
      initialReport: { ...DRAFT_REPORT, isEdited: true },
    });

    expect(screen.getByText('Diedit manual')).toBeDefined();
  });

  it('does not show the manual-edit indication for generated content', () => {
    renderClient({ initialReport: DRAFT_REPORT });

    expect(screen.queryByText('Diedit manual')).toBeNull();
  });

  it('disables sending a draft report — only reviewed reports can be sent', () => {
    renderClient({ initialReport: DRAFT_REPORT });

    expect(screen.getByText('Kirim Laporan')).toHaveAttribute('disabled');
    expect(screen.getByText('Tandai Direview')).not.toHaveAttribute('disabled');
  });

  it('enables sending a reviewed report', () => {
    renderClient({
      initialReport: {
        ...DRAFT_REPORT,
        reportStatus: MONTHLY_REPORT_STATUS.REVIEWED,
      },
    });

    expect(screen.getByText('Kirim Laporan')).not.toHaveAttribute('disabled');
    expect(screen.getByText('Sudah Direview')).toHaveAttribute('disabled');
  });

  it('locks a sent report — no edit, regenerate, review or send actions', () => {
    renderClient({
      initialReport: {
        ...DRAFT_REPORT,
        reportStatus: MONTHLY_REPORT_STATUS.SENT,
        sentAt: new Date('2026-10-31'),
      },
    });

    expect(screen.queryByText('Regenerate')).toBeNull();
    expect(screen.queryByText('Simpan')).toBeNull();
    expect(screen.queryByText('Tandai Direview')).toBeNull();
    expect(screen.queryByText('Kirim Laporan')).toBeNull();
    expect(screen.getByText(/tidak dapat diubah lagi/)).toBeDefined();
  });
});

describe('KidReportClient regeneration confirmation', () => {
  it('asks for explicit confirmation before replacing saved manual edits', () => {
    renderClient({ initialReport: { ...DRAFT_REPORT, isEdited: true } });

    fireEvent.click(screen.getByText('Regenerate'));

    expect(
      screen.getByText('Ganti laporan dengan draft AI baru?')
    ).toBeDefined();
    expect(screen.getByText(/perubahan manual Anda/)).toBeDefined();
    expect(screen.getByText('Ya, Ganti Laporan')).toBeDefined();
  });

  it('asks for confirmation before replacing a reviewed report', () => {
    renderClient({
      initialReport: {
        ...DRAFT_REPORT,
        reportStatus: MONTHLY_REPORT_STATUS.REVIEWED,
      },
    });

    fireEvent.click(screen.getByText('Regenerate'));

    expect(
      screen.getByText('Ganti laporan dengan draft AI baru?')
    ).toBeDefined();
    expect(screen.getByText(/hasil review/)).toBeDefined();
  });
});

describe('KidReportClient send confirmation', () => {
  it('requires explicit confirmation before marking a report sent', () => {
    renderClient({
      initialReport: {
        ...DRAFT_REPORT,
        reportStatus: MONTHLY_REPORT_STATUS.REVIEWED,
      },
    });

    fireEvent.click(screen.getByText('Kirim Laporan'));

    expect(screen.getByText('Kirim laporan ini?')).toBeDefined();
    expect(screen.getByText('Ya, Kirim Laporan')).toBeDefined();
  });
});

describe('KidReportClient preview', () => {
  it('renders the readable preview with headings and bullets', () => {
    renderClient({ initialReport: DRAFT_REPORT });

    fireEvent.click(screen.getByText('Pratinjau'));

    expect(screen.getByText('Sorotan:')).toBeDefined();
    expect(screen.getByText('Berani tampil')).toBeDefined();
    expect(screen.getByText('Paragraf pertama laporan.')).toBeDefined();
  });
});
