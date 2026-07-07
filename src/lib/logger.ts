import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Structured logger with redaction support for sensitive fields.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info({ userId, action: 'created' }, 'User created');
 *   logger.error({ err }, 'Failed to process request');
 *
 * Redacted fields:
 *   - password, secret, token, authorization, cookie, key, creditcard
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  ...(isProduction
    ? {
        redact: {
          paths: [
            'password',
            '*.password',
            'secret',
            '*.secret',
            'token',
            '*.token',
            'authorization',
            'cookie',
            'apiKey',
            '*.apiKey',
            'creditcard',
            'ssn',
            'email',
            'phone',
          ],
          censor: '[REDACTED]',
        },
      }
    : {
        transport: {
          target: 'pino/file',
          options: {
            destination: 1,
          },
        },
      }),
});
