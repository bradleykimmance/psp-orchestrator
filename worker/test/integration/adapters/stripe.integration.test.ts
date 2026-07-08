import { stripeAuthorize } from '../../../src/adapters/stripe/authorize.ts';
import { basicRequest } from '../../helpers.ts';
import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

describe.skipIf(!env.STRIPE_SECRET_KEY)(
  'stripe authorize (live sandbox)',
  () => {
    it('authorises a 4242 test card', async () => {
      const result = await stripeAuthorize(
        basicRequest({ idempotencyKey: crypto.randomUUID() }),
        env,
      );
      expect(result.status).toBe('authorised');
      expect(result.pspReference).toMatch(/^pi_/u);
    });

    it('refuses a declined test card (4000…0002)', async () => {
      const result = await stripeAuthorize(
        basicRequest({
          card: {
            cvc: '123',
            expiry: '1234',
            name: 'Integration Test',
            number: '4000000000000002',
          },
          idempotencyKey: crypto.randomUUID(),
        }),
        env,
      );
      expect(result.status).toBe('refused');
    });
  },
);
