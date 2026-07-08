import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [
          cloudflareTest({
            miniflare: {
              bindings: {
                ADYEN_API_KEY: 'Adyen_test_key',
                ADYEN_MERCHANT_ACCOUNT: 'SandboxMerchantECOM',
                ALLOWED_ORIGIN: '*',
                STRIPE_SECRET_KEY: 'sk_test_123',
              },
            },
            wrangler: { configPath: './wrangler.jsonc' },
          }),
        ],
        test: {
          exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
          globals: true,
          include: ['test/**/*.test.ts'],
          name: 'unit',
        },
      },
      {
        plugins: [
          cloudflareTest({
            wrangler: { configPath: './wrangler.jsonc' },
          }),
        ],
        test: {
          globals: true,
          include: ['test/**/*.integration.test.ts'],
          name: 'integration',
        },
      },
    ],
  },
});
