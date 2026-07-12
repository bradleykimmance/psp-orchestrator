// Applies the real migrations to the test D1 database before each test file
import { applyD1Migrations, type D1Migration } from 'cloudflare:test';
import { env } from 'cloudflare:workers';

const { paymentsDB, TEST_MIGRATIONS } = env as typeof env & {
  TEST_MIGRATIONS: D1Migration[];
};

await applyD1Migrations(paymentsDB, TEST_MIGRATIONS);
