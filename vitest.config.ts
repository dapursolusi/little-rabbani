import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    env: {
      DATABASE_URL: 'postgres://placeholder@localhost:5432/test',
    },
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    retry: 2,
    testTimeout: 10_000,
    reporters: ['default', 'verbose'],
    exclude: ['e2e/', 'node_modules/'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['e2e/', 'node_modules/', 'tests/setup.ts'],
      thresholds: {
        statements: 10,
        branches: 10,
        functions: 10,
        lines: 10,
      },
    },
  },
});
