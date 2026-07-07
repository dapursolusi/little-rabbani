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
    'scripts/**',
    '.dependency-cruiser.mjs',
    'knip.json',
    '.jscpd.json',
    '.github/**',
  ]),
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      complexity: ['warn', { max: 10 }],
      'max-depth': ['warn', { max: 4 }],
      'max-params': ['warn', { max: 4 }],
      'max-nested-callbacks': ['warn', { max: 4 }],
      'max-statements': ['warn', { max: 25 }],
    },
  },
]);

export default eslintConfig;
