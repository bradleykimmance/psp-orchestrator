import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

// D1 binding here is a real (local) database, not a stub.
describe('worker bindings', () => {
  it('provides a queryable D1 binding', async () => {
    const row = await env.paymentsDB.prepare('SELECT 1 AS one').first();
    expect(row).toStrictEqual({ one: 1 });
  });
});
