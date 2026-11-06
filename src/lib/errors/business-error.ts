import { AppError } from './app-error';

// Kid

export class NoKidFoundError extends AppError {
  constructor() {
    super('No kid found', 'Anak tidak ditemukan di sistem');
  }
}

// Enrollment

export class KidNotEnrolledError extends AppError {
  constructor() {
    super(
      'Kid not enrolled in current term',
      'Anak tidak terdaftar dalam batch ini'
    );
  }
}

// Daily Class Report & Observations

type NoDcrsErrorOptions = {
  month?: boolean;
  term?: boolean;
};

export class NoDcrsError extends AppError {
  constructor({ month, term }: NoDcrsErrorOptions = {}) {
    const context =
      month && term
        ? ''
        : month
          ? ' in this month'
          : term
            ? ' in this term'
            : '';

    const contextID =
      month && term
        ? ''
        : month
          ? ' di bulan ini'
          : term
            ? ' di batch ini'
            : '';

    super(
      `No daily class report data found${context}`,
      `Tidak ada data laporan kelas harian${contextID}`
    );
  }
}

export class NoKidObservationsError extends AppError {
  constructor() {
    super('No kid observations found', 'Belum ada observasi anak');
  }
}

// Monthly Kid Report

export class ReportAlreadySentError extends AppError {
  constructor() {
    super(
      'Monthly report already sent',
      'Laporan sudah terkirim dan tidak dapat diubah'
    );
  }
}

export class ReportNotFoundError extends AppError {
  constructor() {
    super('Monthly report not found', 'Laporan tidak ditemukan');
  }
}

export class FinalMonthUsesTermlyReportError extends AppError {
  constructor() {
    super(
      'Term final month uses termly reporting',
      'Bulan terakhir batch menggunakan laporan triwulanan, bukan laporan bulanan'
    );
  }
}

export class KidNoEligibleMonthsError extends AppError {
  constructor() {
    super(
      'Kid has no enrolled terms',
      'Anak belum terdaftar di batch mana pun. Daftarkan anak terlebih dahulu.'
    );
  }
}

export class KidNoReportHistoryError extends AppError {
  constructor() {
    super(
      'No reportable month has started yet',
      'Belum ada riwayat laporan. Laporan tersedia setelah batch berjalan.'
    );
  }
}

export class FutureMonthReportError extends AppError {
  constructor() {
    super(
      'Cannot report on a month that has not started',
      'Laporan belum bisa dibuat untuk bulan yang belum berjalan'
    );
  }
}
