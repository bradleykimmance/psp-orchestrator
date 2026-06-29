import { stripeAuthorize } from '../../../src/adapters/stripe/authorize.ts';
import { basicRequest, unitTestEnvironment } from '../../helpers.ts';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const environment = {
  ...unitTestEnvironment,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
};

describe.skipIf(!process.env.STRIPE_SECRET_KEY)(
  'stripe authorize (live sandbox)',
  () => {
    it('authorises a 4242 test card', async () => {
      const result = await stripeAuthorize(basicRequest(), environment);
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
        }),
        environment,
      );
      expect(result.status).toBe('refused');
    });
  },
);
