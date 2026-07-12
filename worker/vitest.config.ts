import {
  cloudflareTest,
  readD1Migrations,
} from '@cloudflare/vitest-pool-workers';
import path from 'node:path';
import process from 'node:process';
import { defineConfig } from 'vitest/config';

// Setup the correct tables for testing
const migrations = await readD1Migrations(
  path.join(import.meta.dirname, 'migrations'),
);

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
                TEST_MIGRATIONS: migrations,
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
          setupFiles: ['test/applyMigrations.ts'],
        },
      },
      {
        plugins: [
          cloudflareTest({
            miniflare: {
              // Omit unset secrets: explicit bindings override .dev.vars,
              // so empty values would clobber local ones.
              bindings: {
                ...(process.env.ADYEN_API_KEY
                  ? { ADYEN_API_KEY: process.env.ADYEN_API_KEY }
                  : {}),
                ...(process.env.ADYEN_MERCHANT_ACCOUNT
                  ? {
                      ADYEN_MERCHANT_ACCOUNT:
                        process.env.ADYEN_MERCHANT_ACCOUNT,
                    }
                  : {}),
                ...(process.env.STRIPE_SECRET_KEY
                  ? { STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY }
                  : {}),
                TEST_MIGRATIONS: migrations,
              },
            },
            wrangler: { configPath: './wrangler.jsonc' },
          }),
        ],
        test: {
          globals: true,
          include: ['test/**/*.integration.test.ts'],
          name: 'integration',
          setupFiles: ['test/applyMigrations.ts'],
        },
      },
    ],
  },
});
