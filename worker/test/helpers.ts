import { type CanonicalRequest } from 'shared/canonical';

export const basicRequest = (
  overrides?: Partial<CanonicalRequest>,
): CanonicalRequest => {
  const body = {
    amount: 4_200,
    card: {
      cvc: '123',
      expiry: '1227',
      name: 'Brad Test',
      number: '4242424242424242',
    },
    currency: 'GBP',
    idempotencyKey: '7f0d0f2e-9d3a-4b6c-8a1e-2c5f4d7b9e01',
    psp: 'stripe' as const,
    reference: 'ORD-123',
  };

  return { ...body, ...overrides };
};
