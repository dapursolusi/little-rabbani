import { describe, expect, it } from 'vitest';

import { logger } from '@/lib/logger';

describe('logger', () => {
  it('is a pino logger instance with expected methods', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('logs at the configured level without throwing', () => {
    // These should not throw regardless of environment
    expect(() => {
      logger.info({ test: true }, 'unit test log');
    }).not.toThrow();
  });
});
