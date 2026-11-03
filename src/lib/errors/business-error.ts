import { AppError } from './app-error';

export class KidNotEnrolledError extends AppError {
  constructor() {
    super(
      'Kid not enrolled in current term',
      'Anak tidak terdaftar dalam batch ini'
    );
  }
}

export class NoKidObservationsError extends AppError {
  constructor() {
    super('No kid observations found', 'Belum ada observasi anak');
  }
}
