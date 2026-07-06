import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'commitlint.config.mts',
    'lint-staged.config.mjs',
    'postcss.config.mjs',
    'prettier.config.mjs',
    'eslint.config.mjs',
    'env.mjs',
    'next.config.ts',
    'next.config.js',
    'playwright.config.ts',
    'vitest.config.ts',
    'sentry.edge.config.ts',
    'sentry.server.config.ts',
    'sentry.client.config.ts',
  ]),
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]);

export default eslintConfig;
