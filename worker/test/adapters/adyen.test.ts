import { adyenAdapter } from '../../src/adapters/adyen.ts';
import { type CanonicalRequest } from '../../src/canonical.ts';
import { describe, expect, it } from 'vitest';

const request: CanonicalRequest = {
  amount: 4_200,
  card: { cvc: '737', expiry: '0327', number: '5555555555554444' },
  currency: 'GBP',
  psp: 'adyen',
  reference: 'ORD-123',
};

describe('adyenAdapter (stub)', () => {
  it('is registered under the adyen id', () => {
    expect(adyenAdapter.id).toBe('adyen');
  });

  it('returns a fake authorised response carrying a stub reference', async () => {
    const result = await adyenAdapter.authorize(request);
    expect(result.status).toBe('authorised');
    expect(result.pspReference).toBe('adyen_stub_ORD-123');
    expect(result.rawResponse).toMatchObject({
      psp: 'adyen',
      reference: 'ORD-123',
    });
  });
});
