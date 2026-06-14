import { stripeAdapter } from '../../src/adapters/stripe.ts';
import { type CanonicalRequest } from '../../src/canonical.ts';
import { describe, expect, it } from 'vitest';

const request: CanonicalRequest = {
  amount: 4_200,
  card: {
    cvc: '123',
    expiry: '1227',
    number: '4242424242424242',
  },
  currency: 'GBP',
  psp: 'stripe',
  reference: 'ORD-123',
};

describe('stripeAdapter (stub)', () => {
  it('is registered under the stripe id', () => {
    expect(stripeAdapter.id).toBe('stripe');
  });

  it('returns a fake authorised response carrying a stub reference', async () => {
    const result = await stripeAdapter.authorize(request);
    expect(result.status).toBe('authorised');
    expect(result.pspReference).toBe('stripe_stub_ORD-123');
    expect(result.rawResponse).toMatchObject({
      psp: 'stripe',
      reference: 'ORD-123',
    });
  });
});
