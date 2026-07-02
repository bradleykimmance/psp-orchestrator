import { adyenAuthorize } from '../../../src/adapters/adyen/authorize.ts';
import { basicRequest, unitTestEnvironment } from '../../helpers.ts';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const environment = {
  ...unitTestEnvironment,
  ADYEN_API_KEY: process.env.ADYEN_API_KEY ?? '',
  ADYEN_MERCHANT_ACCOUNT: process.env.ADYEN_MERCHANT_ACCOUNT ?? '',
};

describe.skipIf(
  !process.env.ADYEN_API_KEY || !process.env.ADYEN_MERCHANT_ACCOUNT,
)('adyen authorize (live sandbox)', () => {
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
      environment,
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
      environment,
    );

    expect(result.status).toBe('refused');
    expect(result.errorCode).toBe('24');
    expect(result.errorMessage).toBe('CVC Declined');
  });
});
