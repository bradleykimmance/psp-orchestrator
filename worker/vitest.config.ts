import { defineConfig } from 'vitest/config';

// One run covers both suites. Integration tests hit the live Stripe sandbox and
// self-skip when STRIPE_SECRET_KEY is absent (see the integration project's
// setup file), so `vitest run` is safe locally and in CI alike.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          environment: 'node',
          exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
          globals: true,
          include: ['test/**/*.test.ts'],
          name: 'unit',
        },
      },
      {
        test: {
          environment: 'node',
          globals: true,
          include: ['test/**/*.integration.test.ts'],
          name: 'integration',
          setupFiles: ['test/setup.integration.ts'],
        },
      },
    ],
  },
});
