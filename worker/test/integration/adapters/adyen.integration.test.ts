import { adyenAuthorize } from '../../../src/adapters/adyen/authorize.ts';
import { basicRequest } from '../../helpers.ts';
import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

describe.skipIf(!env.ADYEN_API_KEY || !env.ADYEN_MERCHANT_ACCOUNT)(
  'adyen authorize (live sandbox)',
  () => {
    it('authorises an Adyen test card', async () => {
      const result = await adyenAuthorize(
        basicRequest({
          card: {
            cvc: '737',
            expiry: '0330',
            name: 'Brad Test',
            number: '4111111111111111',
          },
          idempotencyKey: crypto.randomUUID(),
        }),
        env,
      );

      expect(result.status).toBe('authorised');
      expect(result.pspReference).toBeTruthy();
    });

    it('declines an Adyen test card', async () => {
      const result = await adyenAuthorize(
        basicRequest({
          card: {
            cvc: '737',
            expiry: '0330',
            name: 'Brad Test',
            number: '4000000000000002',
          },
          idempotencyKey: crypto.randomUUID(),
        }),
        env,
      );

      expect(result.status).toBe('refused');
      expect(result.errorCode).toBe('24');
      expect(result.errorMessage).toBe('CVC Declined');
    });
  },
);
