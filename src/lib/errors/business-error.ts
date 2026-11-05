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
