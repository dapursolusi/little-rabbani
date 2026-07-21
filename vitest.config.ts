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
      DIRECT_DATABASE_URL: 'postgres://placeholder@localhost:5432/test',
      BETTER_AUTH_SECRET: 'test-secret-12345',
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      OPENROUTER_API_KEY: 'test-openrouter-key',
      VAPID_PUBLIC_KEY: 'test-vapid-public-key',
      VAPID_PRIVATE_KEY: 'test-vapid-private-key',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_BETTER_AUTH_URL: 'http://localhost:3000',
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'test-vapid-public-key',
    },
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    retry: 2,
    testTimeout: 10_000,
    reporters: ['default', 'verbose'],
    exclude: ['e2e/', 'node_modules/'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
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
