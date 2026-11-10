import { ActionResult } from '@/types';

import { AppError } from '../errors';
import { logger } from '../logger';

export function handleActionError(error: unknown): ActionResult<never> {
  if (error instanceof AppError) {
    return {
      success: false as const,
      message: error.publicMessage,
    };
  }

  logger.error({ error }, 'Unexpected action error');

  return {
    success: false as const,
    message: 'Terjadi kesalahan. Silahkan coba lagi',
  };
}
